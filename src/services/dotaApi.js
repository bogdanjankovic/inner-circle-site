const API_URL = 'https://api.opendota.com/api';

// Position to hero mapping based on common Dota 2 roles
const POSITION_HEROES = {
    1: [ // Carry
        1, 2, 3, 8, 10, 11, 13, 14, 16, 17, 19, 23, 26, 29, 31, 35, 42, 43, 46, 49, 52, 53, 58, 59, 65, 68, 69, 70, 71, 72, 73, 74, 78, 82, 94, 95, 98, 102, 106, 109, 114, 119, 120, 121, 123, 128, 129
    ],
    2: [ // Midlane
        4, 5, 7, 9, 12, 15, 18, 21, 22, 25, 27, 28, 30, 32, 33, 34, 36, 37, 38, 39, 40, 41, 44, 45, 47, 48, 50, 51, 54, 55, 56, 57, 60, 61, 62, 63, 64, 66, 67, 75, 76, 77, 79, 80, 81, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 96, 97, 99, 100, 101, 103, 104, 105, 107, 108, 110, 111, 112, 113, 115, 116, 117, 118, 122, 124, 125, 126, 127, 130
    ],
    3: [ // Offlaner
        6, 20, 24, 49, 54, 67, 71, 79, 84, 87, 91, 93, 96, 99, 101, 103, 105, 107, 110, 113, 115, 116, 117, 122, 124, 125, 126, 127, 130
    ],
    4: [ // Soft Support
        6, 20, 24, 49, 54, 67, 71, 79, 84, 87, 91, 93, 96, 99, 101, 103, 105, 107, 110, 113, 115, 116, 117, 122, 124, 125, 126, 127, 130
    ],
    5: [ // Hard Support
        6, 20, 24, 49, 54, 67, 71, 79, 84, 87, 91, 93, 96, 99, 101, 103, 105, 107, 110, 113, 115, 116, 117, 122, 124, 125, 126, 127, 130
    ]
};

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
 * Filters heroes by position and returns top 3 by games played
 * @param {Array} heroes - Array of hero data from OpenDota
 * @param {number} position - Position ID (1-5)
 * @returns {Array} Top 3 heroes for the position
 */
export const getTopHeroesByPosition = (heroes, position) => {
    if (!position || !POSITION_HEROES[position]) {
        // If no position specified, return all heroes (current behavior)
        return heroes
            .sort((a, b) => b.games - a.games)
            .slice(0, 3)
            .map(h => ({
                heroId: h.hero_id,
                games: h.games,
                win: h.win,
                winrate: ((h.win / h.games) * 100).toFixed(1)
            }));
    }

    const positionHeroes = POSITION_HEROES[position];
    
    return heroes
        .filter(hero => positionHeroes.includes(hero.hero_id))
        .sort((a, b) => b.games - a.games)
        .slice(0, 3)
        .map(h => ({
            heroId: h.hero_id,
            games: h.games,
            win: h.win,
            winrate: ((h.win / h.games) * 100).toFixed(1)
        }));
};

/**
 * Fetches comprehensive player data from OpenDota
 * @param {string} steamId - SteamID64 or AccountID
 * @param {number} position - Position ID (1-5) for position-specific heroes
 */
export const getHeroConstants = async () => {
    try {
        const response = await fetch(`${API_URL}/constants/heroes`);
        if (!response.ok) throw new Error('Failed to fetch hero constants');
        return await response.json();
    } catch (error) {
        console.error('Error fetching hero constants:', error);
        return {};
    }
};

export const fetchPlayerData = async (steamId, position = null) => {
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

        // Top 3 Heroes by position (or all heroes if no position specified)
        const topHeroes = getTopHeroesByPosition(heroes, position);

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

// Singleton promise to prevent race conditions when multiple components mount simultaneously
let heroFetchPromise = null;

// Hero ID to Name mapping using the lighter /heroes endpoint
export const fetchHeroConstants = async () => {
    // 1. Check Memory Cache (fastest) - handled by caller usually, but good to have here too if we export a getter.
    // For now we rely on localStorage as the persistence layer.

    // 2. Check LocalStorage
    try {
        const localData = localStorage.getItem('dota_hero_stats');
        if (localData) {
            const parsed = JSON.parse(localData);
            // Optional: Check expiry (e.g. 1 day)
            // const age = Date.now() - parsed.timestamp;
            // if (age < 86400000) return parsed.data;
            if (parsed && Object.keys(parsed).length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn("Failed to read hero stats from localStorage", e);
    }

    // 3. Check for existing in-flight request
    if (heroFetchPromise) {
        return heroFetchPromise;
    }

    // 4. Fetch from Network
    heroFetchPromise = (async () => {
        try {
            console.log("Fetching Hero Stats from API...");
            // Removed cache-busting timestamp to allow browser caching
            const res = await fetch(`${API_URL}/heroStats`);

            if (res.status === 429) {
                console.error("Rate limited (429) fetching heroes.");
                return null;
            }

            if (!res.ok) {
                console.error(`Hero fetch failed with status: ${res.status}`);
                return null;
            }

            const heroesArray = await res.json();

            // Transform array into a map: { 1: { ...heroData }, 2: { ... } }
            const heroMap = {};
            heroesArray.forEach(hero => {
                heroMap[hero.id] = hero;
            });

            if (Object.keys(heroMap).length === 0) {
                return null;
            }

            // Save to LocalStorage
            try {
                localStorage.setItem('dota_hero_stats', JSON.stringify(heroMap));
            } catch (storageErr) {
                console.warn("Quota exceeded likely, couldn't save heroes to storage.");
            }

            return heroMap;
        } catch (e) {
            console.error("Failed to fetch hero constants:", e);
            return null;
        } finally {
            heroFetchPromise = null; // Reset promise so we can retry later if failed
        }
    })();

    return heroFetchPromise;
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
