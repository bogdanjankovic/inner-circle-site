'use client';

import { useState, useEffect, useRef } from 'react';

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";

export function useScrambleText(targetText: string, speed: number = 30) {
    const [displayText, setDisplayText] = useState(targetText);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isScramblingRef = useRef(false);

    const scramble = () => {
        if (isScramblingRef.current) return;
        isScramblingRef.current = true;

        let iteration = 0;
        clearInterval(intervalRef.current as NodeJS.Timeout);

        intervalRef.current = setInterval(() => {
            setDisplayText(
                targetText
                    .split("")
                    .map((letter, index) => {
                        if (index < iteration) {
                            return targetText[index];
                        }
                        return CHARS[Math.floor(Math.random() * CHARS.length)];
                    })
                    .join("")
            );

            if (iteration >= targetText.length) {
                clearInterval(intervalRef.current as NodeJS.Timeout);
                isScramblingRef.current = false;
            }

            iteration += 1 / 3;
        }, speed);
    };

    // Cleanup
    useEffect(() => {
        return () => clearInterval(intervalRef.current as NodeJS.Timeout);
    }, []);

    return { displayText, scramble };
}
