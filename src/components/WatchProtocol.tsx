'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Article } from '@/lib/types';
import GlitchText from './GlitchText';

interface WatchProtocolProps {
    article: Article;
    onClose: () => void;
}

export default function WatchProtocol({ article, onClose }: WatchProtocolProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [transcript, setTranscript] = useState("");

    // Prepare Slides: Cover, then Sections
    const slides = [
        {
            image: article.imageUrl,
            text: article.excerpt,
            title: article.title
        },
        ...article.sections.map(s => ({
            image: s.imageUrl || article.imageUrl, // Fallback to cover if section has no image
            text: s.content,
            title: s.heading
        }))
    ];

    // Audio Sync (Mock/Simple for now - we assume 10s per slide or wait for TTS)
    // Ideally we would hook into the actual SpeechSynthesis events
    useEffect(() => {
        if (!isPlaying) return;

        const duration = 8000; // 8 seconds per slide for now
        const timer = setTimeout(() => {
            if (currentIndex < slides.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setIsPlaying(false);
            }
        }, duration);

        return () => clearTimeout(timer);
    }, [currentIndex, isPlaying, slides.length]);


    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') setCurrentIndex(prev => Math.min(prev + 1, slides.length - 1));
            if (e.key === 'ArrowLeft') setCurrentIndex(prev => Math.max(prev - 1, 0));
            if (e.key === ' ') setIsPlaying(prev => !prev);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, slides.length]);


    const currentSlide = slides[currentIndex];

    // Read Aloud Logic (Simple implementation)
    useEffect(() => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(currentSlide.text);
            utterance.rate = 0.9;
            utterance.pitch = 0.9; // Lower pitch for "System" voice
            window.speechSynthesis.speak(utterance);
        } else {
            window.speechSynthesis.cancel();
        }
        return () => window.speechSynthesis.cancel();
    }, [currentIndex, isPlaying, currentSlide.text]);


    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black text-white flex flex-col"
        >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></span>
                    <span className="font-mono text-xs uppercase tracking-widest text-red-500">Rec / Playback</span>
                    <span className="font-mono text-xs text-gray-500">:: {String(currentIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
                </div>
                <button onClick={onClose} className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <span className="font-mono text-xs uppercase tracking-widest group-hover:underline">Terminate Protocol</span>
                    <span className="text-xl">×</span>
                </button>
            </div>

            {/* Main Stage */}
            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            // Subtle "Ken Burns" movement
                            x: ["0%", "-2%"],
                            transition: {
                                opacity: { duration: 1 },
                                scale: { duration: 10, ease: "linear" },
                                x: { duration: 10, ease: "linear", repeat: Infinity, repeatType: "reverse" }
                            }
                        }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 w-full h-full"
                    >
                        {/* Image Layer */}
                        {currentSlide.image && (
                            <img
                                src={currentSlide.image}
                                alt={currentSlide.title}
                                className="w-full h-full object-cover opacity-60"
                            />
                        )}
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

                        {/* Scanlines Overlay */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>

                    </motion.div>
                </AnimatePresence>

                {/* Subtitles / Text */}
                <div className="absolute bottom-0 left-0 w-full p-12 md:p-24 max-w-5xl">
                    <motion.h2
                        key={`title-${currentIndex}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-4xl md:text-6xl font-mono font-bold mb-8 text-white tracking-tighter"
                    >
                        <GlitchText text={currentSlide.title} />
                    </motion.h2>
                    <motion.p
                        key={`text-${currentIndex}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="text-xl md:text-2xl font-mono text-gray-300 leading-relaxed max-w-3xl border-l-4 border-green-500 pl-6 bg-black/50 p-4 backdrop-blur-md"
                    >
                        {currentSlide.text.length > 300 ? currentSlide.text.substring(0, 300) + "..." : currentSlide.text}
                    </motion.p>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-12 right-12 z-50 flex gap-4">
                <button
                    onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
                    className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full transition-all"
                >
                    ◄
                </button>
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full transition-all w-16 h-16 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                >
                    {isPlaying ? "||" : "▶"}
                </button>
                <button
                    onClick={() => setCurrentIndex(prev => Math.min(prev + 1, slides.length - 1))}
                    className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full transition-all"
                >
                    ►
                </button>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
                <motion.div
                    className="h-full bg-green-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
                />
            </div>
        </motion.div>
    );
}
