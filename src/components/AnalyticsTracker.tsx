'use client';

import { useRef, useEffect } from 'react';
import { useArticleState } from '@/context/ArticleStateContext';

export default function AnalyticsTracker({ slug }: { slug: string }) {
    const { isFullyRead } = useArticleState();
    const hasLogged = useRef(false);
    const hasCompleted = useRef(false);
    const startTime = useRef(Date.now());

    useEffect(() => {
        // 1. PAGEVIEW
        if (!hasLogged.current) {
            hasLogged.current = true;
            sendEvent('pageview', { slug });
        }

        // 2. HEARTBEAT (Duration)
        const heartbeat = setInterval(() => {
            sendEvent('heartbeat', {
                slug,
                duration_delta: 30
            });
        }, 30000);

        // 3. COMPLETION LISTENER
        if (isFullyRead && !hasCompleted.current) {
            hasCompleted.current = true;
            sendEvent('completion', { slug });
        }

        const handleUnmount = () => {
            const totalTime = Math.floor((Date.now() - startTime.current) / 1000);
            const data = JSON.stringify({ event: 'session_end', slug, total_duration: totalTime });
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/analytics', data);
            }
        };

        window.addEventListener('beforeunload', handleUnmount);

        return () => {
            clearInterval(heartbeat);
            window.removeEventListener('beforeunload', handleUnmount);
            handleUnmount();
        };
    }, [slug, isFullyRead]);

    return null;
}

function sendEvent(event: 'pageview' | 'heartbeat' | 'click' | 'completion', data: any) {
    if (typeof window === 'undefined') return;

    fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, ...data }),
        keepalive: true, // Ensures request finishes even if user navigates away
    }).catch(err => console.error("Analytics error:", err));
}
