'use client';

import { TermDefinition } from '@/lib/types';
import IntelTooltip from './IntelTooltip';

interface SmartContentProps {
    content: string;
    glossary: Record<string, TermDefinition>;
}

export default function SmartContent({ content, glossary }: SmartContentProps) {
    // If content wraps simple HTML (p tags), we might want to still parse it for terms.
    // However, robustly parsing HTML to inject React components (Tooltips) requires html-react-parser.
    // For now, to support the Rich Text Editor, we prioritize rendering the HTML correctly.
    // Tooltips will safely degrade to just rendering the text unless we add a complex parser later.

    return (
        <div
            className="prose prose-invert prose-lg max-w-none text-gray-300 [&>p]:leading-relaxed [&>ul]:my-4 [&>h2]:text-white [&>h2]:mt-8 [&>h2]:mb-4 [&>a]:text-green-500 [&>a]:underline hover:[&>a]:text-green-400"
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
