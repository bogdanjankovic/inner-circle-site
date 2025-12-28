
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ArchiveButtonProps {
    slug: string;
    isArchived?: boolean;
}

export default function ArchiveButton({ slug, isArchived }: ArchiveButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleToggle = async () => {
        // Removed confirmation to ensure button works reliably

        setLoading(true);
        try {
            const action = isArchived ? 'restore' : 'archive';
            const res = await fetch('/api/admin/archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, action }),
            });

            if (res.ok) {
                router.refresh();
            } else {
                alert('Failed to update status');
            }
        } catch (e) {
            alert('Error updating status');
        } finally {
            setLoading(false);
        }
    };

    if (isArchived) {
        return (
            <button
                onClick={handleToggle}
                disabled={loading}
                className="text-green-600 hover:text-green-800 text-sm font-bold disabled:opacity-50 uppercase tracking-wider"
            >
                {loading ? 'Restoring...' : 'Restore'}
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className="text-orange-500 hover:text-orange-700 text-sm font-medium disabled:opacity-50"
        >
            {loading ? 'Archiving...' : 'Archive'}
        </button>
    );
}
