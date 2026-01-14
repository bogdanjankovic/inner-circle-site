const API_URL = 'https://api.opendota.com/api';

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
 * Fetches heroes by recent matches and calculates position-specific stats
 * @param {string} accountId - Player's account ID
 * @param {number} position - Position ID (1-5)
 * @returns {Array} Top 3 heroes for the position
 */
export const getTopHeroesByPosition = async (accountId, position) => {
    if (!position || !LANE_TO_POSITION[position]) {
        // If no position specified, return all heroes
        try {
            const response = await fetch(`${API_URL}/players/${accountId}/heroes`);
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
            console.error('Error fetching heroes:', error);
            return [];
        }
    }

    const lane = LANE_TO_POSITION[position];
    
    try {
        // Fetch recent matches to analyze hero performance by position
        const matchesResponse = await fetch(`${API_URL}/players/${accountId}/matches?limit=100`);
        const matches = await matchesResponse.json();
        
        // Group heroes by lane and calculate stats
        const heroStatsByLane = {};
        
        matches.forEach(match => {
            if (match.lane === lane && match.hero_id) {
                const heroId = match.hero_id;
                if (!heroStatsByLane[heroId]) {
                    heroStatsByLane[heroId] = { games: 0, win: 0 };
                }
                heroStatsByLane[heroId].games++;
                if (match.player_slot >= 0 && match.player_slot <= 4 && match.radiant_win) {
                    heroStatsByLane[heroId].win++;
                } else if (match.player_slot >= 128 && match.player_slot <= 132 && !match.radiant_win) {
                    heroStatsByLane[heroId].win++;
                }
            }
        });
        
        // Convert to array and apply filtering
        const heroes = Object.entries(heroStatsByLane).map(([heroId, stats]) => ({
            hero_id: parseInt(heroId),
            games: stats.games,
            win: stats.win
        }));
        
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
        const topHeroes = await getTopHeroesByPosition(accountId, position);

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
