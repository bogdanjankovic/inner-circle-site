const { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Config
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

console.log('🚀 Pokrećem bota...');

// Pomoćna funkcija za uzimanje varijable (sa ili bez VITE_ prefiksa)
const getEnv = (name) => process.env[name] || process.env[`VITE_${name}`];

const token = getEnv('DISCORD_TOKEN');
const guildId = getEnv('GUILD_ID');
const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_KEY'); // Fallback na SUPABASE_KEY

// Dijagnostika (bezbedno logovanje)
console.log('--- Dijagnostika okruženja ---');
console.log(`DISCORD_TOKEN: ${token ? '✅ PRISUTAN' : '❌ NEDOSTAJE'}`);
console.log(`GUILD_ID: ${guildId ? '✅ PRISUTAN' : '❌ NEDOSTAJE'}`);
console.log(`SUPABASE_URL: ${supabaseUrl ? '✅ PRISUTAN' : '❌ NEDOSTAJE'}`);
console.log(`SUPABASE_KEY: ${supabaseKey ? '✅ PRISUTAN' : '❌ NEDOSTAJE'}`);
console.log('------------------------------');

if (!token || !guildId || !supabaseUrl || !supabaseKey) {
    console.error('❌ Greška: Nedostaju kritične varijable iznad!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const GUILD_ID = guildId;
const CATEGORY_ID = getEnv('VOICE_CATEGORY_ID');

client.on('error', (error) => {
    console.error('❌ Discord client greška:', error);
});

client.once('ready', (c) => {
    console.log(`🤖 Bot je online kao ${c.user.tag}`);

    // Start listening to Supabase changes
    setupRealtimeSubscription();
});

function setupRealtimeSubscription() {
    console.log('📡 Slušam promene u bazi...');

    supabase
        .channel('tournament_changes')
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'tournaments' },
            (payload) => {
                const newData = payload.new;
                const oldData = payload.old;

                // Detect if bracket_data changed (meaning matches were scheduled/updated)
                if (JSON.stringify(newData.bracket_data) !== JSON.stringify(oldData.bracket_data)) {
                    processBracketUpdate(newData);
                }
            }
        )
        .subscribe();
}

async function processBracketUpdate(tournament) {
    // Clone to avoid mutation issues
    const matches = JSON.parse(JSON.stringify(tournament.bracket_data || []));
    let updated = false;

    for (const match of matches) {
        // We only care about scheduled matches that have teams but NO channels yet
        if (match.team1 && match.team2 && match.scheduledTime && !match.channelsCreated) {
            console.log(`🎬 Kreiram kanale za meč: ${match.team1.name} vs ${match.team2.name}`);

            try {
                await createMatchChannels(match, tournament.name);
                match.channelsCreated = true;
                updated = true;
            } catch (err) {
                console.error('Greška pri kreiranju kanala:', err);
            }
        }
    }

    // Persist changes back to DB
    if (updated) {
        console.log('💾 Ažuriram bazu sa statusom kreiranih kanala...');
        const { error } = await supabase
            .from('tournaments')
            .update({ bracket_data: matches })
            .eq('id', tournament.id);

        if (error) console.error('Greška pri ažuriranju baze:', error);
        else console.log('✅ Baza uspešno ažurirana.');
    }
}

async function createMatchChannels(match, tournamentName) {
    const guild = await client.guilds.fetch(GUILD_ID);
    const adminIds = (getEnv('ADMIN_DISCORD_IDS') || '').split(',').map(id => id.trim()).filter(id => id);

    const teams = [match.team1, match.team2];

    for (const team of teams) {
        const channelName = `🔊 ${team.name}`;

        const overwrites = [
            {
                id: guild.id, // @everyone
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: client.user.id, // The Bot
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Connect, PermissionFlagsBits.MoveMembers],
            }
        ];

        // Add Website Admins (Full access to all channels)
        adminIds.forEach(adminId => {
            overwrites.push({
                id: adminId,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.Connect,
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.MoveMembers,
                    PermissionFlagsBits.MuteMembers,
                    PermissionFlagsBits.DeafenMembers
                ],
            });
        });

        // Add Players and Team Captains
        team.players.forEach(p => {
            if (!p.discord_id) return;

            const isCaptain = p.isCaptain || p.is_captain || p.role === 'captain';

            if (isCaptain) {
                // Captains get "Modify Channel" type permissions
                overwrites.push({
                    id: p.discord_id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.Connect,
                        PermissionFlagsBits.Speak,
                        PermissionFlagsBits.ManageChannels, // Modify channel (name, limit etc)
                        PermissionFlagsBits.MoveMembers,   // Drag people
                        PermissionFlagsBits.MuteMembers,
                        PermissionFlagsBits.PrioritySpeaker
                    ],
                });
            } else {
                // Regular players
                overwrites.push({
                    id: p.discord_id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.Connect,
                        PermissionFlagsBits.Speak
                    ],
                });
            }
        });

        const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildVoice,
            parent: CATEGORY_ID || null,
            permissionOverwrites: overwrites
        });

        if (team.players.some(p => p.discord_id)) {
            console.log(`✅ Kreiran kanal: ${channelName} (Igrači: ${team.players.filter(p => p.discord_id).length})`);
        } else {
            console.log(`⚠️  Kreiran prazan kanal: ${channelName} (Nijedan igrač nema unet Discord ID)`);
        }
    }
}

client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('🔑 Login uspešan!'))
    .catch(err => console.error('❌ Login neuspešan:', err));

// Globalni error handler
process.on('unhandledRejection', error => {
    console.error('🚨 Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('🚨 Uncaught exception:', error);
    process.exit(1);
});
