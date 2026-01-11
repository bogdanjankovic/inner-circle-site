'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScrollToTopButton() {
    const [isAscending, setIsAscending] = useState(false);
    const [glitchText, setGlitchText] = useState("RETURN TO TOP");

    // "Matrix" text shuffling effect on hover
    const handleHoverStart = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        const original = "RETURN TO TOP";
        let iterations = 0;

        const interval = setInterval(() => {
            setGlitchText(original.split("").map((letter, index) => {
                if (index < iterations) return original[index];
                return chars[Math.floor(Math.random() * chars.length)];
            }).join(""));

            if (iterations >= original.length) clearInterval(interval);
            iterations += 1 / 2; // Speed of decode
        }, 30);
    };

    const handleClick = () => {
        setIsAscending(true);
        // Custom "fast" scroll
        const scrollDuration = 800;
        const start = window.scrollY;
        const startTime = performance.now();

        const animateScroll = (currentTime: number) => {
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / scrollDuration, 1);

            // Ease Out Quart
            const ease = 1 - Math.pow(1 - progress, 4);

            window.scrollTo(0, start - (start * ease));

            if (timeElapsed < scrollDuration) {
                requestAnimationFrame(animateScroll);
            } else {
                setIsAscending(false);
            }
        };

        requestAnimationFrame(animateScroll);
    };

    return (
        <>
            <button
                onClick={handleClick}
                onMouseEnter={handleHoverStart}
                onMouseLeave={() => setGlitchText("RETURN TO TOP")}
                className="group relative flex flex-col items-center gap-2 text-gray-500 hover:text-green-500 transition-colors"
            >
                {/* Thruster Particle (Decoration) */}
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-1 h-8 bg-gradient-to-t from-green-500 to-transparent blur-sm animate-pulse" />
                </div>

                <span className="text-2xl font-black group-hover:-translate-y-2 transition-transform duration-300 transform">
                    ▲
                </span>

                <span className="font-mono text-xs uppercase tracking-widest min-w-[120px] text-center">
                    {glitchText}
                </span>
            </button>

            {/* Full Screen "Teleport" Scanline Effect */}
            <AnimatePresence>
                {isAscending && (
                    <motion.div
                        initial={{ height: "0%", bottom: 0, opacity: 0 }}
                        animate={{ height: "100%", opacity: 0.5 }}
                        exit={{ height: "0%", top: 0, opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="fixed inset-x-0 z-[100] bg-green-500/20 pointer-events-none backdrop-blur-[1px] border-t-2 border-green-500"
                    >
                        <div className="w-full text-right pr-4 pt-2 font-mono text-green-500 font-bold text-xs uppercase tracking-widest">
                            Init Sequence: Ascend
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
