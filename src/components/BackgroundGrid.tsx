'use client';

export default function BackgroundGrid() {
    return (
        <div className="fixed inset-0 -z-10 bg-black pointer-events-none overflow-hidden">
            {/* Base Radial Gradient for depth */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,100,0.03)_0%,transparent_70%)]" />

            {/* Moving Grid */}
            <div
                className="absolute inset-[-100%] w-[300%] h-[300%] bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] animate-[grid-move_20s_linear_infinite]"
                style={{
                    transformOrigin: 'center center',
                    transform: 'perspective(500px) rotateX(60deg)'
                }}
            />

        </div>
    );
}
