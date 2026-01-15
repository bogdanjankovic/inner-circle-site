// STRATZ GraphQL API Service
// STRATZ GraphQL API Service
const STRATZ_API_URL = '/api/stratz';
const STRATZ_API_KEY = import.meta.env.VITE_STRATZ_API_KEY || ''; // Add to .env file

// Position mapping for STRATZ
const STRATZ_POSITIONS = {
    1: 'CARRY',      // Safe Lane Carry
    2: 'MID',        // Mid Lane
    3: 'OFFLANE',    // Off Lane
    4: 'SUPPORT',    // Soft Support (Off Lane Support)
    5: 'HARDSUPPORT' // Hard Support (Safe Lane Support)
};

/**
 * GraphQL query for player's hero statistics by position
 */
const getPlayerHeroesByPositionQuery = (steamAccountId, position) => `
query {
  player(steamAccountId: ${steamAccountId}) {
    heroesPerformance(request: {
      startDateTime: 1672531200
      endDateTime: ${Math.floor(Date.now() / 1000)}
      take: 3000
      isStats: true
      positionIds: [POSITION_${position}]
    }) {
      heroId
      matchCount
      winCount
    }
  }
}
`;

/**
 * GraphQL query for all player heroes (fallback)
 */
const getAllPlayerHeroesQuery = (steamAccountId) => `
query {
  player(steamAccountId: ${steamAccountId}) {
    heroStats {
      heroId
      winCount
      matchCount
    }
  }
}
`;

/**
 * Fetches player's heroes using STRATZ GraphQL API
 * @param {string} steamAccountId - Player's Steam Account ID
 * @param {number} position - Position ID (1-5)
 * @returns {Array} Top 3 heroes for the position
 */
export const getTopHeroesByPositionStratz = async (steamAccountId, position) => {
    try {
        console.log('STRATZ: Fetching for steamAccountId:', steamAccountId, 'position:', position);
        console.log('STRATZ: API Key available:', !!STRATZ_API_KEY);

        const query = position ?
            getPlayerHeroesByPositionQuery(steamAccountId, position) :
            getAllPlayerHeroesQuery(steamAccountId);

        console.log('STRATZ: Query:', query.substring(0, 100) + '...');

        const headers = {
            'Content-Type': 'application/json',
        };

        // Add API key if available
        if (STRATZ_API_KEY) {
            headers['Authorization'] = `Bearer ${STRATZ_API_KEY}`;
            console.log('STRATZ: Using API key');
        } else {
            console.log('STRATZ: No API key found');
        }

        const requestBody = JSON.stringify({ query });
        console.log('STRATZ: Request body:', requestBody);
        console.log('STRATZ: Request headers:', headers);

        const response = await fetch(STRATZ_API_URL, {
            method: 'POST',
            headers,
            body: requestBody
        });

        console.log('STRATZ: Response status:', response.status);
        console.log('STRATZ: Response headers:', response.headers);

        if (!response.ok) {
            // Try to get error details from 400 response
            const errorText = await response.text();
            console.log('STRATZ: Error response body:', errorText);
            throw new Error(`STRATZ API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        console.log('STRATZ: Full response data:', data);

        if (data.errors) {
            console.log('STRATZ: GraphQL errors:', data.errors);
            data.errors.forEach((error, index) => {
                console.log(`STRATZ Error ${index + 1}:`, error.message);
                console.log(`STRATZ Error ${index + 1} Locations:`, error.locations);
                console.log(`STRATZ Error ${index + 1} Path:`, error.path);
            });
            throw new Error(`GraphQL error: ${data.errors[0].message}`);
        }

        const heroesPerformance = data.data?.player?.heroesPerformance || [];
        console.log('STRATZ: Raw heroes performance count:', heroesPerformance.length);

        // Debug: prikaži sve podatke koje dolaze iz STRATZ-a
        console.log('STRATZ: Full heroesPerformance data:', heroesPerformance);
        heroesPerformance.forEach((h, index) => {
            console.log(`STRATZ Hero ${index + 1}:`, {
                heroId: h.heroId,
                matchCount: h.matchCount,
                winCount: h.winCount,
                calculatedWinrate: ((h.winCount / h.matchCount) * 100).toFixed(1)
            });
        });

        // Return all heroes sorted by winrate and match count (minimum 10 matches)
        console.log('STRATZ: Processing heroes with match counts:', heroesPerformance.map(h => ({ heroId: h.heroId, matchCount: h.matchCount })));

        // Filter heroes with minimum matches
        let filteredHeroes = heroesPerformance.filter(h => h.matchCount >= 10);

        // If not enough heroes with 10+ matches, lower to 5
        if (filteredHeroes.length < 3) {
            filteredHeroes = heroesPerformance.filter(h => h.matchCount >= 5);
        }

        // If still not enough, take all with at least 1 match
        if (filteredHeroes.length < 3) {
            filteredHeroes = heroesPerformance.filter(h => h.matchCount >= 1);
        }

        return filteredHeroes
            .sort((a, b) => {
                // Primarno rangiranje po winrate
                const aWinrate = a.winCount / a.matchCount;
                const bWinrate = b.winCount / b.matchCount;

                // Ako je winrate razlika manja od 5%, rangiraj po broju mečeva
                if (Math.abs(aWinrate - bWinrate) < 0.05) {
                    return b.matchCount - a.matchCount; // Više mečeva = bolji
                }

                return bWinrate - aWinrate; // Viši winrate = bolji
            })
            .slice(0, 3)
            .map(h => ({
                heroId: h.heroId,
                games: h.matchCount,
                win: h.winCount,
                winrate: ((h.winCount / h.matchCount) * 100).toFixed(1)
            }));

    } catch (error) {
        console.error('Error fetching STRATZ data:', error);
        // Return empty array instead of throwing to prevent application crash
        return [];
    }
};

/**
 * GraphQL query for player's Dota Plus heroes
 */
const getDotaPlusHeroesQuery = (steamAccountId) => `
query {
  player(steamAccountId: ${steamAccountId}) {
    dotaPlus {
      heroId
      level
    }
  }
}
`;

/**
 * Fetches top 3 Dota Plus heroes for a player with caching
 * @param {string} steamAccountId - Player's Steam account ID
 * @param {boolean} forceRefresh - Force API call even if cached
 * @returns {Array} Top 3 Dota Plus heroes
 */
export const getTopDotaPlusHeroes = async (steamAccountId, forceRefresh = false) => {
    if (!STRATZ_API_KEY) {
        console.warn('STRATZ API key not found, skipping Dota Plus heroes fetch');
        return [];
    }

    // Import cache
    const { heroCache } = await import('./heroCache.js');

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
        const cachedHeroes = heroCache.getDotaPlus(steamAccountId);
        if (cachedHeroes) {
            console.log('Using cached Dota Plus heroes');
            return cachedHeroes;
        }
    } else {
        console.log('Force refresh - clearing Dota Plus cache');
        heroCache.clearDotaPlus(steamAccountId);
    }

    const query = getDotaPlusHeroesQuery(steamAccountId);

    try {
        console.log('Fetching fresh Dota Plus heroes from STRATZ');
        const response = await fetch(STRATZ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${STRATZ_API_KEY}`
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'No error details');
            console.warn(`STRATZ API error: ${response.status} - ${errorText}`);
            throw new Error(`STRATZ API error: ${response.status}`);
        }

        const data = await response.json();

        console.log('STRATZ Dota Plus: Full response data:', data);

        if (data.errors) {
            console.log('STRATZ Dota Plus: GraphQL errors:', data.errors);
            data.errors.forEach((error, index) => {
                console.log(`STRATZ Dota Plus Error ${index + 1}:`, error.message);
                console.log(`STRATZ Dota Plus Error ${index + 1} Locations:`, error.locations);
                console.log(`STRATZ Dota Plus Error ${index + 1} Path:`, error.path);
            });
            throw new Error(`GraphQL error: ${data.errors[0].message}`);
        }

        const dotaPlusHeroes = data.data?.player?.dotaPlus || [];

        if (dotaPlusHeroes.length === 0) {
            return [];
        }

        // Remove duplicates and keep highest level for each hero
        const uniqueHeroes = {};
        dotaPlusHeroes.forEach(hero => {
            if (!uniqueHeroes[hero.heroId] || hero.level > uniqueHeroes[hero.heroId].level) {
                uniqueHeroes[hero.heroId] = hero;
            }
        });

        // Sort by level (descending) and take top 3
        return Object.values(uniqueHeroes)
            .sort((a, b) => b.level - a.level)
            .slice(0, 3)
            .map(hero => ({
                heroId: hero.heroId,
                level: hero.level,
                games: 0, // Not available in STRATZ Dota Plus
                win: 0,    // Not available in STRATZ Dota Plus
                winrate: 0 // Not available in STRATZ Dota Plus
            }));

    } catch (error) {
        console.error('Error fetching STRATZ Dota Plus data:', error);
        return [];
    }
};

/**
 * Converts SteamID64 to Steam Account ID for STRATZ
 * @param {string} steamId64 
 * @returns {string} Steam Account ID
 */
export const steamIdToStratzAccountId = (steamId64) => {
    try {
        const bigId = BigInt(steamId64);
        const offset = BigInt('76561197960265728');
        return (bigId - offset).toString();
    } catch (e) {
        console.warn("Invalid SteamID format for STRATZ:", steamId64);
        return steamId64;
    }
};
