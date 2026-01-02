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
    imageSearchQuery?: string;
}

export interface ArticleSection {
    heading: string;
    content: string;
    imageUrl?: string;
    imageCaption?: string;
    imageSearchQuery?: string;
    youtubeUrl?: string; // New: YouTube Video
    tweetUrl?: string;   // New: X/Twitter Post
    productUrl?: string; // For affiliate buttons
    buttonText?: string; // Custom button text
    tableData?: string[][]; // 2D Array for Tables
}

export interface TermDefinition {
    term: string;
    description: string;
    category: 'TECH' | 'GAMEPLAY' | 'LORE' | 'HARDWARE';
}
