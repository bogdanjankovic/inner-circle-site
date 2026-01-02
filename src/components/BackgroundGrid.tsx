'use client';

export default function BackgroundGrid() {
    return (
        <div className="fixed inset-0 -z-10 bg-black pointer-events-none overflow-hidden">
            <style jsx global>{`
                @keyframes grid-move-local {
                    0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
                    100% { transform: perspective(500px) rotateX(60deg) translateY(40px); }
                }
            `}</style>

            {/* Base Radial Gradient for depth - Boosted */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.15)_0%,transparent_70%)]" />

            {/* Moving Grid - Boosted Opacity & Green Tint */}
            <div
                className="absolute inset-[-100%] w-[300%] h-[300%]"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(34, 197, 94, 0.2) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(34, 197, 94, 0.2) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    transformOrigin: 'center center',
                    animation: 'grid-move-local 20s linear infinite',
                }}
            />
        </div>
    );
}
