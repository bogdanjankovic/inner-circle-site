'use client';

import { useState, useEffect } from 'react';
import { useArticleState } from '@/context/ArticleStateContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProtocolBrief({ keyPoints }: { keyPoints: string[] }) {
    const { isFullyRead } = useArticleState();
    // Start collapsed even if just unlocked per user request
    const [isOpen, setIsOpen] = useState(false);

    // Auto-open logic REMOVED to respect "start collapsed"
    // useEffect(() => { if (isFullyRead) setIsOpen(true); }, [isFullyRead]);

    // Fallback if no keyPoints are defined
    if (!keyPoints || keyPoints.length === 0) {
        return (
            <div className="border border-white/5 bg-white/5 backdrop-blur-sm p-6 text-center opacity-50 grayscale">
                <div className="text-[20px] mb-2 opacity-20">⚠️</div>
                <h3 className="font-mono font-bold text-[10px] text-gray-500 uppercase tracking-widest mb-1">Data Unavailable</h3>
                <p className="font-mono text-[9px] text-gray-600">Protocol briefing not found.</p>
            </div>
        );
    }

    if (!isFullyRead) {
        return (
            <div className="border border-white/5 bg-white/5 backdrop-blur-sm p-6 text-center opacity-50 grayscale transition-all duration-500">
                <div className="text-[40px] mb-2 opacity-20">🔒</div>
                <h3 className="font-mono font-bold text-xs text-gray-500 uppercase tracking-widest mb-2">Protocol Encrypted</h3>
                <p className="font-mono text-[10px] text-gray-600">Complete synchronization to decrypt briefing.</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-green-500/30 bg-green-500/5 backdrop-blur-sm transition-all duration-300 shadow-[0_0_30px_rgba(34,197,94,0.1)]"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-green-500/10 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <h3 className="text-green-500 font-mono font-bold text-xs uppercase tracking-[0.2em] group-hover:text-green-400 transition-colors">
                        Protocol Brief Unlocked
                    </h3>
                </div>
                {/* Pulsating Arrow per User Request */}
                <span className={`text-green-500 text-xs transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} animate-pulse drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]`}>
                    ▼
                </span>
            </button>

            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <ul className="flex flex-col gap-3 p-4 pt-0">
                    {keyPoints.map((point, idx) => (
                        <li key={idx}>
                            <Link
                                href={`#section-${idx}`}
                                className="flex items-start gap-3 group/link hover:pl-1 transition-all duration-300 block"
                            >
                                <span className="text-green-500/40 font-mono text-[10px] mt-1 group-hover/link:text-green-500 transition-colors">
                                    0{idx + 1}
                                </span>
                                <span className="text-gray-400 font-mono text-xs leading-relaxed group-hover/link:text-white transition-colors border-b border-transparent group-hover/link:border-green-500/30">
                                    {typeof point === 'object' ? (point as any).text : point}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </motion.div>
    );
}
