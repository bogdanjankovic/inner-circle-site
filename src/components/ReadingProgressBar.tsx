'use client';

import { useEffect, useState } from 'react';
import { useArticleState } from '@/context/ArticleStateContext';

export default function ReadingProgressBar() {
    const [progress, setProgress] = useState(0);
    const { isFullyRead } = useArticleState();

    useEffect(() => {
        if (isFullyRead) return;

        const updateProgress = () => {
            const currentScroll = window.scrollY;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollHeight) {
                const newProgress = Number((currentScroll / scrollHeight).toFixed(2)) * 100;
                setProgress(prev => Math.max(prev, newProgress));
            }
        };

        window.addEventListener('scroll', updateProgress);
        return () => window.removeEventListener('scroll', updateProgress);
    }, [isFullyRead]);

    if (isFullyRead) return null;

    return (
        <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-transparent">
            <div
                className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)] transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
