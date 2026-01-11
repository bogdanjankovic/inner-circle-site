'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useArticleState } from '@/context/ArticleStateContext';

export default function SyncCompletion() {
    const { setFullyRead, isFullyRead } = useArticleState();
    const [isComplete, setIsComplete] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);

    const [ref, setRef] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!ref || hasTriggered) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // If it's already read, don't re-trigger the "Sync Complete" modal/animation
                // The Protocol Brief will simply appear unlocked (handled by its own component)
                if (entry.isIntersecting) {
                    if (!isFullyRead) {
                        setIsComplete(true);
                        setHasTriggered(true);
                    }
                }
            },
            {
                threshold: 0,
                rootMargin: "0px 0px 200px 0px" // Trigger when within 200px of viewport bottom
            }
        );

        observer.observe(ref);
        return () => observer.disconnect();
    }, [ref, hasTriggered, isFullyRead]);

    // Auto-hide after 4 seconds
    useEffect(() => {
        if (isComplete) {
            const timer = setTimeout(() => setIsComplete(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [isComplete]);

    return (
        <>
            {/* Scroll Sentinel - Placed at the very end of the page */}
            <div ref={setRef} className="w-full h-16 pointer-events-none opacity-0" aria-hidden="true" />
            <AnimatePresence>
                {isComplete && (
                    <>
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="fixed bottom-12 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 md:w-full md:max-w-sm"
                        >
                            <div className="bg-black/95 backdrop-blur-xl border border-green-500 p-4 md:p-6 rounded-lg shadow-[0_0_50px_rgba(34,197,94,0.3)] flex items-center justify-center md:justify-start gap-4 md:gap-6 w-full">
                                <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                                        className="absolute inset-0 border-2 border-green-500/30 border-t-green-500 rounded-full"
                                    />
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-green-500 font-bold text-lg md:text-xl"
                                    >
                                        ✓
                                    </motion.div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="text-[9px] md:text-[10px] font-mono text-green-500 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1 truncate">
                                        Protocol Status
                                    </div>
                                    <div className="text-xl md:text-2xl font-mono font-bold text-white tracking-tighter truncate">
                                        100% SYNCHRONIZED
                                    </div>
                                    <div className="text-[10px] md:text-xs text-gray-500 font-mono mt-1 truncate">
                                        Knowledge assimilation complete.
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Data Transfer Animation */}
                        {/* Data Transfer Animation - Improved Trajectory & Speed */}
                        <motion.div
                            initial={{ bottom: "80px", left: "50%", scale: 1, opacity: 1, x: "-50%" }} // Start centered above modal
                            animate={{
                                bottom: "500px", // Approximate sidebar height center
                                left: "90%", // Move to right sidebar
                                scale: 0.1, // Fade into brief
                                opacity: 0,
                                x: "0%"
                            }}
                            transition={{
                                duration: 2.5, // Slower per user request
                                ease: "easeInOut",
                                delay: 0.5
                            }}
                            onAnimationComplete={() => setFullyRead(true)}
                            className="fixed z-[60] w-6 h-6 bg-white rounded-full shadow-[0_0_30px_rgba(34,197,94,0.8)] pointer-events-none"
                        >
                            <motion.div
                                className="absolute inset-0 bg-green-500 rounded-full blur-sm"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 0.5 }}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence >
        </>
    );
}
