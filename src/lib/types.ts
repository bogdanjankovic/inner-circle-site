export interface Article {
    title: string;
    excerpt: string;
    imageUrl: string;
    date: string;
    author: string;
    readTime: string;
    slug: string;
    sections: ArticleSection[];
    status?: 'published' | 'draft' | 'archived';
    isArchived?: boolean;
}

export interface ArticleSection {
    heading: string;
    content: string;
    imageUrl?: string;
    imageCaption?: string;
}

export interface TermDefinition {
    term: string;
    description: string;
    category: 'TECH' | 'GAMEPLAY' | 'LORE' | 'HARDWARE';
}
