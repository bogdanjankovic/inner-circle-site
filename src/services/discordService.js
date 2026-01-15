export const DISCORD_AVATARS = {
    DEFAULT: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/invoker.png",
    NEW_TEAM: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/arc_warden.png",
    NEW_TOURNAMENT: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/pudge.png",
    SCHEDULE: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/abaddon.png",
    WINNER: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/kez.png",
    LFG: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/meepo.png"
};

export const sendDiscordWebhook = async (webhookUrl, content, embed = null, avatarUrl = null) => {
    if (!webhookUrl) {
        console.warn('Discord Webhook URL not configured');
        return;
    }

    const payload = {
        content: content,
        username: "DotaSrbija Bot",
        avatar_url: avatarUrl || DISCORD_AVATARS.DEFAULT
    };

    if (embed) {
        payload.embeds = [embed];
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error('Failed to send Discord webhook:', response.statusText);
        }
    } catch (error) {
        console.error('Error sending Discord webhook:', error);
    }
};

export const formatMatchResultEmbed = (match, team1Name, team2Name, winnerName, matchUrl = null) => {
    const embed = {
        title: `🏆 Meč Završen: ${team1Name} vs ${team2Name}`,
        description: `**Pobednik:** ${winnerName}\n**Skor:** ${match.team1Score || 0} - ${match.team2Score || 0}`,
        color: 5763719, // Green
        fields: [
            {
                name: "Format",
                value: match.format ? match.format.toUpperCase() : "BO1",
                inline: true
            },
            {
                name: "Match ID",
                value: match.matchId.toString(),
                inline: true
            }
        ],
        footer: {
            text: "DotaSrbija"
        },
        timestamp: new Date().toISOString()
    };

    if (matchUrl) {
        embed.url = matchUrl;
        embed.fields.push({
            name: "Detalji Meča",
            value: `[Pogledaj Statistiku](${matchUrl})`,
            inline: false
        });
    }

    return embed;
};

export const formatTournamentWinEmbed = (tournamentName, winnerName, tournamentUrl = null) => {
    const embed = {
        title: `👑 NOVI ŠAMPION!`,
        description: `Čestitamo timu **${winnerName}** na osvajanju turnira **${tournamentName}**! 🎉`,
        color: 16766720, // Gold
        thumbnail: {
            url: "https://cdn-icons-png.flaticon.com/512/864/864802.png" // Trophy icon
        },
        footer: {
            text: "DotaSrbija"
        },
        timestamp: new Date().toISOString()
    };

    if (tournamentUrl) {
        embed.url = tournamentUrl;
        embed.description += `\n\n[Pogledaj Rezultate](${tournamentUrl})`;
    }

    return embed;
};

export const formatNewTeamEmbed = (team, playerCount, avgRankTier) => {
    // Generate rank text or default
    const rankText = avgRankTier ? `~Rank Tier: ${Math.round(avgRankTier)}` : 'Unranked';

    return {
        title: `🛡️ Novi Tim Registrovan: ${team.name}`,
        description: `**${team.name}** se upravo pridružio turniru!`,
        color: 3447003, // Blue
        thumbnail: {
            url: team.logo || "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/discord.svg"
        },
        fields: [
            {
                name: "Kapiten",
                value: team.captainName || "N/A",
                inline: true
            },
            {
                name: "Broj Igrača",
                value: playerCount.toString(),
                inline: true
            },
            {
                name: "Power Rank",
                value: rankText, // Could be enhanced with relative rank if passed
                inline: true
            }
        ],
        footer: {
            text: "DotaSrbija"
        },
        timestamp: new Date().toISOString()
    };
};

export const formatNewTournamentEmbed = (tournament) => {
    return {
        title: `🏆 Novi Turnir Najavljen: ${tournament.name}`,
        description: `Otvorene su prijave/Počinje turnir **${tournament.name}**!`,
        color: 15844367, // Orange
        fields: [
            {
                name: "Format",
                value: tournament.type === 'round_robin' ? 'Round Robin (Svako sa svakim)' : 'Single Elimination',
                inline: true
            },
            {
                name: "Meč Format",
                value: (tournament.match_format || 'BO1').toUpperCase(),
                inline: true
            }
        ],
        footer: {
            text: "DotaSrbija"
        },
        timestamp: new Date().toISOString()
    };
};

export const formatMatchScheduledEmbed = (team1Name, team2Name, startTime, matchUrl = null) => {
    const timeString = new Date(startTime).toLocaleString('sr-RS', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const embed = {
        title: `📅 Meč Zakazan: ${team1Name} vs ${team2Name}`,
        description: `Novi meč je zakazan!`,
        color: 10181046, // Purple
        fields: [
            {
                name: "Vreme Početka",
                value: timeString,
                inline: false
            }
        ],
        footer: {
            text: "DotaSrbija"
        },
        timestamp: new Date().toISOString()
    };

    if (matchUrl) {
        embed.url = matchUrl;
        embed.fields.push({
            name: "Link",
            value: `[Idi na stranicu meča](${matchUrl})`,
            inline: false
        });
    }

    return embed;
};

/**
 * Format LFG (Looking For Group) player embed for shuffle tournaments
 */
export const formatLfgPlayerEmbed = (player, playerUrl = null) => {
    // Position names mapping
    const positionNames = {
        1: 'Carry',
        2: 'Mid',
        3: 'Offlane',
        4: 'Soft Support',
        5: 'Hard Support'
    };

    const preferredPositionsText = player.preferred_positions
        .map(p => positionNames[p] || `Pos ${p}`)
        .join(', ');

    const embed = {
        title: `🎯 Igrač Traži Ekipu: ${player.persona_name}`,
        description: `**${player.persona_name}** se pridružio listi igrača koji traže tim za shuffle turnir!`,
        color: 16753920, // Orange
        thumbnail: {
            url: player.avatar || "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/discord.svg"
        },
        fields: [
            {
                name: "Preferirane Pozicije",
                value: preferredPositionsText,
                inline: true
            },
            {
                name: "Rank",
                value: player.rank_tier ? `Tier ${player.rank_tier}` : 'Nepoznat',
                inline: true
            },
            {
                name: "Winrate",
                value: player.winrate ? `${player.winrate}%` : 'N/A',
                inline: true
            }
        ],
        footer: {
            text: "DotaSrbija"
        },
        timestamp: new Date().toISOString()
    };

    if (playerUrl) {
        embed.url = playerUrl;
        embed.fields.push({
            name: "Profil",
            value: `[Pogledaj na sajtu](${playerUrl})`,
            inline: false
        });
    }

    return embed;
};

/**
 * Format Shuffle Teams embed for Discord notification when teams are formed
 */
export const formatShuffleTeamsEmbed = (teams, shuffleUrl = null) => {
    const positionEmojis = {
        1: '🗡️',
        2: '⚡',
        3: '🛡️',
        4: '💚',
        5: '💙'
    };

    const teamFields = teams.map(team => {
        const roster = [1, 2, 3, 4, 5].map(pos => {
            const player = team.positions[pos];
            if (player) {
                return `${positionEmojis[pos]} **Pos ${pos}:** ${player.persona_name}`;
            }
            return `${positionEmojis[pos]} **Pos ${pos}:** ❌ Prazno`;
        }).join('\n');

        const avgRank = Math.round(team.totalRank / 5);

        return {
            name: `🎮 ${team.name}`,
            value: `${roster}\n\n📊 *Prosečan rank: ${avgRank}*`,
            inline: true
        };
    });

    const embed = {
        title: `🎲 SHUFFLE TIMOVI SU FORMIRANI!`,
        description: `**${teams.length} tim${teams.length > 1 ? 'a' : ''}** je uspešno formirano za shuffle turnir!`,
        color: 5763719, // Green
        fields: teamFields,
        footer: {
            text: "DotaSrbija Shuffle Tournament"
        },
        timestamp: new Date().toISOString()
    };

    if (shuffleUrl) {
        embed.url = shuffleUrl;
        embed.fields.push({
            name: "🔗 Link",
            value: `[Pogledaj sve timove](${shuffleUrl})`,
            inline: false
        });
    }

    return embed;
};
