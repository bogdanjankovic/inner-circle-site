'use client';

import { useModal } from '@/context/ModalContext';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function ModalContainer() {
    const { modalState, closeModal } = useModal();
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (modalState?.inputValue) {
            setInputValue(modalState.inputValue);
        } else {
            setInputValue('');
        }
    }, [modalState]);

    useEffect(() => {
        if (modalState?.type === 'prompt' && inputRef.current) {
            // Small timeout to allow render
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [modalState?.type]);

    if (!modalState) return null;

    const handleConfirm = () => {
        if (modalState.type === 'prompt') {
            modalState.resolve(inputValue);
        } else if (modalState.type === 'confirm') {
            modalState.resolve(true);
        } else {
            modalState.resolve(null);
        }
    };

    const handleCancel = () => {
        if (modalState.type === 'prompt') {
            modalState.resolve(null);
        } else {
            modalState.resolve(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col scale-100 opacity-100 transition-all"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-800 dark:text-gray-100">
                        {modalState.title}
                    </h3>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        {modalState.message}
                    </p>

                    {modalState.type === 'prompt' && (
                        <div className="mb-2">
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-950 focus:ring-2 focus:ring-purple-500 outline-none text-gray-800 dark:text-white"
                                placeholder={modalState.inputPlaceholder}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    {modalState.type !== 'alert' && (
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                            {modalState.cancelText || 'Cancel'}
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all transform active:scale-95 ${modalState.type === 'confirm'
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                            }`}
                    >
                        {modalState.confirmText || 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
}
