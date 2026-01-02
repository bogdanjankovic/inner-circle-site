'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type ModalType = 'alert' | 'confirm' | 'prompt';

interface ModalOptions {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    inputValue?: string; // For prompt
    inputPlaceholder?: string;
}

interface ModalContextType {
    showAlert: (message: string, options?: ModalOptions) => Promise<void>;
    showConfirm: (message: string, options?: ModalOptions) => Promise<boolean>;
    showPrompt: (message: string, options?: ModalOptions) => Promise<string | null>;
    closeModal: () => void;
    modalState: ModalState | null;
}

interface ModalState extends ModalOptions {
    type: ModalType;
    resolve: (value: any) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [modalState, setModalState] = useState<ModalState | null>(null);

    const closeModal = useCallback(() => {
        setModalState(null);
    }, []);

    const showAlert = useCallback((message: string, options: ModalOptions = {}) => {
        return new Promise<void>((resolve) => {
            setModalState({
                type: 'alert',
                message,
                title: options.title || 'System Alert',
                confirmText: options.confirmText || 'OK',
                resolve: () => {
                    closeModal();
                    resolve();
                },
                ...options,
            });
        });
    }, [closeModal]);

    const showConfirm = useCallback((message: string, options: ModalOptions = {}) => {
        return new Promise<boolean>((resolve) => {
            setModalState({
                type: 'confirm',
                message,
                title: options.title || 'Confirmation Required',
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                resolve: (result: boolean) => {
                    closeModal();
                    resolve(result);
                },
                ...options,
            });
        });
    }, [closeModal]);

    const showPrompt = useCallback((message: string, options: ModalOptions = {}) => {
        return new Promise<string | null>((resolve) => {
            setModalState({
                type: 'prompt',
                message,
                title: options.title || 'Input Required',
                confirmText: options.confirmText || 'Submit',
                cancelText: options.cancelText || 'Cancel',
                inputValue: options.inputValue || '',
                inputPlaceholder: options.inputPlaceholder || '',
                resolve: (result: string | null) => {
                    closeModal();
                    resolve(result);
                },
                ...options,
            });
        });
    }, [closeModal]);

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt, closeModal, modalState }}>
            {children}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}
