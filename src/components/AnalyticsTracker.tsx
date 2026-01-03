'use client';

import { useEffect, useRef } from 'react';

export default function AnalyticsTracker({ slug }: { slug: string }) {
    const hasLogged = useRef(false);
    const startTime = useRef(Date.now());

    useEffect(() => {
        // 1. PAGEVIEW
        if (!hasLogged.current) {
            hasLogged.current = true;
            sendEvent('pageview', { slug });
        }

        // 2. HEARTBEAT (Duration) & Completion Listener
        const heartbeat = setInterval(() => {
            sendEvent('heartbeat', {
                slug,
                duration_delta: 30 // Add 30s to total
            });
        }, 30000);

        // 3. EVENT LISTENERS
        const handleCompletion = () => {
            // Will be triggered by custom event from ArticleStateContext if we wire it up, 
            // or check localStorage. For now, rely on `sendEvent('completion')` calls from SyncCompletion?
            // Actually, let's expose a global event or just use the hook in SyncCompletion (easier).
            // We'll stick to basic ping here.
        };

        const handleUnmount = () => {
            const totalTime = Math.floor((Date.now() - startTime.current) / 1000);
            const data = JSON.stringify({ event: 'session_end', slug, total_duration: totalTime });
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/analytics', data);
            }
        };

        window.addEventListener('beforeunload', handleUnmount);
        // Also capture route changes if using Next.js router events (harder in App Router)

        return () => {
            clearInterval(heartbeat);
            window.removeEventListener('beforeunload', handleUnmount);
            // Handle client-side navigation unmount
            handleUnmount();
        };
    }, [slug]);

    return null;
}

function sendEvent(event: 'pageview' | 'heartbeat' | 'click', data: any) {
    if (typeof window === 'undefined') return;

    fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, ...data }),
        keepalive: true, // Ensures request finishes even if user navigates away
    }).catch(err => console.error("Analytics error:", err));
}
