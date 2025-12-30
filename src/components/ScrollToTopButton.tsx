'use client';

export default function ScrollToTopButton() {
    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex flex-col items-center gap-2 text-gray-500 hover:text-green-500 transition-colors"
        >
            <span className="text-2xl group-hover:-translate-y-1 transition-transform">↑</span>
            <span className="font-mono text-xs uppercase tracking-widest">Return to Top</span>
        </button>
    );
}
