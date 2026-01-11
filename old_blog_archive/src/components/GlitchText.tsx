'use client';

import { useState } from 'react';

interface GlitchTextProps {
    text: string;
    className?: string;
    as?: 'span' | 'div' | 'p';
}

export default function GlitchText({ text, className = "", as: Component = 'span' }: GlitchTextProps) {
    const [displayText, setDisplayText] = useState(text);

    const handleHover = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        let iterations = 0;

        const interval = setInterval(() => {
            setDisplayText(text.split("").map((letter, index) => {
                if (index < iterations) return text[index];
                return chars[Math.floor(Math.random() * chars.length)];
            }).join(""));

            if (iterations >= text.length) clearInterval(interval);
            iterations += 1 / 2;
        }, 30);
    };

    return (
        <Component
            className={`inline-block truncate ${className}`}
            onMouseEnter={handleHover}
            onMouseLeave={() => setDisplayText(text)}
        >
            {displayText}
        </Component>
    );
}
