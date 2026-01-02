'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface RevealImageProps {
    src: string;
    alt: string;
    className?: string; // Additional classes for the wrapper or image if needed, though we handle styles internally mostly
    priority?: boolean;
}

export default function RevealImage({ src, alt, className = "", priority = false }: RevealImageProps) {
    const ref = useRef(null);
    // triggerOnce: true ensures it stays colored once revealed
    // margin: "-10% 0px -10% 0px" triggers the effect a bit before the image is fully out of view? 
    // Actually standard threshold is better. Let's say when 20% is visible.
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    return (
        <motion.div
            ref={ref}
            className={`group relative w-full h-full overflow-hidden border border-white/5 ${className}`}
            initial={false}
        >
            {/* Image Layer */}
            <motion.img
                src={src}
                alt={alt}
                className="w-full h-full object-cover transition-all duration-1000 ease-out group-hover:scale-105 group-hover:contrast-125"
                initial={{ filter: 'grayscale(100%)', opacity: 0.7 }}
                animate={{
                    filter: isInView ? 'grayscale(0%)' : 'grayscale(100%)',
                    opacity: isInView ? 1 : 0.7
                }}
                transition={{ duration: 1.2 }}
            />

            {/* HUD: Animated Scanning Beam */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                <div className="w-full h-[2px] bg-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-[scan_3s_linear_infinite]" />
            </div>

            {/* HUD: Static Fine Mesh Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0)_2px,rgba(0,0,0,0.2)_1px)] bg-[size:100%_3px] z-10 opacity-30" />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/30 z-10" />

            {/* HUD: Corner Brackets */}
            <div className="absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 border-green-500/50 z-20 group-hover:border-green-400 transition-colors" />
            <div className="absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 border-green-500/50 z-20 group-hover:border-green-400 transition-colors" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 border-green-500/50 z-20 group-hover:border-green-400 transition-colors" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 border-green-500/50 z-20 group-hover:border-green-400 transition-colors" />

            {/* HUD: Data Text */}
            <div className="absolute bottom-4 left-8 text-[8px] font-mono text-green-500/70 tracking-widest z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span>
                    IMG_SRC :: {src.split('/').pop()?.slice(0, 12).toUpperCase() || 'UNKNOWN'}
                </span>
            </div>

            <div className="absolute top-4 right-8 text-[8px] font-mono text-green-500/70 tracking-widest z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                [ VISUAL_ID: {src.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0).toString(16).toUpperCase().slice(0, 6)} ]
            </div>
        </motion.div>
    );
}
