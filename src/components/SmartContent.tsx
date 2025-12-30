'use client';

import React from 'react';
import { GLOSSARY } from '@/lib/glossary';
import IntelTooltip from './IntelTooltip';

interface SmartContentProps {
    content: string;
}

export default function SmartContent({ content }: SmartContentProps) {
    // 1. Identify all terms present in this specific content chunk to avoid useless regex work
    const presentTerms = Object.keys(GLOSSARY).filter(term => content.includes(term));

    if (presentTerms.length === 0) {
        return <p>{content}</p>;
    }

    // 2. Build a regex pattern to match any of the terms
    // Use word boundaries \b to avoid matching partial words (e.g. "FPS" in "FPSO")
    // Escape special characters in terms just in case
    const pattern = new RegExp(`\\b(${presentTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'g');

    // 3. Split parts
    const parts = content.split(pattern);

    return (
        <p>
            {parts.map((part, i) => {
                // If the part matches a key in glossary, render tooltip
                if (GLOSSARY[part]) {
                    return <IntelTooltip key={i} termStr={part} definition={GLOSSARY[part]} />;
                }
                return <span key={i}>{part}</span>;
            })}
        </p>
    );
}
