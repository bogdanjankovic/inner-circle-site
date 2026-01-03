'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ArticleStateContextType {
    isFullyRead: boolean;
    setFullyRead: (value: boolean) => void;
}

const ArticleStateContext = createContext<ArticleStateContextType | undefined>(undefined);

export function ArticleStateProvider({ children }: { children: ReactNode }) {
    const [isFullyRead, setIsFullyRead] = useState(false);

    // Initial check - hydration safe
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            const isRead = localStorage.getItem(`read_protocol_${path}`) === 'true';
            if (isRead) setIsFullyRead(true);
        }
    }, []);

    // Wrapper to set and persist
    const setFullyReadPersistent = (value: boolean) => {
        setIsFullyRead(value);
        if (value && typeof window !== 'undefined') {
            const path = window.location.pathname;
            localStorage.setItem(`read_protocol_${path}`, 'true');
        }
    };

    return (
        <ArticleStateContext.Provider value={{ isFullyRead, setFullyRead: setFullyReadPersistent }}>
            {children}
        </ArticleStateContext.Provider>
    );
}

export function useArticleState() {
    const context = useContext(ArticleStateContext);
    if (context === undefined) {
        throw new Error('useArticleState must be used within an ArticleStateProvider');
    }
    return context;
}
