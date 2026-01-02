'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useModal } from '@/context/ModalContext';

export default function CreateManualButton() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { showAlert } = useModal();

    const handleCreateWrapper = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/create', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to create draft');

            const data = await response.json();
            if (data.slug) {
                router.push(`/admin/edit/${data.slug}`);
            }
        } catch (error) {
            console.error(error);
            await showAlert('Failed to create a new draft. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleCreateWrapper}
            disabled={isLoading}
            className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg border border-gray-200 dark:border-gray-600 flex items-center gap-2"
        >
            {isLoading ? 'Creating...' : '✎ Write Manually'}
        </button>
    );
}
