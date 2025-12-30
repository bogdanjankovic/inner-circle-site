'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TermDefinition } from '@/lib/glossary';

export default function IntelTooltip({ termStr, definition }: { termStr: string, definition: TermDefinition }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <span
            className="relative inline-block cursor-help group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Trigger Text */}
            <span className="border-b-2 border-dotted border-green-500/50 text-green-300 group-hover:bg-green-500/10 group-hover:text-green-400 transition-colors">
                {termStr}
            </span>

            {/* Tooltip Card */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10, x: "-50%" }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, scale: 0.9, y: 10, x: "-50%" }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-1/2 mb-3 w-72 z-50 pointer-events-none"
                    >
                        {/* Connecting Line */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-[1px] h-3 bg-green-500/50"></div>

                        <div className="bg-black/90 border border-green-500/30 backdrop-blur-md p-4 rounded-sm shadow-[0_0_20px_rgba(34,197,94,0.2)] overflow-hidden relative">
                            {/* Decorative Corners */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-green-500"></div>
                            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-green-500"></div>
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-green-500"></div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-green-500"></div>

                            {/* Scanline BG */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>

                            {/* Header */}
                            <div className="flex justify-between items-center mb-2 border-b border-green-500/20 pb-2">
                                <span className="text-[10px] font-mono uppercase tracking-widest text-green-500 font-bold">
                                    Database Match found
                                </span>
                                <span className="text-[10px] font-mono text-gray-500">
                                    {definition.category}
                                </span>
                            </div>

                            {/* Content */}
                            <h4 className="font-mono font-bold text-white text-lg mb-1">{definition.term}</h4>
                            <p className="font-sans text-xs text-gray-300 leading-relaxed">
                                {definition.description}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
}
