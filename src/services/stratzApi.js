// STRATZ GraphQL API Service
const STRATZ_API_URL = 'https://api.stratz.com/graphql';

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
    heroStats {
      heroId
      winCount
      matchCount
      withRole {
        role
        winCount
        matchCount
      }
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
        const query = position ? 
            getPlayerHeroesByPositionQuery(steamAccountId, position) : 
            getAllPlayerHeroesQuery(steamAccountId);

        const response = await fetch(STRATZ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Note: You might need to add API key if required
                // 'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error(`STRATZ API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.errors) {
            throw new Error(`GraphQL error: ${data.errors[0].message}`);
        }

        const heroStats = data.data?.player?.heroStats || [];
        
        if (!position) {
            // Return all heroes sorted by games and winrate
            return heroStats
                .filter(h => h.matchCount >= 10)
                .sort((a, b) => b.matchCount - a.matchCount)
                .slice(0, 10)
                .sort((a, b) => (b.winCount / b.matchCount) - (a.winCount / a.matchCount))
                .slice(0, 3)
                .map(h => ({
                    heroId: h.heroId,
                    games: h.matchCount,
                    win: h.winCount,
                    winrate: ((h.winCount / h.matchCount) * 100).toFixed(1)
                }));
        }

        // Filter heroes by position
        const stratzRole = STRATZ_POSITIONS[position];
        const positionHeroes = heroStats
            .filter(hero => {
                const roleStats = hero.withRole?.find(r => r.role === stratzRole);
                return roleStats && roleStats.matchCount >= 5;
            })
            .map(hero => {
                const roleStats = hero.withRole?.find(r => r.role === stratzRole);
                return {
                    heroId: hero.heroId,
                    games: roleStats.matchCount,
                    win: roleStats.winCount,
                    winrate: ((roleStats.winCount / roleStats.matchCount) * 100).toFixed(1)
                };
            })
            .sort((a, b) => b.games - a.games)
            .slice(0, 10)
            .sort((a, b) => (b.win / b.games) - (a.win / a.games))
            .slice(0, 3);

        // If not enough heroes with position data, fallback to all heroes
        if (positionHeroes.length < 3) {
            return heroStats
                .filter(h => h.matchCount >= 5)
                .sort((a, b) => b.matchCount - a.matchCount)
                .slice(0, 10)
                .sort((a, b) => (b.winCount / b.matchCount) - (a.winCount / a.matchCount))
                .slice(0, 3)
                .map(h => ({
                    heroId: h.heroId,
                    games: h.matchCount,
                    win: h.winCount,
                    winrate: ((h.winCount / h.matchCount) * 100).toFixed(1)
                }));
        }

        return positionHeroes;

    } catch (error) {
        console.error('Error fetching STRATZ data:', error);
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
