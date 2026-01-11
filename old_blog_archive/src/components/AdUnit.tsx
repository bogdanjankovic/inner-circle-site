"use client";

import React, { useEffect } from 'react';

interface AdUnitProps {
    slotId?: string;
    format?: 'rectangle' | 'banner';
}

export default function AdUnit({ slotId, format = 'rectangle' }: AdUnitProps) {
    // STARTUP CONFIG: Choose your ad mode
    // 'manual' = You provide the image/link below (Good for Amazon/Affiliates)
    // 'programmatic' = Google AdSense (Requires approval)
    const AD_MODE: 'manual' | 'programmatic' = 'manual';

    const styles = {
        rectangle: "w-full md:w-[300px] h-[250px]",
        banner: "w-full h-[90px]"
    };

    // MANUAL ADS CONFIG (The "Affiliate Machine" setup)
    const manualAd = {
        imageUrl: format === 'banner'
            ? 'https://placehold.co/728x90/10b981/000000?text=RTX+5090+Stock+Checker+%7C+Check+Now'
            : 'https://placehold.co/300x250/10b981/000000?text=Secret+Lab+Sale+%7C+50%25+OFF',
        linkUrl: 'https://amazon.com', // Replace with your affiliate link
        cta: 'Check Price'
    };

    return (
        <div className={`my-8 mx-auto flex flex-col items-center justify-center bg-black/40 border border-white/5 overflow-hidden relative group/ad ${styles[format]}`}>

            {/* Label */}
            <div className="absolute top-0 right-0 bg-white/10 text-[8px] text-gray-500 px-1 uppercase tracking-widest z-10 backdrop-blur-md">
                Sponsored
            </div>

            {AD_MODE === 'manual' ? (
                <a
                    href={manualAd.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full h-full relative flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                    {/* Placeholder Image - replace src with real assets later */}
                    <img
                        src={manualAd.imageUrl}
                        alt="Ad"
                        className="w-full h-full object-cover opacity-80 group-hover/ad:opacity-100 transition-opacity"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/ad:opacity-100 transition-opacity bg-black/60 backdrop-blur-[2px]">
                        <span className="text-green-500 font-mono text-xs font-bold border border-green-500 px-4 py-2 uppercase tracking-widest">
                            {manualAd.cta} &rarr;
                        </span>
                    </div>
                </a>
            ) : (
                /* Google AdSense Placeholder */
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 font-mono text-xs text-center p-4">
                    <span className="mb-2">Google AdSense Space</span>
                    <span className="text-[10px] opacity-50">{slotId}</span>
                </div>
            )}
        </div>
    );
}
