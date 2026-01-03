'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ArticleStateContextType {
    isFullyRead: boolean;
    setFullyRead: (value: boolean) => void;
}

const ArticleStateContext = createContext<ArticleStateContextType | undefined>(undefined);

export function ArticleStateProvider({ children }: { children: ReactNode }) {
    const [isFullyRead, setIsFullyRead] = useState(false);

    return (
        <ArticleStateContext.Provider value={{ isFullyRead, setFullyRead: setIsFullyRead }}>
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
