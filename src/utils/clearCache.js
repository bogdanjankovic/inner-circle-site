// Auto-clear OpenDota cache to force fresh data fetch with new /matches endpoint
import { supabase } from '../lib/supabase.js';

export const clearAllOpenDotaCache = async () => {
    try {
        console.log('🔄 Clearing all OpenDota cache from Supabase...');
        const { error } = await supabase
            .from('player_cache')
            .delete()
            .eq('data_type', 'openDota');

        if (error) {
            console.error('❌ Error clearing cache:', error);
        } else {
            console.log('✅ OpenDota cache cleared successfully! Fresh data will be fetched with detailed stats.');
            localStorage.setItem('opendota_cache_cleared_v2', Date.now());
        }
    } catch (e) {
        console.error('❌ Failed to clear cache:', e);
    }
};

// Make it available globally and auto-run on first load
if (typeof window !== 'undefined') {
    window.clearOpenDotaCache = clearAllOpenDotaCache;

    // Auto-clear cache on first load after update (only once)
    const cacheCleared = localStorage.getItem('opendota_cache_cleared_v2');
    if (!cacheCleared) {
        console.log('🚀 First load after update - clearing old OpenDota cache...');
        clearAllOpenDotaCache();
    } else {
        console.log('✓ OpenDota cache already cleared for this version');
    }
}
