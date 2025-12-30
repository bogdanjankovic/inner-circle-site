'use client';

import { useState } from 'react';

interface KeyPoint {
    text: string;
    sectionIndex: number;
}

export default function ProtocolBrief({ keyPoints }: { keyPoints: KeyPoint[] }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!keyPoints || keyPoints.length === 0) return null;

    return (
        <div className="border border-green-500/20 bg-green-500/5 backdrop-blur-sm transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-green-500/10 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <h3 className="text-green-500 font-mono font-bold text-xs uppercase tracking-[0.2em] group-hover:text-green-400 transition-colors">
                        Protocol Brief
                    </h3>
                </div>
                <span className={`text-green-500 text-xs transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>

            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <ul className="flex flex-col gap-3 p-4 pt-0">
                    {keyPoints.map((point, idx) => (
                        <li key={idx}>
                            <a
                                href={`#section-${point.sectionIndex}`}
                                className="flex items-start gap-3 group/link hover:pl-1 transition-all duration-300"
                            >
                                <span className="text-green-500/40 font-mono text-[10px] mt-1 group-hover/link:text-green-500 transition-colors">
                                    0{idx + 1}
                                </span>
                                <span className="text-gray-400 font-mono text-xs leading-relaxed group-hover/link:text-white transition-colors border-b border-transparent group-hover/link:border-green-500/30">
                                    {point.text}
                                </span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
