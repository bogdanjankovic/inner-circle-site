
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteButton({ slug }: { slug: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this article?')) return;

        setLoading(true);
        try {
            const res = await fetch('/api/admin/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug }),
            });

            if (res.ok) {
                router.refresh();
            } else {
                alert('Failed to delete');
            }
        } catch (e) {
            alert('Error deleting');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
        >
            {loading ? 'Deleting...' : 'Delete'}
        </button>
    );
}
