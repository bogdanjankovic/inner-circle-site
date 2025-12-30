export interface Section {
    heading: string;
    content: string;
    imageSearchQuery?: string;
    imageUrl?: string;
    productUrl?: string; // New field for affiliate links
    buttonText?: string; // Custom CTA text (e.g. "Claim your abundance")
}

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface Article {
    title: string;
    excerpt: string;
    tags: string[];
    readingTime: string;
    imageCategory?: string;
    date: string;
    imageUrl: string;
    imageSearchQuery?: string;
    sections: Section[];
    slug: string;
    keyPoints?: { text: string, sectionIndex: number }[]; // TL;DR Anchor links
    status?: ArticleStatus; // New field
    isArchived?: boolean; // Deprecated, keeping for backward compatibility migration
    showAffiliateDisclosure?: boolean; // Toggle for "Affiliate links active" text
}

export interface GenerationRequest {
    topic: string;
}
