'use client';

import { useEffect, useState } from 'react';

export default function ParticleNetwork() {
    const [dimensions, setDimensions] = useState({ width: 1000, height: 1000 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
        setMounted(true);

        const handleResize = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!mounted) return <div className="fixed inset-0 -z-10 bg-black" />;

    // Deterministic random generation for stable hydration
    const nodeCount = 40;
    const nodes = Array.from({ length: nodeCount }).map((_, i) => ({
        id: i,
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: Math.random() * 2 + 2,
    }));

    // Generate connections
    const connections = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Connect close nodes
            if (dist < 200) {
                connections.push({
                    id: `${i}-${j}`,
                    x1: nodes[i].x,
                    y1: nodes[i].y,
                    x2: nodes[j].x,
                    y2: nodes[j].y,
                    opacity: 1 - dist / 200
                });
            }
        }
    }

    return (
        <div className="fixed inset-0 -z-10 bg-black overflow-hidden pointer-events-none">
            <svg
                className="absolute inset-0 w-full h-full opacity-60"
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            >
                {/* Connections */}
                {connections.map(conn => (
                    <line
                        key={conn.id}
                        x1={conn.x1}
                        y1={conn.y1}
                        x2={conn.x2}
                        y2={conn.y2}
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth="1"
                    />
                ))}

                {/* Nodes */}
                {nodes.map(node => (
                    <circle
                        key={node.id}
                        cx={node.x}
                        cy={node.y}
                        r={node.size}
                        fill="rgba(255, 255, 255, 0.5)"
                    />
                ))}
            </svg>

            {/* Subtle Gradient Overlay to fade edges */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-black opacity-80" />
        </div>
    );
}
