
'use client';

import { useEffect, useRef } from 'react';

export default function AnalyticsTracker({ slug }: { slug: string }) {
    const hasLogged = useRef(false);

    useEffect(() => {
        if (hasLogged.current) return;

        // Simple deduplication - only log once per mount/session ideally
        // For this basic version, we just log on mount. 
        // In strict mode (dev), this effect might run twice, hence the ref check.

        hasLogged.current = true;

        fetch('/api/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug }),
        }).catch(err => console.error("Metrics error:", err));

    }, [slug]);

    return null; // This component renders nothing
}
