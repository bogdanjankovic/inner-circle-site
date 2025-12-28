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
        <div className="flex items-center gap-2">
            {!isSpeaking && !isPaused ? (
                <button
                    onClick={handlePlay}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white bg-purple-600 rounded-full hover:bg-purple-500 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                    Listen
                </button>
            ) : (
                <>
                    {isSpeaking ? (
                        <button
                            onClick={handlePause}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                            </svg>
                            Pause
                        </button>
                    ) : (
                        <button
                            onClick={handlePlay}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white bg-green-600 rounded-full hover:bg-green-500 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                            </svg>
                            Resume
                        </button>
                    )}

                    <button
                        onClick={handleStop}
                        className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                        title="Stop"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM9 8.25a.75.75 0 00-.75.75v6c0 .414.336.75.75.75h6a.75.75 0 00.75-.75v-6a.75.75 0 00-.75-.75H9z" clipRule="evenodd" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    );
}
