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
 * Fetches comprehensive player data from OpenDota (with Caching)
 * @param {string} steamId - SteamID64 or AccountID
 * @param {boolean} forceRefresh - If true, bypass cache and fetch fresh data
 */
export const fetchPlayerData = async (steamId, forceRefresh = false) => {
    // Basic heuristic: if length > 12 likely SteamID64
    const accountId = steamId.length > 12 ? steamIdToAccountId(steamId) : steamId;
    const cacheKey = `dota_player_${accountId}`;

    // 1. Check Cache
    if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            console.log(`[Cache Hit] Player ${accountId}`);
            return JSON.parse(cached);
        }
    }

    try {
        console.log(`[API Fetch] Player ${accountId}`);
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
        const topHeroes = heroes
            .sort((a, b) => b.games - a.games)
            .slice(0, 3)
            .map(h => ({
                heroId: h.hero_id,
                games: h.games,
                win: h.win,
                winrate: ((h.win / h.games) * 100).toFixed(1)
            }));

        const winrate = ((wl.win / (wl.win + wl.lose || 1)) * 100).toFixed(1);

        const result = {
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
            topHeroes: topHeroes,
            lastUpdated: Date.now()
        };

        // Save to Cache
        localStorage.setItem(cacheKey, JSON.stringify(result));
        return result;

    } catch (error) {
        console.error("Error fetching Dota data:", error);
        return { valid: false, error: error.message };
    }
};

// Hero ID to Name mapping using the lighter /heroes endpoint (with Caching)
export const fetchHeroConstants = async (forceRefresh = false) => {
    const cacheKey = 'dota_heroes_map';

    if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            console.log("[Cache Hit] Heroes");
            return JSON.parse(cached);
        }
    }

    try {
        console.log("[API Fetch] Heroes");
        const res = await fetch(`${API_URL}/heroes`);
        const heroesArray = await res.json();

        // Transform array into a map: { 1: { ...heroData }, 2: { ... } }
        const heroMap = {};
        heroesArray.forEach(hero => {
            heroMap[hero.id] = hero;
        });

        localStorage.setItem(cacheKey, JSON.stringify(heroMap));
        return heroMap;
    } catch (e) {
        console.error("Failed to fetch hero constants:", e);
        return {};
    }
}

/**
 * Fetches detailed match data and parses granular stats
 * @param {string} matchId 
 */
export const getMatchDetails = async (matchId) => {
    // Match details are usually static once finished, so we can cache them indefinitely too
    const cacheKey = `dota_match_${matchId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
        const res = await fetch(`${API_URL}/matches/${matchId}`);
        if (!res.ok) throw new Error("Match not found");
        const match = await res.json();

        // Parse granular stats for each player
        const playerStats = match.players.map(p => {
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
                heroDamage: p.hero_damage,
                towerDamage: p.tower_damage,
                heroHealing: p.hero_healing,
                roshansKilled: p.roshan_kills || 0,
                towersKilled: p.tower_kills || 0,
                tormentorsKilled: 0,
                runesActivated: p.rune_pickups || 0,
                neutralTokens: p.item_neutral ? 1 : 0,
                items: [p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5],
                backpack: [p.backpack_0, p.backpack_1, p.backpack_2],
                neutralItem: p.item_neutral
            };
        });

        const result = {
            matchId: match.match_id,
            duration: match.duration,
            winner: match.radiant_win ? 'Radiant' : 'Dire',
            players: playerStats
        };

        localStorage.setItem(cacheKey, JSON.stringify(result));
        return result;

    } catch (e) {
        console.error("Match fetch failed:", e);
        return null;
    }
};
