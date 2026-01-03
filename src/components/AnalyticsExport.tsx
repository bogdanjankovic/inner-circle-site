'use client';

import { useState } from 'react';

export default function AnalyticsExport() {
    const [range, setRange] = useState('30'); // '7', '30', '90', 'ytd', 'custom'
    const [downloading, setDownloading] = useState(false);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const handleDownload = () => {
        let startDate = new Date();
        const endDate = new Date(); // Default end is today

        if (range === 'custom') {
            if (!customStart || !customEnd) {
                alert('Please select both start and end dates.');
                return;
            }
            startDate = new Date(customStart);
            // Set end date to the provided custom end date
            const selectedEnd = new Date(customEnd);
            endDate.setTime(selectedEnd.getTime());
        } else {
            if (range === '7') startDate.setDate(endDate.getDate() - 7);
            if (range === '30') startDate.setDate(endDate.getDate() - 30);
            if (range === '90') startDate.setDate(endDate.getDate() - 90);
            if (range === 'ytd') startDate = new Date(new Date().getFullYear(), 0, 1);
        }

        // Construct Query
        const params = new URLSearchParams({
            start: startDate.toISOString(),
            end: endDate.toISOString()
        });

        // Trigger Download
        setDownloading(true);
        // Simulate slight delay for UX
        setTimeout(() => setDownloading(false), 2000);

        // Direct navigation triggers download
        window.location.href = `/api/admin/export-analytics?${params.toString()}`;
    };

    return (
        <div className="flex items-center gap-2">
            <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="text-[10px] font-mono uppercase bg-white dark:bg-gray-800 border border-purple-500/20 text-gray-500 rounded px-2 py-1.5 focus:outline-none focus:border-purple-500 h-8"
            >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 3 Months</option>
                <option value="ytd">Year to Date</option>
                <option value="custom">Custom Range</option>
            </select>

            {range === 'custom' && (
                <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
                    <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="text-[10px] font-mono bg-white dark:bg-gray-800 border border-purple-500/20 text-gray-500 rounded px-2 py-1.5 focus:outline-none focus:border-purple-500 h-8"
                    />
                    <span className="text-gray-400 text-xs">-</span>
                    <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="text-[10px] font-mono bg-white dark:bg-gray-800 border border-purple-500/20 text-gray-500 rounded px-2 py-1.5 focus:outline-none focus:border-purple-500 h-8"
                    />
                </div>
            )}

            <button
                onClick={handleDownload}
                disabled={downloading}
                className="text-[10px] font-bold uppercase tracking-widest text-purple-500 hover:text-purple-400 border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 rounded hover:bg-purple-500/20 transition-all flex items-center gap-2 h-8 whitespace-nowrap"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 ${downloading ? 'animate-bounce' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {downloading ? '...' : 'Export'}
            </button>
        </div>
    );
}
