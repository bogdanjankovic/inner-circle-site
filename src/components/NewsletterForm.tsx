
'use client';

import { useState } from 'react';

export default function NewsletterForm() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setStatus('success');
                setEmail('');
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                <p className="text-green-600 dark:text-green-400 font-bold text-lg">Thanks for subscribing!</p>
                <p className="text-sm text-green-500">Keep an eye on your inbox.</p>
            </div>
        );
    }

    return (
        <div className="bg-[#050505] dark:bg-[#000] text-white rounded-3xl p-10 md:p-16 relative overflow-hidden border border-white/10 shadow-2xl">
            {/* Mystical Background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-900/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-900/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>

            <div className="relative z-10 max-w-3xl mx-auto text-center">
                <span className="text-xs font-bold tracking-[0.3em] text-purple-300 uppercase mb-4 block">The Inner Circle</span>
                <h2 className="text-4xl md:text-5xl font-serif italic mb-6 leading-tight">
                    Align Your Energy. <br />
                    <span className="not-italic font-light text-gray-400">Claim Your 2025 Venus Report.</span>
                </h2>
                <p className="text-gray-400 mb-10 text-lg font-light leading-relaxed max-w-xl mx-auto">
                    Join the vault for exclusive, vibe-based curation and your personalized astrological manifestation guide.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
                    <input
                        type="email"
                        placeholder="enter your email address..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="flex-1 px-6 py-4 rounded-full bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-400 backdrop-blur-md text-center md:text-left transition-all hover:bg-white/10"
                    />
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="px-8 py-4 bg-white text-black font-serif italic text-lg rounded-full hover:bg-purple-100 transition-all duration-500 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] disabled:opacity-50"
                    >
                        {status === 'loading' ? 'Manifesting...' : 'Unlock Access'}
                    </button>
                </form>
                {status === 'error' && (
                    <p className="text-red-400 mt-4 text-sm font-light tracking-wide">The stars are misaligned. Please try again.</p>
                )}
                <p className="mt-8 text-[10px] text-gray-600 uppercase tracking-widest">
                    Strictly Confidential. No Spam. Good Vibes Only.
                </p>
            </div>
        </div>
    );
}
