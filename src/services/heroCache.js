// Hero Cache System for STRATZ, OpenDota and Dota Plus APIs
class HeroCache {
    constructor() {
        this.stratzCache = new Map(); // key: steamAccountId_position, value: { heroes, timestamp }
        this.opendotaCache = new Map(); // key: steamId, value: { data, timestamp }
        this.dotaPlusCache = new Map(); // key: steamAccountId, value: { heroes, timestamp }
        this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.OPENDOTA_CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours for OpenDota (rate limiting)
        this.DOTAPLUS_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours for Dota Plus
    }

    // Generate STRATZ cache key
    generateStratzKey(steamAccountId, position) {
        return `stratz_${steamAccountId}_${position || 0}`;
    }

    // Generate OpenDota cache key
    generateOpenDotaKey(steamId) {
        return `opendota_${steamId}`;
    }

    // Generate Dota Plus cache key
    generateDotaPlusKey(steamAccountId) {
        return `dotaplus_${steamAccountId}`;
    }

    // Get cached STRATZ heroes
    getStratz(steamAccountId, position) {
        const key = this.generateStratzKey(steamAccountId, position);
        const cached = this.stratzCache.get(key);
        
        if (!cached) {
            return null;
        }

        // Check if cache is still valid
        const now = Date.now();
        if (now - cached.timestamp > this.CACHE_DURATION) {
            this.stratzCache.delete(key);
            return null;
        }

        console.log(`STRATZ CACHE: Hit for ${key} (${Math.round((now - cached.timestamp) / (60 * 60 * 1000))}h old)`);
        return cached.heroes;
    }

    // Set cached STRATZ heroes
    setStratz(steamAccountId, position, heroes) {
        const key = this.generateStratzKey(steamAccountId, position);
        this.stratzCache.set(key, {
            heroes: heroes,
            timestamp: Date.now()
        });
        console.log(`STRATZ CACHE: Set for ${key} with ${heroes.length} heroes`);
    }

    // Get cached OpenDota data
    getOpenDota(steamId) {
        const key = this.generateOpenDotaKey(steamId);
        const cached = this.opendotaCache.get(key);
        
        if (!cached) {
            return null;
        }

        // Check if cache is still valid
        const now = Date.now();
        if (now - cached.timestamp > this.OPENDOTA_CACHE_DURATION) {
            this.opendotaCache.delete(key);
            return null;
        }

        console.log(`OPENDOTA CACHE: Hit for ${key} (${Math.round((now - cached.timestamp) / (60 * 60 * 1000))}h old)`);
        return cached.data;
    }

    // Set cached OpenDota data
    setOpenDota(steamId, data) {
        const key = this.generateOpenDotaKey(steamId);
        this.opendotaCache.set(key, {
            data: data,
            timestamp: Date.now()
        });
        console.log(`OPENDOTA CACHE: Set for ${key}`);
    }

    // Get cached Dota Plus heroes
    getDotaPlus(steamAccountId) {
        const key = this.generateDotaPlusKey(steamAccountId);
        const cached = this.dotaPlusCache.get(key);
        
        if (!cached) {
            return null;
        }

        // Check if cache is still valid
        const now = Date.now();
        if (now - cached.timestamp > this.DOTAPLUS_CACHE_DURATION) {
            this.dotaPlusCache.delete(key);
            return null;
        }

        console.log(`DOTAPLUS CACHE: Hit for ${key} (${Math.round((now - cached.timestamp) / (60 * 60 * 1000))}h old)`);
        return cached.heroes;
    }

    // Set cached Dota Plus heroes
    setDotaPlus(steamAccountId, heroes) {
        const key = this.generateDotaPlusKey(steamAccountId);
        this.dotaPlusCache.set(key, {
            heroes: heroes,
            timestamp: Date.now()
        });
        console.log(`DOTAPLUS CACHE: Set for ${key} with ${heroes.length} heroes`);
    }

    // Clear STRATZ cache for specific player
    clearStratz(steamAccountId, position = null) {
        if (position === null) {
            // Clear all positions for this player
            for (const key of this.stratzCache.keys()) {
                if (key.startsWith(`stratz_${steamAccountId}_`)) {
                    this.stratzCache.delete(key);
                    console.log(`STRATZ CACHE: Cleared all positions for ${steamAccountId}`);
                }
            }
        } else {
            const key = this.generateStratzKey(steamAccountId, position);
            this.stratzCache.delete(key);
            console.log(`STRATZ CACHE: Cleared ${key}`);
        }
    }

    // Clear OpenDota cache for specific player
    clearOpenDota(steamId) {
        const key = this.generateOpenDotaKey(steamId);
        this.opendotaCache.delete(key);
        console.log(`OPENDOTA CACHE: Cleared ${key}`);
    }

    // Clear Dota Plus cache for specific player
    clearDotaPlus(steamAccountId) {
        const key = this.generateDotaPlusKey(steamAccountId);
        this.dotaPlusCache.delete(key);
        console.log(`DOTAPLUS CACHE: Cleared ${key}`);
    }

    // Clear all cache
    clearAll() {
        this.stratzCache.clear();
        this.opendotaCache.clear();
        this.dotaPlusCache.clear();
        console.log('HERO CACHE: Cleared all cache');
    }

    // Get cache stats
    getStats() {
        const now = Date.now();
        let stratzValid = 0;
        let stratzExpired = 0;
        let opendotaValid = 0;
        let opendotaExpired = 0;

        for (const [key, value] of this.stratzCache.entries()) {
            if (now - value.timestamp > this.CACHE_DURATION) {
                stratzExpired++;
            } else {
                stratzValid++;
            }
        }

        for (const [key, value] of this.opendotaCache.entries()) {
            if (now - value.timestamp > this.OPENDOTA_CACHE_DURATION) {
                opendotaExpired++;
            } else {
                opendotaValid++;
            }
        }

        let dotaplusValid = 0;
        let dotaplusExpired = 0;

        for (const [key, value] of this.dotaPlusCache.entries()) {
            if (now - value.timestamp > this.DOTAPLUS_CACHE_DURATION) {
                dotaplusExpired++;
            } else {
                dotaplusValid++;
            }
        }

        return {
            stratz: { total: this.stratzCache.size, valid: stratzValid, expired: stratzExpired },
            opendota: { total: this.opendotaCache.size, valid: opendotaValid, expired: opendotaExpired },
            dotaplus: { total: this.dotaPlusCache.size, valid: dotaplusValid, expired: dotaplusExpired }
        };
    }
}

// Export singleton instance
export const heroCache = new HeroCache();
