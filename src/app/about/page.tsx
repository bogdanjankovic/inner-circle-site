import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Protocol | BLEXOUT',
    description: 'The mission behind BLEXOUT: High-performance tech analysis.',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen pt-32 pb-20 bg-black text-gray-300 font-sans">
            <div className="max-w-3xl mx-auto px-6">
                <h1 className="text-4xl font-mono font-bold mb-12 text-white">About Protocol</h1>

                <div className="prose prose-invert prose-green max-w-none text-lg leading-relaxed">
                    <p className="font-mono text-green-500 mb-8">
                        // MISSION: DECODE_PERFORMANCE
                    </p>

                    <p>
                        BLEXOUT is an elite analysis hub for gamers, creators, and professionals who demand the absolute limit from their technology and games.
                    </p>

                    <p>
                        In a sea of generic "tech news" and AI-generated fluff, BLEXOUT stands as a bastion of
                        <strong> specification-focused analysis</strong>. We don't care about the marketing hype. We care about:
                    </p>

                    <ul className="border-l-2 border-green-500 pl-6 space-y-4 my-8 font-mono text-sm">
                        <li>:: Thermal Performance & Acoustics</li>
                        <li>:: Price-to-Frame Ratios</li>
                        <li>:: Input Latency & Response Times</li>
                        <li>:: Game Mechanics & Optimization Deep Dives</li>
                        <li>:: Long-term Build Quality</li>
                    </ul>

                    <p>
                        Our reviews acts as a "Protocol" — a standard operating procedure for validating whether a piece of hardware
                        deserves a spot in your setup.
                    </p>

                    <h3 className="text-white font-bold mt-12 mb-4">Editorial Integrity</h3>
                    <p>
                        While we use affiliate links to support our operations, our recommendations are driven purely by data.
                        If a product overheats, throttles, or fails to deliver, we say so.
                    </p>
                </div>
            </div>
        </div>
    );
}
