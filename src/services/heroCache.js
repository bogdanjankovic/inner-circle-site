// Hero Cache System with Supabase persistence
// Uses in-memory cache for speed + Supabase for persistence across sessions
import { supabase } from '../lib/supabase.js';

class HeroCache {
    constructor() {
        this.stratzCache = new Map(); // key: steamAccountId_position, value: { heroes, timestamp }
        this.opendotaCache = new Map(); // key: steamId, value: { data, timestamp }
        this.dotaPlusCache = new Map(); // key: steamAccountId, value: { heroes, timestamp }
        this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.OPENDOTA_CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours for OpenDota (rate limiting)
        this.DOTAPLUS_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours for Dota Plus

        // Track pending DB operations to avoid duplicate writes
        this.pendingDbWrites = new Set();
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

    // ==================== SUPABASE DATABASE METHODS ====================

    /**
     * Get cached data from Supabase
     * @param {string} steamAccountId 
     * @param {string} dataType - 'stratz', 'opendota', 'dotaplus'
     * @param {number} position - optional position for stratz
     * @returns {Object|null} cached data or null
     */
    async getFromDb(steamAccountId, dataType, position = null) {
        try {
            let query = supabase
                .from('player_cache')
                .select('heroes, profile_data, cached_at')
                .eq('steam_account_id', steamAccountId.toString())
                .eq('data_type', dataType);

            if (dataType === 'stratz') {
                query = query.eq('position', position || 0);
            }

            const { data, error } = await query.maybeSingle();

            if (error) {
                console.error('SUPABASE CACHE: Error fetching:', error);
                return null;
            }

            if (!data) {
                console.log(`SUPABASE CACHE: Miss for ${steamAccountId} (${dataType})`);
                return null;
            }

            // Check if cache is still valid
            const cachedAt = new Date(data.cached_at);
            const now = new Date();
            const age = now - cachedAt;

            let maxAge = this.CACHE_DURATION;
            if (dataType === 'openDota') maxAge = this.OPENDOTA_CACHE_DURATION;
            if (dataType === 'dotaplus') maxAge = this.DOTAPLUS_CACHE_DURATION;

            if (age > maxAge) {
                console.log(`SUPABASE CACHE: Expired for ${steamAccountId} (${dataType}), age: ${Math.round(age / (60 * 60 * 1000))}h`);
                return null;
            }

            console.log(`SUPABASE CACHE: Hit for ${steamAccountId} (${dataType}), age: ${Math.round(age / (60 * 60 * 1000))}h`);
            return dataType === 'openDota' ? data.profile_data : data.heroes;
        } catch (error) {
            console.error('SUPABASE CACHE: Exception:', error);
            return null;
        }
    }

    /**
     * Save data to Supabase (upsert)
     * @param {string} steamAccountId 
     * @param {string} dataType 
     * @param {Object} data - heroes or profile_data
     * @param {number} position 
     */
    async saveToDb(steamAccountId, dataType, data, position = null) {
        const dbKey = `${steamAccountId}_${dataType}_${position || 0}`;

        // Avoid duplicate concurrent writes
        if (this.pendingDbWrites.has(dbKey)) {
            console.log(`SUPABASE CACHE: Write already pending for ${dbKey}`);
            return;
        }

        this.pendingDbWrites.add(dbKey);

        try {
            const record = {
                steam_account_id: steamAccountId.toString(),
                data_type: dataType,
                position: position || 0,
                cached_at: new Date().toISOString()
            };

            if (dataType === 'openDota') {
                record.profile_data = data;
                record.heroes = null;
            } else {
                record.heroes = data;
                record.profile_data = null;
            }

            const { error } = await supabase
                .from('player_cache')
                .upsert(record, {
                    onConflict: 'steam_account_id,position,data_type',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error('SUPABASE CACHE: Error saving:', error);
            } else {
                console.log(`SUPABASE CACHE: Saved ${steamAccountId} (${dataType})`);
            }
        } catch (error) {
            console.error('SUPABASE CACHE: Exception saving:', error);
        } finally {
            this.pendingDbWrites.delete(dbKey);
        }
    }

    /**
     * Delete cache from Supabase
     * @param {string} steamAccountId 
     * @param {string} dataType 
     * @param {number} position 
     */
    async deleteFromDb(steamAccountId, dataType = null, position = null) {
        try {
            let query = supabase
                .from('player_cache')
                .delete()
                .eq('steam_account_id', steamAccountId.toString());

            if (dataType) {
                query = query.eq('data_type', dataType);
            }

            if (dataType === 'stratz' && position !== null) {
                query = query.eq('position', position);
            }

            const { error } = await query;

            if (error) {
                console.error('SUPABASE CACHE: Error deleting:', error);
            } else {
                console.log(`SUPABASE CACHE: Deleted ${steamAccountId} (${dataType || 'all'})`);
            }
        } catch (error) {
            console.error('SUPABASE CACHE: Exception deleting:', error);
        }
    }

    // ==================== IN-MEMORY + DB HYBRID METHODS ====================

    /**
     * Get STRATZ heroes (checks memory first, then DB)
     */
    async getStratz(steamAccountId, position) {
        const key = this.generateStratzKey(steamAccountId, position);

        // 1. Check in-memory cache first
        const memCached = this.stratzCache.get(key);
        if (memCached) {
            const now = Date.now();
            if (now - memCached.timestamp <= this.CACHE_DURATION) {
                console.log(`STRATZ MEMORY CACHE: Hit for ${key}`);
                return memCached.heroes;
            }
            this.stratzCache.delete(key);
        }

        // 2. Check Supabase
        const dbCached = await this.getFromDb(steamAccountId, 'stratz', position);
        if (dbCached) {
            // Populate in-memory cache for faster subsequent access
            this.stratzCache.set(key, {
                heroes: dbCached,
                timestamp: Date.now()
            });
            return dbCached;
        }

        return null;
    }

    /**
     * Set STRATZ heroes (saves to memory and DB)
     */
    async setStratz(steamAccountId, position, heroes) {
        const key = this.generateStratzKey(steamAccountId, position);

        // Save to memory
        this.stratzCache.set(key, {
            heroes: heroes,
            timestamp: Date.now()
        });
        console.log(`STRATZ MEMORY CACHE: Set for ${key} with ${heroes.length} heroes`);

        // Save to DB (async, don't block)
        this.saveToDb(steamAccountId, 'stratz', heroes, position);
    }

    /**
     * Get OpenDota data (checks memory first, then DB)
     */
    async getOpenDota(steamId) {
        const key = this.generateOpenDotaKey(steamId);

        // 1. Check in-memory cache first
        const memCached = this.opendotaCache.get(key);
        if (memCached) {
            const now = Date.now();
            if (now - memCached.timestamp <= this.OPENDOTA_CACHE_DURATION) {
                console.log(`OPENDOTA MEMORY CACHE: Hit for ${key}`);
                return memCached.data;
            }
            this.opendotaCache.delete(key);
        }

        // 2. Check Supabase
        const dbCached = await this.getFromDb(steamId, 'opendota');
        if (dbCached) {
            // Populate in-memory cache
            this.opendotaCache.set(key, {
                data: dbCached,
                timestamp: Date.now()
            });
            return dbCached;
        }

        return null;
    }

    /**
     * Set OpenDota data (saves to memory and DB)
     */
    async setOpenDota(steamId, data) {
        const key = this.generateOpenDotaKey(steamId);

        // Save to memory
        this.opendotaCache.set(key, {
            data: data,
            timestamp: Date.now()
        });
        console.log(`OPENDOTA MEMORY CACHE: Set for ${key}`);

        // Save to DB
        this.saveToDb(steamId, 'opendota', data);
    }

    /**
     * Get Dota Plus heroes (checks memory first, then DB)
     */
    async getDotaPlus(steamAccountId) {
        const key = this.generateDotaPlusKey(steamAccountId);

        // 1. Check in-memory cache first
        const memCached = this.dotaPlusCache.get(key);
        if (memCached) {
            const now = Date.now();
            if (now - memCached.timestamp <= this.DOTAPLUS_CACHE_DURATION) {
                console.log(`DOTAPLUS MEMORY CACHE: Hit for ${key}`);
                return memCached.heroes;
            }
            this.dotaPlusCache.delete(key);
        }

        // 2. Check Supabase
        const dbCached = await this.getFromDb(steamAccountId, 'dotaplus');
        if (dbCached) {
            // Populate in-memory cache
            this.dotaPlusCache.set(key, {
                heroes: dbCached,
                timestamp: Date.now()
            });
            return dbCached;
        }

        return null;
    }

    /**
     * Set Dota Plus heroes (saves to memory and DB)
     */
    async setDotaPlus(steamAccountId, heroes) {
        const key = this.generateDotaPlusKey(steamAccountId);

        // Save to memory
        this.dotaPlusCache.set(key, {
            heroes: heroes,
            timestamp: Date.now()
        });
        console.log(`DOTAPLUS MEMORY CACHE: Set for ${key} with ${heroes.length} heroes`);

        // Save to DB
        this.saveToDb(steamAccountId, 'dotaplus', heroes);
    }

    // ==================== CLEAR METHODS ====================

    /**
     * Clear STRATZ cache for specific player (memory and DB)
     */
    async clearStratz(steamAccountId, position = null) {
        if (position === null) {
            // Clear all positions for this player
            for (const key of this.stratzCache.keys()) {
                if (key.startsWith(`stratz_${steamAccountId}_`)) {
                    this.stratzCache.delete(key);
                }
            }
            console.log(`STRATZ CACHE: Cleared memory for ${steamAccountId}`);
            await this.deleteFromDb(steamAccountId, 'stratz');
        } else {
            const key = this.generateStratzKey(steamAccountId, position);
            this.stratzCache.delete(key);
            console.log(`STRATZ CACHE: Cleared memory for ${key}`);
            await this.deleteFromDb(steamAccountId, 'stratz', position);
        }
    }

    /**
     * Clear OpenDota cache for specific player (memory and DB)
     */
    async clearOpenDota(steamId) {
        const key = this.generateOpenDotaKey(steamId);
        this.opendotaCache.delete(key);
        console.log(`OPENDOTA CACHE: Cleared memory for ${key}`);
        await this.deleteFromDb(steamId, 'opendota');
    }

    /**
     * Clear Dota Plus cache for specific player (memory and DB)
     */
    async clearDotaPlus(steamAccountId) {
        const key = this.generateDotaPlusKey(steamAccountId);
        this.dotaPlusCache.delete(key);
        console.log(`DOTAPLUS CACHE: Cleared memory for ${key}`);
        await this.deleteFromDb(steamAccountId, 'dotaplus');
    }

    /**
     * Clear all cache for a player (memory and DB)
     */
    async clearAllForPlayer(steamAccountId) {
        console.log(`HERO CACHE: Clearing all data for ${steamAccountId}`);
        await this.clearStratz(steamAccountId);
        await this.clearOpenDota(steamAccountId);
        await this.clearDotaPlus(steamAccountId);
    }

    /**
     * Clear all cache (memory only - use with caution)
     */
    clearAllMemory() {
        this.stratzCache.clear();
        this.opendotaCache.clear();
        this.dotaPlusCache.clear();
        console.log('HERO CACHE: Cleared all memory cache');
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
