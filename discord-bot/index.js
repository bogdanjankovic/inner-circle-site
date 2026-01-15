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

// Provera varijabli pre startovanja
const requiredEnv = [
    'DISCORD_TOKEN',
    'GUILD_ID',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
];

const missing = requiredEnv.filter(k => !process.env[k]);
if (missing.length > 0) {
    console.error(`❌ Greška: Nedostaju sledeće varijable: ${missing.join(', ')}`);
    console.log('💡 Proverite Railway > Variables sekciju.');
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GUILD_ID = process.env.GUILD_ID;
const CATEGORY_ID = process.env.VOICE_CATEGORY_ID;

client.on('error', (error) => {
    console.error('❌ Discord client greška:', error);
});

client.once('ready', () => {
    console.log(`🤖 Bot je online kao ${client.user.tag}`);

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
    const matches = tournament.bracket_data || [];

    for (const match of matches) {
        // We only care about scheduled matches that have teams but NO channels yet
        // In a real app, we should track which matches already have channels to avoid duplicates
        if (match.team1 && match.team2 && match.scheduledTime && !match.channelsCreated) {
            console.log(`🎬 Kreiram kanale za meč: ${match.team1.name} vs ${match.team2.name}`);

            try {
                await createMatchChannels(match, tournament.name);
                // Note: Ideally, we should update the DB here to mark match.channelsCreated = true
                // But since we are listening to the SAME table, we need to be careful with infinite loops.
                // A better way is a separate 'match_channels' table.
            } catch (err) {
                console.error('Greška pri kreiranju kanala:', err);
            }
        }
    }
}

async function createMatchChannels(match, tournamentName) {
    const guild = await client.guilds.fetch(GUILD_ID);

    const teams = [match.team1, match.team2];

    for (const team of teams) {
        const channelName = `🔊 ${team.name}`;

        // Find player Discord IDs
        const discordIds = team.players
            .map(p => p.discord_id)
            .filter(id => id); // Only those with ID

        const overwrites = [
            {
                id: guild.id, // @everyone
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: client.user.id, // The Bot
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Connect],
            }
        ];

        // Add specific players
        discordIds.forEach(dId => {
            overwrites.push({
                id: dId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
            });
        });

        const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildVoice,
            parent: CATEGORY_ID || null,
            permissionOverwrites: overwrites
        });

        console.log(`✅ Kreiran kanal: ${channelName} (Dozvole postavljene za ${discordIds.length} igrača)`);
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
