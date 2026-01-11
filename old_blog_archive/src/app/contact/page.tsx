
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact Command | BLEXOUT',
    description: 'Establish communication with BLEXOUT Protocol.',
};

export default function ContactPage() {
    return (
        <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto font-sans text-gray-300">
            <div className="mb-12 border-l-4 border-purple-500 pl-6">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-2 uppercase tracking-tighter">Comms Channel</h1>
                <p className="font-mono text-purple-500 text-sm tracking-widest uppercase">:: Establish Link</p>
            </div>

            <div className="prose prose-invert prose-xl max-w-none leading-relaxed">
                <p>
                    Direct all inquiries to the central node.
                </p>

                <div className="my-12 p-8 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-32 h-32 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                        </svg>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">Email Uplink</h3>
                    <p className="text-gray-400 mb-6 text-base">For partnerships, data corrections, or security reports.</p>

                    <a href="mailto:admin@blexout.com" className="inline-flex items-center gap-3 text-purple-400 hover:text-purple-300 transition-colors font-mono text-lg font-bold">
                        <span>admin@blexout.com</span>
                        <span>→</span>
                    </a>
                </div>

                <div className="my-12 p-8 bg-white/5 border border-white/10 rounded-xl">
                    <h3 className="text-2xl font-bold text-white mb-2">Physical Drop</h3>
                    <p className="text-gray-400 mb-6 text-base">We do not accept unsolicited hardware packages without prior authorization.</p>
                </div>
            </div>
        </div>
    );
}
