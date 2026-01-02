'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

    // Prepare Slides
    const slides = useMemo(() => [
        {
            image: article.imageUrl,
            text: article.excerpt,
            title: article.title
        },
        ...article.sections.map(s => ({
            image: s.imageUrl || article.imageUrl,
            text: s.content,
            title: s.heading
        }))
    ], [article]);

    const currentSlide = slides[currentIndex] || { image: '', text: '', title: '' };

    // Split text into words for highlighting
    const words = useMemo(() => {
        return (currentSlide.text || "").split(" ");
    }, [currentSlide.text]);

    // Calculate character offsets for each word to map `onboundary` event
    const wordOffsets = useMemo(() => {
        let currentOffset = 0;
        return words.map(word => {
            const start = currentOffset;
            currentOffset += word.length + 1; // +1 for space
            return start;
        });
    }, [words]);

    // Load available voices
    useEffect(() => {
        const loadVoices = () => {
            const available = window.speechSynthesis.getVoices();
            console.log("Available Voices:", available.map(v => v.name));
            setVoices(available);

            // Priority: "Google US English" -> "Microsoft Zira" -> Any "English"
            const preferred = available.find(v => v.name.includes("Google US English"))
                || available.find(v => v.name.includes("Zira"))
                || available.find(v => v.lang.startsWith("en"));

            if (preferred) setSelectedVoice(preferred);
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    // Playback Logic
    useEffect(() => {
        window.speechSynthesis.cancel();

        let fallbackInterval: NodeJS.Timeout;
        const startTime = Date.now();
        const boundaryReceived = { current: false };

        if (isPlaying) {
            const utterance = new SpeechSynthesisUtterance(currentSlide.text);

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            // Tuning for "Natural" Flow
            utterance.rate = 0.9;
            utterance.pitch = 1.0;

            // 1. Native Event Sync
            utterance.onboundary = (event) => {
                boundaryReceived.current = true;
                const charIndex = event.charIndex;
                const index = wordOffsets.findIndex((offset, i) => {
                    const nextOffset = wordOffsets[i + 1] ?? Infinity;
                    return charIndex >= offset && charIndex < nextOffset;
                });
                if (index !== -1) setCurrentWordIndex(index);
            };

            // 2. Fallback Timer Sync (for Google/Remote voices that omit onboundary)
            // We estimate 200ms per word (approx 300 WPM) - fast pace
            const msPerWord = 200;

            fallbackInterval = setInterval(() => {
                if (!boundaryReceived.current) {
                    const elapsed = Date.now() - startTime;
                    // Only take over if we haven't seen a boundary for > 150ms 
                    if (elapsed > 150) {
                        const estimatedIndex = Math.floor(elapsed / msPerWord);
                        setCurrentWordIndex(Math.min(estimatedIndex, words.length - 1));
                    }
                }
            }, 100);

            // Audio Finished -> Next Slide
            utterance.onend = () => {
                clearInterval(fallbackInterval);
                if (currentIndex < slides.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                    setCurrentWordIndex(-1);
                } else {
                    setIsPlaying(false);
                }
            };

            // Error Handling
            utterance.onerror = () => {
                console.warn("TTS Error, advancing...");
                clearInterval(fallbackInterval);
                if (currentIndex < slides.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                    setCurrentWordIndex(-1);
                } else {
                    setIsPlaying(false);
                }
            };

            window.speechSynthesis.speak(utterance);
        }

        return () => {
            window.speechSynthesis.cancel();
            clearInterval(fallbackInterval);
        };
    }, [currentIndex, isPlaying, currentSlide.text, selectedVoice, slides.length, wordOffsets, words.length]);


    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') {
                setCurrentIndex(prev => Math.min(prev + 1, slides.length - 1));
                setCurrentWordIndex(-1);
            }
            if (e.key === 'ArrowLeft') {
                setCurrentIndex(prev => Math.max(prev - 1, 0));
                setCurrentWordIndex(-1);
            }
            if (e.key === ' ') setIsPlaying(prev => !prev);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, slides.length]);


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
                    <span className={`w-2 h-2 rounded-full shadow-[0_0_10px_red] ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
                    <span className="font-mono text-xs uppercase tracking-widest text-white">
                        {isPlaying ? "Broadcast Active" : "Paused"}
                    </span>
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
                        {currentSlide.title}
                    </motion.h2>
                    <motion.p
                        key={`text-${currentIndex}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="text-xl md:text-3xl font-mono text-gray-500 leading-relaxed max-w-4xl border-l-4 border-green-500 pl-6 bg-black/80 p-6 backdrop-blur-md rounded-r-xl"
                    >
                        {words.map((word, i) => (
                            <span
                                key={i}
                                className={`transition-colors duration-100 mr-2 inline-block ${i === currentWordIndex ? 'text-green-400 font-bold scale-110' : i < currentWordIndex ? 'text-white' : 'text-gray-600'}`}
                            >
                                {word}
                            </span>
                        ))}
                    </motion.p>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-12 right-12 z-50 flex flex-col items-end gap-6">

                {/* Voice Selector */}
                <div className="bg-black/80 p-2 rounded border border-white/10 hidden md:block">
                    <select
                        className="bg-transparent text-xs font-mono text-gray-400 outline-none cursor-pointer w-48 truncate"
                        value={selectedVoice?.name || ""}
                        onChange={(e) => {
                            const v = voices.find(voice => voice.name === e.target.value);
                            if (v) setSelectedVoice(v);
                            // Restart current slide to apply voice
                            setIsPlaying(false);
                            setTimeout(() => setIsPlaying(true), 100);
                        }}
                    >
                        {voices.filter(v => v.lang.startsWith('en')).map(v => (
                            <option key={v.name} value={v.name}>
                                {v.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setCurrentIndex(prev => Math.max(prev - 1, 0));
                            setCurrentWordIndex(-1);
                        }}
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
                        onClick={() => {
                            setCurrentIndex(prev => Math.min(prev + 1, slides.length - 1));
                            setCurrentWordIndex(-1);
                        }}
                        className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full transition-all"
                    >
                        ►
                    </button>
                </div>
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
