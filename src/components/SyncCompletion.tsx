'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SyncCompletion() {
    const [isComplete, setIsComplete] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (hasTriggered) return;

            // Check if we are near bottom of page
            const scrolledTo = window.scrollY + window.innerHeight;
            // Increased buffer to 300px to ensure it triggers before exact bottom, covering footer/padding variations
            const threshold = document.documentElement.scrollHeight - 300;

            if (scrolledTo >= threshold) {
                setIsComplete(true);
                setHasTriggered(true);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasTriggered]);

    // Auto-hide after 4 seconds
    useEffect(() => {
        if (isComplete) {
            const timer = setTimeout(() => setIsComplete(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [isComplete]);

    return (
        <AnimatePresence>
            {isComplete && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                >
                    <div className="bg-black/80 backdrop-blur-xl border border-green-500 p-6 rounded-lg shadow-[0_0_50px_rgba(34,197,94,0.3)] flex items-center gap-6">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                                className="absolute inset-0 border-2 border-green-500/30 border-t-green-500 rounded-full"
                            />
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-green-500 font-bold text-xl"
                            >
                                ✓
                            </motion.div>
                        </div>

                        <div>
                            <div className="text-[10px] font-mono text-green-500 uppercase tracking-[0.3em] mb-1">
                                Protocol Status
                            </div>
                            <div className="text-2xl font-mono font-bold text-white tracking-tighter">
                                100% SYNCHRONIZED
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-1">
                                Knowledge assimilation complete.
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
