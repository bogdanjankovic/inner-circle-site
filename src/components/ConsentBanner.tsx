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
                    className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
                >
                    <div className="max-w-4xl mx-auto glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl bg-[#0a0a0a]/90">
                        <div className="text-sm text-gray-300">
                            <h3 className="font-bold text-white mb-2">We value your privacy</h3>
                            <p>
                                We use cookies to enhance your experience, serve personalized ads, and analyze our traffic.
                                By clicking "Accept", you consent to our use of cookies.
                                <a href="#" className="underline ml-1 hover:text-white">Read our Privacy Policy</a>.
                            </p>
                        </div>
                        <div className="flex gap-4 min-w-max">
                            <button
                                onClick={handleDecline}
                                className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-sm font-medium"
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleAccept}
                                className="button-primary text-sm px-6 py-2"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
