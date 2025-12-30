interface VerdictBadgeProps {
    score: number; // 0-10
    verdict: 'RECOMMENDED' | 'PASS' | 'WAIT';
}

export default function VerdictBadge({ score, verdict }: VerdictBadgeProps) {
    const getColor = () => {
        if (score >= 8) return 'text-green-500 border-green-500';
        if (score >= 5) return 'text-yellow-500 border-yellow-500';
        return 'text-red-500 border-red-500';
    };

    return (
        <div className={`inline-flex items-center gap-4 px-4 py-2 border ${getColor()} bg-black/50 backdrop-blur-md`}>
            <span className="font-mono text-2xl font-bold">{score}/10</span>
            <span className="h-6 w-px bg-white/20"></span>
            <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase">{verdict}</span>
        </div>
    );
}
