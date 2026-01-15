const API_URL = 'https://api.opendota.com/api';
import { heroCache } from './heroCache.js';
import { getTopHeroesByPositionStratz, steamIdToStratzAccountId, getTopDotaPlusHeroes } from './stratzApi.js';

// Lane to position mapping based on Dota 2 lane system
// OpenDota tracks by lane, not by position/role
const LANE_TO_POSITION = {
    1: 'safe_lane',   // Carry
    2: 'mid_lane',    // Midlaner  
    3: 'off_lane',    // Offlaner
    4: 'off_lane',    // Soft Support
    5: 'safe_lane'    // Hard Support
};

// Position names for display
const POSITION_NAMES = {
    1: 'Carry',
    2: 'Midlane',
    3: 'Offlaner',
    4: 'Soft Support',
    5: 'Hard Support'
};

/**
 * Calculate additional stats from recent matches
 * @param {Array} recentMatches - Array of recent match data
 * @returns {Object} Calculated stats
 */
const calculateStatsFromRecentMatches = (recentMatches) => {
    if (!recentMatches || recentMatches.length === 0) {
        return {
            avgKDA: 0,
            avgGPM: 0,
            avgXPM: 0,
            winrate: 0
        };
    }

    const validMatches = recentMatches.filter(match => match && match.kda);

    if (validMatches.length === 0) {
        return {
            avgKDA: 0,
            avgGPM: 0,
            avgXPM: 0,
            winrate: 0
        };
    }

    const totalKDA = validMatches.reduce((sum, match) => sum + match.kda, 0);
    const totalGPM = validMatches.reduce((sum, match) => sum + (match.gold_per_min || 0), 0);
    const totalXPM = validMatches.reduce((sum, match) => sum + (match.xp_per_min || 0), 0);
    const wins = validMatches.filter(match => match.player_slot !== undefined ? (match.player_slot < 128 ? match.radiant_win : !match.radiant_win) : false).length;

    return {
        avgKDA: (totalKDA / validMatches.length).toFixed(2),
        avgGPM: Math.round(totalGPM / validMatches.length),
        avgXPM: Math.round(totalXPM / validMatches.length),
        winrate: ((wins / validMatches.length) * 100).toFixed(1)
    };
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
 * Fetches heroes by position using OpenDota with STRATZ fallback
 * @param {string} accountId - Player's account ID
 * @param {number} position - Position ID (1-5)
 * @returns {Array} Top 3 heroes for the position
 */
export const getTopHeroesByPosition = async (accountId, position, steamId64) => {
    console.log('=== getTopHeroesByPosition CALLED ===');
    console.log('accountId:', accountId);
    console.log('position:', position);
    console.log('steamId64:', steamId64);

    // Only try STRATZ for position-specific heroes (not all-time)
    if (position && position !== 0) {
        try {
            console.log('Attempting STRATZ API for position:', position, 'accountId:', accountId);
            const stratzAccountId = steamIdToStratzAccountId(steamId64 || accountId);
            console.log('STRATZ Account ID:', stratzAccountId);
            const stratzHeroes = await getTopHeroesByPositionStratz(stratzAccountId, position);
            console.log('STRATZ heroes found:', stratzHeroes.length);

            if (stratzHeroes.length > 0) {
                console.log('Using STRATZ data - precise position statistics');
                return stratzHeroes;
            } else {
                console.log('STRATZ returned 0 heroes, falling back to OpenDota');
            }
        } catch (error) {
            console.error('STRATZ API failed, falling back to OpenDota:', error.message);
            console.error('Full error:', error);
        }
    }

    // Fallback to OpenDota
    if (!position || !LANE_TO_POSITION[position]) {
        console.log('=== USING OPENDOTA ALL HEROES ===');
        console.log('position:', position, 'accountId:', accountId);
        // If no position specified, return all heroes
        try {
            console.log('=== FETCHING FROM OPENDOTA ===');
            const response = await fetch(`${API_URL}/players/${accountId}/heroes`);
            console.log('OPENDOTA Response status:', response.status);
            const heroes = await response.json();
            console.log('OPENDOTA Heroes count:', heroes.length);

            // Prvo pokušaj sa minimum 10 igara
            let filteredHeroes = heroes.filter(h => h.games >= 10);

            if (filteredHeroes.length < 3) {
                // Ako nema dovoljno heroja sa 10+ igara, spusti na 5 igara
                filteredHeroes = heroes.filter(h => h.games >= 5);
            }

            if (filteredHeroes.length < 3) {
                // Ako i dalje nema dovoljno, uzmi sve sa najmanje 1 igrom
                filteredHeroes = heroes.filter(h => h.games >= 1);
            }

            return filteredHeroes
                .sort((a, b) => b.games - a.games)
                .slice(0, 10) // Uzmi top 10 po igrama
                // Zatim sortiraj po winrate među najigranijima
                .sort((a, b) => (b.win / b.games) - (a.win / a.games))
                .slice(0, 3) // Uzmi top 3 po winrate-u
                .map(h => ({
                    heroId: h.hero_id,
                    games: h.games,
                    win: h.win,
                    winrate: ((h.win / h.games) * 100).toFixed(1)
                }));
        } catch (error) {
            console.error('Error fetching heroes:', error);
            return [];
        }
    }

    const lane = LANE_TO_POSITION[position];

    try {
        // Fetch heroes by specific lane (this is the correct endpoint)
        const response = await fetch(`${API_URL}/players/${accountId}/heroes?lane=${lane}`);
        const heroes = await response.json();

        // Prvo pokušaj sa minimum 10 igara
        let filteredHeroes = heroes.filter(h => h.games >= 10);

        if (filteredHeroes.length < 3) {
            // Ako nema dovoljno heroja sa 10+ igara, spusti na 5 igara
            filteredHeroes = heroes.filter(h => h.games >= 5);
        }

        if (filteredHeroes.length < 3) {
            // Ako i dalje nema dovoljno, uzmi sve sa najmanje 1 igrom
            filteredHeroes = heroes.filter(h => h.games >= 1);
        }

        return filteredHeroes
            .sort((a, b) => b.games - a.games)
            .slice(0, 10) // Uzmi top 10 po igrama
            // Zatim sortiraj po winrate među najigranijima
            .sort((a, b) => (b.win / b.games) - (a.win / a.games))
            .slice(0, 3) // Uzmi top 3 po winrate-u
            .map(h => ({
                heroId: h.hero_id,
                games: h.games,
                win: h.win,
                winrate: ((h.win / h.games) * 100).toFixed(1)
            }));
    } catch (error) {
        console.error(`Error fetching ${lane} heroes:`, error);
        return [];
    }
};

/**
 * Fetches comprehensive player data from OpenDota
 * @param {string} steamId - SteamID64 or AccountID
 * @param {number} position - Position ID (1-5) for position-specific heroes
 */
export { POSITION_NAMES };

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

export const fetchPlayerData = async (steamId, position = null, forceRefresh = false) => {
    console.log('=== fetchPlayerData CALLED ===');
    console.log('steamId:', steamId);
    console.log('position:', position);
    console.log('forceRefresh:', forceRefresh);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
        const cachedData = await heroCache.getOpenDota(steamId);
        if (cachedData) {
            console.log('Using cached OpenDota data');
            return cachedData;
        }
    } else {
        console.log('Force refresh - clearing OpenDota cache');
        await heroCache.clearOpenDota(steamId);
    }

    // Basic heuristic: if length > 12 likely SteamID64
    const accountId = steamId.length > 12 ? steamIdToAccountId(steamId) : steamId;

    try {
        console.log('Fetching fresh OpenDota data');

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

        // Parse responses
        const profile = await profileRes.json();
        const wl = await wlRes.json();
        const recentMatches = await matchesRes.json();
        const heroes = await heroesRes.json();

        // Calculate additional stats from recent matches
        const stats = calculateStatsFromRecentMatches(recentMatches);

        // Process heroes directly (no recursion) - ALWAYS USE OPENDOTA FOR REGISTRATION
        let topHeroes = [];

        // Use OpenDota for all heroes (simplified for stability)
        topHeroes = heroes
            .filter(h => h.games >= 10)
            .sort((a, b) => b.games - a.games)
            .slice(0, 10)
            .sort((a, b) => (b.win / b.games) - (a.win / a.games))
            .slice(0, 3)
            .map(h => ({
                heroId: h.hero_id,
                games: h.games,
                win: h.win,
                winrate: ((h.win / h.games) * 100).toFixed(1)
            }));

        // Fetch Dota Plus heroes - REMOVED FOR REGISTRATION STABILITY
        let dotaPlusHeroes = [];
        // We will fetch this later when team is approved

        // Calculate winrate from total wins/losses
        const totalGames = (wl.win || 0) + (wl.lose || 0);
        const calculatedWinrate = totalGames > 0 ? (((wl.win || 0) / totalGames) * 100).toFixed(1) : 0;

        const result = {
            valid: true,
            // Flatten profile properties for Registration.jsx compatibility
            avatar: profile.profile?.avatarfull || profile.profile?.avatar || '',
            personaName: profile.profile?.personaname || 'Unknown',
            accountId: profile.profile?.account_id?.toString() || steamId,
            rankTier: profile.rank_tier || 0,
            leaderboardRank: profile.leaderboard_rank || null,
            winrate: calculatedWinrate,
            // Keep profile for backwards compatibility
            profile: {
                ...profile,
                winCount: wl.win || 0,
                lossCount: wl.lose || 0,
                ...stats
            },
            stats: {
                gpm: stats.avgGPM || 0,
                xpm: stats.avgXPM || 0,
                ...stats,
            },
            topHeroes: topHeroes,
            dotaPlusHeroes: dotaPlusHeroes
        };

        // Cache the result
        console.log('Caching OpenDota data for future use');
        await heroCache.setOpenDota(steamId, result);

        return result;

    } catch (error) {
        console.error("Error fetching Dota data:", error);
        return { valid: false, error: error.message };
    }
};

/**
 * Fetches position-specific heroes using STRATZ API with caching
 * @param {string} accountId - Player's account ID
 * @param {number} position - Position ID (1-5)
 * @param {string} steamId64 - Player's Steam ID64
 * @param {boolean} forceRefresh - Force API call even if cached
 * @returns {Array} Top 3 heroes for the position
 */
export const getPositionHeroesFromStratz = async (accountId, position, steamId64, forceRefresh = false) => {
    console.log('=== getPositionHeroesFromStratz CALLED ===');
    console.log('accountId:', accountId);
    console.log('position:', position);
    console.log('steamId64:', steamId64);
    console.log('forceRefresh:', forceRefresh);

    if (!position || position === 0) {
        console.log('No position specified, returning empty array');
        return [];
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
        const cachedHeroes = await heroCache.getStratz(accountId, position);
        if (cachedHeroes) {
            console.log('Using cached STRATZ data for position:', position);
            return cachedHeroes;
        }
    } else {
        console.log('Force refresh - clearing cache for position:', position);
        await heroCache.clearStratz(accountId, position);
    }

    try {
        console.log('Fetching fresh STRATZ API data for position:', position, 'accountId:', accountId);
        const stratzAccountId = steamIdToStratzAccountId(steamId64 || accountId);
        console.log('STRATZ Account ID:', stratzAccountId);
        const stratzHeroes = await getTopHeroesByPositionStratz(stratzAccountId, position);
        console.log('STRATZ heroes found:', stratzHeroes.length);

        if (stratzHeroes.length > 0) {
            console.log('Caching STRATZ data for future use');
            await heroCache.setStratz(accountId, position, stratzHeroes);
            return stratzHeroes;
        } else {
            console.log('STRATZ returned 0 heroes - caching empty result');
            await heroCache.setStratz(accountId, position, stratzHeroes);
            return [];
        }
    } catch (error) {
        console.error('STRATZ API failed:', error.message);
        console.error('Full error:', error);
        return [];
    }
};

/**
 * Clear cache for specific player when position changes
 * @param {string} accountId - Player's account ID
 * @param {number} oldPosition - Old position
 * @param {number} newPosition - New position
 */
export const clearPlayerPositionCache = async (accountId, oldPosition, newPosition) => {
    console.log('=== CLEARING PLAYER POSITION CACHE ===');
    console.log('accountId:', accountId, 'oldPosition:', oldPosition, 'newPosition:', newPosition);

    // Clear old position cache
    if (oldPosition && oldPosition !== 0) {
        await heroCache.clearStratz(accountId, oldPosition);
    }

    // Clear new position cache (force refresh)
    if (newPosition && newPosition !== 0) {
        await heroCache.clearStratz(accountId, newPosition);
    }

    console.log('Position cache cleared successfully');
};

/**
 * Preload heroes for all players in a team
 * @param {Array} players - Array of players with accountId, position, steamId64
 */
export const preloadTeamHeroes = async (players) => {
    console.log('=== PRELOADING TEAM HEROES ===');
    console.log('Players count:', players.length);

    // Load heroes for each player in parallel
    const promises = players.map(async (player) => {
        if (player.position && player.position !== 0) {
            try {
                await getPositionHeroesFromStratz(player.accountId, player.position, player.steamId64);
            } catch (error) {
                console.error(`Failed to preload heroes for ${player.accountId}:`, error);
            }
        }
    });

    await Promise.all(promises);
    console.log('Team heroes preloaded successfully');

    // Show cache stats
    const stats = heroCache.getStats();
    console.log('Cache stats:', stats);
};

/**
 * Force refresh all player data for a team (clears DB cache and fetches fresh)
 * @param {Array} players - Array of players with steamId, position, accountId
 * @returns {Promise<Object>} Result with success/failure counts
 */
export const forceRefreshTeamPlayers = async (players) => {
    console.log('=== FORCE REFRESHING TEAM PLAYERS ===');
    console.log('Players count:', players.length);

    let successCount = 0;
    let errorCount = 0;

    for (const player of players) {
        try {
            const steamId = player.steamId || player.steamId64;
            const accountId = player.accountId || (steamId && steamId.length > 12 ? steamIdToAccountId(steamId) : steamId);

            if (!steamId && !accountId) {
                console.warn('Player missing steamId/accountId, skipping');
                continue;
            }

            console.log(`Force refreshing player: ${accountId}`);

            // Clear all cache for this player (memory + DB)
            await heroCache.clearAllForPlayer(accountId);

            // Fetch fresh data
            await fetchPlayerData(steamId, null, true);

            // If player has a position, also fetch position-specific heroes
            if (player.position && player.position !== 0) {
                await getPositionHeroesFromStratz(accountId, player.position, steamId, true);
            }

            successCount++;
            console.log(`Successfully refreshed player: ${accountId}`);
        } catch (error) {
            console.error(`Error refreshing player:`, error);
            errorCount++;
        }
    }

    console.log(`Force refresh complete: ${successCount} success, ${errorCount} errors`);
    return { success: successCount, errors: errorCount };
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
