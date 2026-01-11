const API_URL = 'https://api.opendota.com/api';

/**
 * Converts SteamID64 to SteamID32 (Account ID)
 * @param {string} steamId64 
 * @returns {string} accountId
 */
export const steamIdToAccountId = (steamId64) => {
    try {
        const bigId = BigInt(steamId64);
        const offset = BigInt('76561197960265728');
        return (bigId - offset).toString();
    } catch (e) {
        console.warn("Invalid SteamID format, assuming it is already AccountID or invalid:", steamId64);
        return steamId64; // Fallback or assume it's already 32-bit if small enough
    }
};

/**
 * Fetches comprehensive player data from OpenDota
 * @param {string} steamId - SteamID64 or AccountID
 */
export const fetchPlayerData = async (steamId) => {
    // Basic heuristic: if length > 12 likely SteamID64
    const accountId = steamId.length > 12 ? steamIdToAccountId(steamId) : steamId;

    try {
        // 1. Fetch Profile & Rank
        const profileReq = fetch(`${API_URL}/players/${accountId}`);

        // 2. Fetch Win/Loss
        const wlReq = fetch(`${API_URL}/players/${accountId}/wl`);

        // 3. Fetch Recent Matches (for GPM/XPM/KDA averages)
        const matchesReq = fetch(`${API_URL}/players/${accountId}/recentMatches`);

        // 4. Fetch Heroes (for top heroes)
        const heroesReq = fetch(`${API_URL}/players/${accountId}/heroes`);

        const [profileRes, wlRes, matchesRes, heroesRes] = await Promise.all([
            profileReq, wlReq, matchesReq, heroesReq
        ]);

        if (!profileRes.ok) throw new Error('Failed to fetch profile');

        const profile = await profileRes.json();
        const wl = await wlRes.json();
        const matches = await matchesRes.json();
        const heroes = await heroesRes.json();

        // Calculate Averages from recent matches (last 20)
        let totalGpm = 0, totalXpm = 0, totalKills = 0, totalDeaths = 0, totalAssists = 0, totalLH = 0, totalDN = 0;
        const count = matches.length || 1;

        matches.forEach(m => {
            totalGpm += m.gold_per_min || 0;
            totalXpm += m.xp_per_min || 0;
            totalKills += m.kills || 0;
            totalDeaths += m.deaths || 0;
            totalAssists += m.assists || 0;
            totalLH += m.last_hits || 0;
            totalDN += m.denies || 0;
        });

        const stats = {
            gpm: Math.round(totalGpm / count),
            xpm: Math.round(totalXpm / count),
            kills: (totalKills / count).toFixed(1),
            deaths: (totalDeaths / count).toFixed(1),
            assists: (totalAssists / count).toFixed(1),
            cs: `${Math.round(totalLH / count)}/${Math.round(totalDN / count)}`
        };

        // Top 3 Heroes
        // heroes endpoint returns all heroes. Sort by games played? Or winrate? 
        // User said "najigraniji heroji" (most played).
        const topHeroes = heroes
            .sort((a, b) => b.games - a.games)
            .slice(0, 3)
            .map(h => ({
                heroId: h.hero_id,
                games: h.games,
                win: h.win,
                winrate: ((h.win / h.games) * 100).toFixed(1) // Calculate winrate here
            }));

        const winrate = ((wl.win / (wl.win + wl.lose || 1)) * 100).toFixed(1);

        return {
            valid: true,
            accountId: profile.profile?.account_id ? profile.profile.account_id.toString() : accountId,
            steamId: profile.profile?.steamid,
            personaName: profile.profile?.personaname || 'Unknown',
            avatar: profile.profile?.avatarfull,
            rankTier: profile.rank_tier,
            leaderboardRank: profile.leaderboard_rank,
            country: profile.profile?.loccountrycode,
            mmrEstimate: profile.mmr_estimate?.estimate,
            winCount: wl.win,
            lossCount: wl.lose,
            winrate: winrate,
            stats: stats,
            topHeroes: topHeroes
        };

    } catch (error) {
        console.error("Error fetching Dota data:", error);
        return { valid: false, error: error.message };
    }
};

// Hero ID to Name mapping using the lighter /heroes endpoint
export const fetchHeroConstants = async () => {
    try {
        console.log("Fetching Hero Stats...");
        const res = await fetch(`${API_URL}/heroStats?t=${Date.now()}`);
        if (!res.ok) {
            console.error(`Hero fetch failed with status: ${res.status}`);
            return null;
        }
        const heroesArray = await res.json();
        console.log(`API returned ${heroesArray.length} heroes.`);
        if (heroesArray.length > 0) {
            console.log("Sample hero data:", heroesArray[0]);
        }

        // Transform array into a map: { 1: { ...heroData }, 2: { ... } }
        const heroMap = {};
        heroesArray.forEach(hero => {
            heroMap[hero.id] = hero;
        });

        if (Object.keys(heroMap).length === 0) {
            console.warn("Fetched hero stats but map is empty.");
            return null;
        }

        console.log(`Cached ${Object.keys(heroMap).length} heroes.`);
        return heroMap;
    } catch (e) {
        console.error("Failed to fetch hero constants:", e);
        return null;
    }
}

/**
 * Fetches detailed match data and parses granular stats
 * @param {string} matchId 
 */
export const getMatchDetails = async (matchId) => {
    try {
        const res = await fetch(`${API_URL}/matches/${matchId}`);
        if (!res.ok) throw new Error("Match not found");
        const match = await res.json();

        // Parse granular stats for each player
        const playerStats = match.players.map(p => {
            // Calculate Objectives from logs if available, or player fields
            // Note: OpenDota processes some of this into 'p.benchmarks' or specific fields
            // Tormentor kills are often in 'killed' unit names or objective log

            // "Madstones" -> Neutral Tokens. Item IDs for tokens are neutral_item_tier_1_token etc.
            // We count how many tokens they picked up/used? Or just neutral items found.
            // For now, mapping 'neutral_kills' or similar.

            return {
                accountId: p.account_id ? p.account_id.toString() : null,
                heroId: p.hero_id,
                kills: p.kills,
                deaths: p.deaths,
                assists: p.assists,
                gpm: p.gold_per_min,
                xpm: p.xp_per_min,
                lastHits: p.last_hits,
                denies: p.denies,

                // Deep Stats
                heroDamage: p.hero_damage,
                towerDamage: p.tower_damage,
                heroHealing: p.hero_healing,

                // Specifics (approximation as some require parsing logs which is heavy for frontend)
                roshansKilled: p.roshan_kills || 0, // OpenDota exposes this
                towersKilled: p.tower_kills || 0,
                tormentorsKilled: 0, // Need to parse combat log or objective log usually
                runesActivated: p.rune_pickups || 0, // Total runes

                // "Madstones" / Neutral Tokens found
                neutralTokens: p.item_neutral ? 1 : 0, // Simplified: Holds a neutral item

                // Items (for icons)
                items: [p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5],
                backpack: [p.backpack_0, p.backpack_1, p.backpack_2],
                neutralItem: p.item_neutral
            };
        });

        // Advanced Parsing for Tormentors/Aegis from objectives if available
        if (match.objectives) {
            match.objectives.forEach(obj => {
                // Example: { type: "CHAT_MESSAGE_ROSHAN_KILL", player_slot: X }
                // Tormentor parsing might need combat log string matching if not in objectives
            });
        }

        return {
            matchId: match.match_id,
            duration: match.duration,
            winner: match.radiant_win ? 'Radiant' : 'Dire',
            players: playerStats
        };

    } catch (e) {
        console.error("Match fetch failed:", e);
        return null;
    }
};
