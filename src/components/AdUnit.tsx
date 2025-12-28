"use client";

import React, { useEffect } from 'react';

interface AdUnitProps {
    slotId?: string;
    format?: 'rectangle' | 'banner';
}

export default function AdUnit({ slotId, format = 'rectangle' }: AdUnitProps) {
    const isDev = process.env.NODE_ENV === 'development';

    const styles = {
        rectangle: "w-full md:w-[300px] h-[250px]",
        banner: "w-full h-[90px]"
    };

    return (
        <div className={`my-8 mx-auto flex items-center justify-center bg-gray-900/50 border border-white/5 rounded-lg overflow-hidden relative ${styles[format]}`}>
            {/* Label */}
            <div className="absolute top-0 right-0 bg-gray-800 text-[10px] text-gray-500 px-1">ADVERTISEMENT</div>

            {/* Actual Ad Code Injection would go here */}
            {slotId ? (
                // Real Ad Slot
                <div id={`ad-slot-${slotId}`} className="w-full h-full bg-white/5 flex flex-col items-center justify-center text-gray-600">
                    {/* Script injection logic would happen in useEffect */}
                    <span>Loading Commercial Content...</span>
                </div>
            ) : (
                // Placeholder / House Ad
                <div className="text-center p-4">
                    <p className="text-purple-400 font-bold mb-1">The Modern Perspective</p>
                    <p className="text-xs text-gray-400">Premium Tech Analysis. Subscribe Today.</p>
                </div>
            )}
        </div>
    );
}
