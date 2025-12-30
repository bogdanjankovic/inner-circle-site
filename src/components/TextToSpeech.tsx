"use client";

import { useState, useEffect } from 'react';

interface TextToSpeechProps {
    text: string;
}

export default function TextToSpeech({ text }: TextToSpeechProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.0;
        u.pitch = 1.1; // Slightly higher pitch for "excitement"
        u.volume = 1.0;

        // Voice Selection Logic
        const voices = window.speechSynthesis.getVoices();
        // Prefer "Microsoft Zira" (Windows default female) or "Google US English"
        const preferredVoice = voices.find(v =>
            v.name.includes("Zira") ||
            v.name.includes("Female") ||
            v.name.includes("Google US English")
        );

        if (preferredVoice) {
            u.voice = preferredVoice;
        }

        u.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
        };

        setUtterance(u);

        return () => {
            window.speechSynthesis.cancel();
        };
    }, [text]);

    const handlePlay = () => {
        if (!utterance) return;

        if (isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
            setIsSpeaking(true);
        } else {
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };

    const handlePause = () => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            setIsPaused(true);
            setIsSpeaking(false);
        }
    };

    const handleStop = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
    };

    return (
        <div className="flex items-center gap-4">
            {!isSpeaking && !isPaused ? (
                <button
                    onClick={handlePlay}
                    className="group flex items-center gap-4 px-6 py-3 border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 transition-all rounded-sm w-full md:w-auto"
                >
                    <div className="relative w-8 h-8 flex items-center justify-center border border-green-500 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full opacity-50 group-hover:opacity-100 group-hover:animate-pulse transition-opacity" />
                    </div>
                    <div className="text-left">
                        <div className="text-[10px] font-mono text-green-500 uppercase tracking-widest mb-1">Audio Briefing</div>
                        <div className="text-sm font-bold font-mono text-white tracking-tight group-hover:text-green-400">
                            INITIATE AUDIO
                        </div>
                    </div>
                </button>
            ) : (
                <div className="flex items-center gap-2 border border-green-500/30 bg-black p-2 rounded-sm h-[62px]">
                    {/* Status Indicator */}
                    <div className="flex flex-col justify-center px-4 border-r border-green-500/20 h-full">
                        <div className="flex items-center gap-2 mb-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-500">
                                {isPaused ? 'PAUSED' : 'ACTIVE'}
                            </span>
                        </div>
                        <div className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">
                            Audio Stream
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1 px-2">
                        {isSpeaking ? (
                            <button
                                onClick={handlePause}
                                className="p-3 hover:bg-green-500/10 text-green-500 transition-colors rounded-sm group"
                                title="Pause"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-90 transition-transform">
                                    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={handlePlay}
                                className="p-3 hover:bg-green-500/10 text-green-500 transition-colors rounded-sm group"
                                title="Resume"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-90 transition-transform">
                                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}

                        <button
                            onClick={handleStop}
                            className="p-3 hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors rounded-sm group"
                            title="Terminate"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-90 transition-transform">
                                <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
