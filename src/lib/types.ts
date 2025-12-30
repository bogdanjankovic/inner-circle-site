export interface Article {
    title: string;
    excerpt: string;
    imageUrl: string;
    date: string;
    author: string;
    readTime: string; // Keep for backward compatibility if needed
    readingTime?: string; // New preferred field
    slug: string;
    sections: ArticleSection[];
    status?: 'published' | 'draft' | 'archived';
    isArchived?: boolean;
    tags?: string[];
    showAffiliateDisclosure?: boolean;
    keyPoints?: string[];
}

export interface ArticleSection {
    heading: string;
    content: string;
    imageUrl?: string;
    imageCaption?: string;
    imageSearchQuery?: string;
    productUrl?: string; // For affiliate buttons
    buttonText?: string; // Custom button text
}

export interface TermDefinition {
    term: string;
    description: string;
    category: 'TECH' | 'GAMEPLAY' | 'LORE' | 'HARDWARE';
}
