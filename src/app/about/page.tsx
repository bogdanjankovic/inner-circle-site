
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Protocol | BLEXOUT',
    description: 'The mission behind BLEXOUT Protocol.',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto font-sans text-gray-300">
            <div className="mb-12 border-l-4 border-green-500 pl-6">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-2 uppercase tracking-tighter">Mission Status</h1>
                <p className="font-mono text-green-500 text-sm tracking-widest uppercase">:: Optimization / Biohacking / High-Performance</p>
            </div>

            <div className="prose prose-invert prose-xl max-w-none leading-relaxed">
                <p className="text-2xl text-white font-light">
                    Protocol is a system for the modern operator.
                </p>

                <p>
                    In an age of signal decay and noise, we provide **clean data**. We analyze high-performance hardware, cognitive enhancement strategies, and financial optimization vectors.
                </p>

                <div className="grid md:grid-cols-2 gap-8 my-12 not-prose">
                    <div className="bg-white/5 p-8 border border-white/10 rounded-lg">
                        <h3 className="text-xl font-bold text-white mb-4">The Objective</h3>
                        <p className="text-base text-gray-400">
                            To filter out inefficiency. We test, verify, and report on tools that maintain your competitive edge.
                        </p>
                    </div>
                    <div className="bg-white/5 p-8 border border-white/10 rounded-lg">
                        <h3 className="text-xl font-bold text-white mb-4">The Standard</h3>
                        <p className="text-base text-gray-400">
                            Absolute performance. If it doesn't quantifiable improve your output, it doesn't make the Protocol.
                        </p>
                    </div>
                </div>

                <p>
                    Operated by BLEXOUT.
                </p>

                <div className="mt-12 p-6 bg-black border border-white/10 rounded-lg flex items-center justify-between">
                    <span className="font-mono text-xs text-green-500 uppercase tracking-widest">Status: ACTIVE</span>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </div>
            </div>
        </div>
    );
}
