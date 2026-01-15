export const DISCORD_AVATARS = {
    DEFAULT: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/invoker.png",
    NEW_TEAM: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/arc_warden.png",
    NEW_TOURNAMENT: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/pudge.png",
    SCHEDULE: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/abaddon.png",
    WINNER: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/kez.png"
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
