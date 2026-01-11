"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ConsentBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already consented
        const consent = localStorage.getItem("cookie-consent");
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookie-consent", "accepted");
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem("cookie-consent", "declined");
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-6 left-6 right-6 z-50 flex justify-center pointer-events-none"
                >
                    <div className="max-w-3xl w-full glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#050505]/80 backdrop-blur-xl border border-white/10 pointer-events-auto">
                        <div className="text-xs text-gray-400 font-mono leading-relaxed">
                            <h3 className="font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Protocol Compliance
                            </h3>
                            <p>
                                We utilize cookies to optimize system performance and user tracking.
                                <br className="hidden md:block" />
                                Maintaining connection implies consent to our
                                <a href="/privacy" className="text-white hover:text-green-500 underline decoration-green-500/30 underline-offset-4 ml-1 transition-colors">Data Protocol</a>.
                            </p>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <button
                                onClick={handleDecline}
                                className="flex-1 md:flex-none px-6 py-2 rounded border border-white/10 hover:bg-white/5 hover:border-white/30 transition-all text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white"
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleAccept}
                                className="flex-1 md:flex-none px-8 py-2 bg-white text-black hover:bg-green-500 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-white/10 hover:shadow-green-500/20"
                            >
                                Acknowledge
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
