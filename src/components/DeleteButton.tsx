
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/context/ModalContext';

export default function DeleteButton({ slug }: { slug: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { showConfirm, showAlert } = useModal();

    const handleDelete = async () => {
        const confirmed = await showConfirm('Are you sure you want to delete this article? This action cannot be undone.', {
            title: 'Delete Protocol',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

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
                await showAlert('Failed to delete the article.');
            }
        } catch (e) {
            await showAlert('System error while deleting.');
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
