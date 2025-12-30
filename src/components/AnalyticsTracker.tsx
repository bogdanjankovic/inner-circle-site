'use client';

import { useEffect, useRef } from 'react';

export default function AnalyticsTracker({ slug }: { slug: string }) {
    const hasLogged = useRef(false);

    useEffect(() => {
        // 1. PAGEVIEW (Once per mount)
        if (!hasLogged.current) {
            hasLogged.current = true;
            sendEvent('pageview', { slug });
        }

        // 2. HEARTBEAT (Every 30 seconds) - Tracks duration
        const heartbeat = setInterval(() => {
            sendEvent('heartbeat', { slug });
        }, 30000);

        // 3. CLICK TRACKING (Global Listener)
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a');
            if (target && target.href) {
                // Determine if it's external/affiliate
                const url = new URL(target.href);
                if (url.hostname !== window.location.hostname) {
                    sendEvent('click', { slug, url: target.href });
                }
            }
        };

        document.addEventListener('click', handleClick);

        return () => {
            clearInterval(heartbeat);
            document.removeEventListener('click', handleClick);
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
