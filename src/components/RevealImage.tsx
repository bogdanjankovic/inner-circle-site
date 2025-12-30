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
            className={`w-full h-full overflow-hidden ${className}`}
            initial={false}
        >
            <motion.img
                src={src}
                alt={alt}
                className="w-full h-full object-cover transition-all duration-1000 ease-out"
                initial={{ filter: 'grayscale(100%)', opacity: 0.7 }}
                animate={{
                    filter: isInView ? 'grayscale(0%)' : 'grayscale(100%)',
                    opacity: isInView ? 1 : 0.7
                }}
                transition={{ duration: 1.2 }}
            />
        </motion.div>
    );
}
