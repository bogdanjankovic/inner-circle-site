
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/context/ModalContext';

interface DeleteArticleButtonProps {
    slug: string;
}

export default function DeleteArticleButton({ slug }: DeleteArticleButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { showConfirm, showAlert } = useModal();

    const handleDelete = async () => {
        const confirmed = await showConfirm(
            'Are you sure you want to permanently delete this article? This action cannot be undone.',
            {
                title: 'Delete Article',
                confirmText: 'Delete Forever',
                cancelText: 'Cancel'
            }
        );

        if (!confirmed) return;

        setLoading(true);
        try {
            const res = await fetch('/api/admin/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug }),
            });

            if (res.ok) {
                await showAlert('Article deleted successfully.', { title: 'Success' });
                router.refresh();
            } else {
                await showAlert('Failed to delete article.', { title: 'Error' });
            }
        } catch (e) {
            console.error(e);
            await showAlert('An unexpected error occurred.', { title: 'Error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wide disabled:opacity-50 flex items-center gap-1 transition-colors"
            title="Delete Article"
        >
            {loading ? (
                <span>Deleting...</span>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                    <span>Delete</span>
                </>
            )}
        </button>
    );
}
