'use client';

import { useState } from 'react';
import { Article } from '@/lib/types';
import WatchProtocol from './WatchProtocol';
import TextToSpeech from './TextToSpeech';
import GlitchText from './GlitchText';
import { AnimatePresence } from 'framer-motion';

interface ArticleActionsProps {
    article: Article;
}

export default function ArticleActions({ article }: ArticleActionsProps) {
    const [showWatchMode, setShowWatchMode] = useState(false);

    // Prepare full text for the standard TextToSpeech fallback
    const fullText = `${article.title}. ${article.excerpt}. ${article.sections.map(s => s.heading + '. ' + s.content).join(' ')}`;

    return (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:max-w-2xl">

            {/* Standard Audio Player */}
            <TextToSpeech text={fullText} />

            {/* Watch Protocol Button */}
            <button
                onClick={() => setShowWatchMode(true)}
                className="group flex items-center gap-4 px-6 py-3 border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 transition-all rounded-sm w-full"
            >
                <div className="relative w-8 h-8 flex items-center justify-center border border-green-500 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <div className="absolute inset-0 border border-green-500 rounded-full animate-ping opacity-20" />
                </div>
                <div className="text-left">
                    <div className="text-[10px] font-mono text-green-500 uppercase tracking-widest mb-1">Visual Briefing</div>
                    <div className="text-sm font-bold font-mono text-white tracking-tight group-hover:text-green-400">
                        <GlitchText text="INITIATE WATCH PROTOCOL" />
                    </div>
                </div>
            </button>

            {/* Full Screen Watch Mode Modal */}
            <AnimatePresence>
                {showWatchMode && (
                    <WatchProtocol
                        article={article}
                        onClose={() => setShowWatchMode(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
