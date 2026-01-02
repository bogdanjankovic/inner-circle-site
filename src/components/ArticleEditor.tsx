'use client';

import { useState, useRef } from 'react';
import { Article, ArticleSection as Section } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { useModal } from '@/context/ModalContext'; // Added
import RichTextEditor from './RichTextEditor';

interface ArticleEditorProps {
    article: Article;
}

interface ImageUploaderProps {
    currentUrl?: string;
    onUpload: (url: string) => void;
    label: string;
    recommendedSize?: string;
}

// Helper Component for Image Uploading
function ImageUploader({
    currentUrl,
    onUpload,
    label,
    recommendedSize
}: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { success, error } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            onUpload(data.url);
            success('Image uploaded successfully');
        } catch (err) {
            console.error(err);
            error('Failed to upload image');
        } finally {
            setUploading(false);
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-baseline mb-1">
                <label className="block text-xs font-bold font-sans uppercase text-gray-400 tracking-wider">{label}</label>
                {recommendedSize && (
                    <span className="text-[10px] text-purple-400 font-mono bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">
                        {recommendedSize}
                    </span>
                )}
            </div>

            {/* Preview Area */}
            <div className={`relative group w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 transition-colors
                ${!currentUrl ? 'h-32 flex items-center justify-center' : 'aspect-video'}`}>

                {currentUrl ? (
                    <>
                        <img
                            src={currentUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-white text-black font-bold rounded-lg text-sm hover:bg-gray-100"
                            >
                                Change Image
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-gray-400 font-medium text-sm flex flex-col items-center gap-2 hover:text-gray-600 transition-colors"
                    >
                        <span>{uploading ? 'Uploading...' : 'Click to Upload Image'}</span>
                    </button>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
            {currentUrl && (
                <p className="text-[10px] text-gray-400 truncate font-mono">{currentUrl}</p>
            )}
        </div>
    );
}

export default function ArticleEditor({ article }: ArticleEditorProps) {
    const router = useRouter();
    const { success, error } = useToast();
    const { showConfirm } = useModal(); // Added
    const [title, setTitle] = useState(article.title);
    const [author, setAuthor] = useState(article.author || 'Protocol Officer');
    const [excerpt, setExcerpt] = useState(article.excerpt);
    const [status, setStatus] = useState(article.status || (article.isArchived ? 'archived' : 'published'));

    // UI-specific wrapper for sections to handle drag-and-drop state preservation and collapsing
    type UISection = Section & { _ui_id: string; _collapsed?: boolean };

    const [sections, setSections] = useState<UISection[]>(() =>
        article.sections.map(s => ({
            ...s,
            _ui_id: Math.random().toString(36).substr(2, 9),
            _collapsed: false
        }))
    );

    const [imageUrl, setImageUrl] = useState(article.imageUrl || '');
    const [showAffiliateDisclosure, setShowAffiliateDisclosure] = useState(article.showAffiliateDisclosure || false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragReadyIndex, setDragReadyIndex] = useState<number | null>(null);

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newSections = [...sections];
        const draggedItem = newSections[draggedIndex];
        newSections.splice(draggedIndex, 1);
        newSections.splice(index, 0, draggedItem);

        setDraggedIndex(index);
        setSections(newSections);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragReadyIndex(null);
    };

    const toggleCollapse = (index: number) => {
        const newSections = [...sections];
        newSections[index]._collapsed = !newSections[index]._collapsed;
        setSections(newSections);
    };

    const [saving, setSaving] = useState(false);

    const handleSave = async (newStatus?: string) => {
        setSaving(true);
        const finalStatus = newStatus || status;

        // Strip UI properties before saving
        const cleanSections = sections.map(({ _ui_id, _collapsed, ...s }) => s);

        try {
            const res = await fetch('/api/admin/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug: article.slug,
                    title,
                    excerpt,
                    author,
                    sections: cleanSections,
                    status: finalStatus,
                    tags: article.tags,
                    imageUrl,
                    imageSearchQuery: '',
                    showAffiliateDisclosure
                }),
            });

            if (!res.ok) throw new Error('Failed to save');

            setStatus(finalStatus as any);
            router.refresh();
            success('Saved successfully!');
        } catch (e) {
            error('Error saving article');
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleSectionChange = (index: number, field: keyof Section, value: string) => {
        const newSections = [...sections];
        newSections[index] = { ...newSections[index], [field]: value };
        setSections(newSections);
    };

    const handleSectionImageUpload = (index: number, url: string) => {
        handleSectionChange(index, 'imageUrl', url);
    };

    // UI State for tabs per section
    const [sectionMediaTabs, setSectionMediaTabs] = useState<Record<number, 'image' | 'youtube' | 'tweet' | 'table'>>({});

    const getActiveTab = (idx: number, section: Section) => {
        if (sectionMediaTabs[idx]) return sectionMediaTabs[idx];
        if (section.tableData && section.tableData.length > 0) return 'table';
        if (section.youtubeUrl) return 'youtube';
        if (section.tweetUrl) return 'tweet';
        return 'image';
    };

    const handleTabChange = (idx: number, type: 'image' | 'youtube' | 'tweet' | 'table') => {
        setSectionMediaTabs(prev => ({ ...prev, [idx]: type }));

        setSections(prevSections => {
            const newSections = [...prevSections];
            const section = { ...newSections[idx] };

            // Enforce mutual exclusivity by clearing other fields
            if (type === 'image') {
                section.youtubeUrl = '';
                section.tweetUrl = '';
                section.tableData = []; // Clear table
            } else if (type === 'youtube') {
                section.imageUrl = '';
                section.tweetUrl = '';
                section.tableData = [];
            } else if (type === 'tweet') {
                section.imageUrl = '';
                section.youtubeUrl = '';
                section.tableData = [];
            } else if (type === 'table') {
                section.imageUrl = '';
                section.youtubeUrl = '';
                section.tweetUrl = '';
            }

            newSections[idx] = section;
            return newSections;
        });
    };

    return (
        <div className="space-y-8 max-w-[95%] mx-auto">
            {/* Header Controls */}
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 sticky top-4 z-50">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-1">Status</h2>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${status === 'published' ? 'bg-green-100 text-green-800' :
                            status === 'archived' ? 'bg-gray-200 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {status?.toUpperCase()}
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => handleSave('draft')}
                        disabled={saving}
                        className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-sm transition-colors"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={() => handleSave('published')}
                        disabled={saving}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-purple-500/20"
                    >
                        {saving ? 'Publishing...' : 'Publish Live'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content Editor - NOW WIDER (3/4 cols) */}
                <div className="lg:col-span-3 space-y-8">

                    {/* Meta Section */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
                        <div>
                            <label className="block text-xs font-bold font-sans uppercase text-gray-400 tracking-wider mb-2">Article Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none text-2xl font-serif font-bold text-gray-800 dark:text-gray-100 placeholder-gray-300"
                                placeholder="Enter a captivating title..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold font-sans uppercase text-gray-400 tracking-wider mb-2">Author</label>
                            <input
                                type="text"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none text-gray-600 dark:text-gray-300"
                                placeholder="Protocol Officer"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold font-sans uppercase text-gray-400 tracking-wider mb-2">Excerpt</label>
                            <textarea
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none text-gray-600 dark:text-gray-300 text-lg leading-relaxed resize-none"
                                placeholder="A brief, intriguing summary..."
                            />
                        </div>
                    </div>

                    {/* Sections */}
                    <div className="space-y-8">
                        {sections.map((section, idx) => {
                            const activeTab = getActiveTab(idx, section);
                            return (
                                <div
                                    key={section._ui_id}
                                    draggable={dragReadyIndex === idx}
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragOver={(e) => handleDragOver(e, idx)}
                                    onDragEnd={handleDragEnd}
                                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all ${draggedIndex === idx ? 'opacity-50 ring-2 ring-purple-500' : ''}`}
                                >
                                    {/* Section Header */}
                                    <div
                                        className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        onMouseEnter={() => setDragReadyIndex(idx)}
                                        onMouseLeave={() => setDragReadyIndex(null)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent drag interference if any
                                                    toggleCollapse(idx);
                                                }}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 text-gray-400 transition-transform ${section._collapsed ? '-rotate-90' : ''}`}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                                                </svg>
                                            </button>
                                            <span className="text-xs font-bold uppercase text-gray-400 tracking-widest">
                                                Section {idx + 1}
                                                {section._collapsed && section.heading && <span className="text-gray-600 dark:text-gray-300 ml-3 normal-case truncate max-w-xs inline-block align-bottom font-serif">:: {section.heading}</span>}
                                            </span>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                const confirmed = await showConfirm('Are you sure you want to remove this section?');
                                                if (confirmed) {
                                                    const newSections = sections.filter((_, i) => i !== idx);
                                                    setSections(newSections);
                                                    setSectionMediaTabs(prev => {
                                                        const newState = { ...prev };
                                                        delete newState[idx];
                                                        return newState;
                                                    });
                                                }
                                            }}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                            title="Remove Section"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>

                                    {!section._collapsed && (
                                        <div className="p-6 space-y-6">
                                            {/* Heading */}
                                            <div>
                                                <input
                                                    type="text"
                                                    value={section.heading}
                                                    onChange={(e) => handleSectionChange(idx, 'heading', e.target.value)}
                                                    className="w-full px-0 py-2 border-0 border-b-2 border-transparent focus:border-purple-500 focus:ring-0 bg-transparent text-xl font-serif font-bold text-gray-800 dark:text-gray-100 placeholder-gray-300 transition-colors"
                                                    placeholder="Section Heading"
                                                />
                                            </div>

                                            {/* Split View: Content & Image */}
                                            <div className="grid md:grid-cols-2 gap-8">

                                                {/* Text Content */}
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-bold font-sans uppercase text-gray-300 tracking-wider mb-2">Content</label>
                                                        <RichTextEditor
                                                            content={section.content}
                                                            onChange={(html) => handleSectionChange(idx, 'content', html)}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Visuals & Links */}
                                                <div className="space-y-6 bg-gray-50 dark:bg-gray-900/30 p-6 rounded-xl flex flex-col h-full">

                                                    {/* Media Type Tabs */}
                                                    <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                                        {(['image', 'youtube', 'tweet', 'table'] as const).map((type) => (
                                                            <button
                                                                key={type}
                                                                onClick={() => handleTabChange(idx, type)}
                                                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${activeTab === type
                                                                    ? 'bg-white dark:bg-gray-700 text-purple-500 shadow-sm'
                                                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                                                    }`}
                                                            >
                                                                {type === 'tweet' ? 'X / Tweet' : type}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Input Area - Conditional Rendering */}
                                                    <div className="flex-grow">
                                                        {/* Image View */}
                                                        {activeTab === 'image' && (
                                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                                <ImageUploader
                                                                    label="Section Image"
                                                                    recommendedSize="1200 x 800 (3:2)"
                                                                    currentUrl={section.imageUrl}
                                                                    onUpload={(url) => handleSectionImageUpload(idx, url)}
                                                                />
                                                                <div>
                                                                    <label className="block text-xs font-bold font-sans uppercase text-gray-400 tracking-wider mb-2">Image Caption</label>
                                                                    <input
                                                                        type="text"
                                                                        value={section.imageSearchQuery || ''}
                                                                        onChange={(e) => handleSectionChange(idx, 'imageSearchQuery', e.target.value)}
                                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-xs font-serif italic text-gray-500 text-center"
                                                                        placeholder="Enter a caption for the image..."
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* YouTube View */}
                                                        {activeTab === 'youtube' && (
                                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                                <div>
                                                                    <label className="block text-xs font-bold font-sans uppercase text-red-500 tracking-wider mb-2">YouTube URL</label>
                                                                    <input
                                                                        type="text"
                                                                        value={section.youtubeUrl || ''}
                                                                        onChange={(e) => handleSectionChange(idx, 'youtubeUrl', e.target.value)}
                                                                        className="w-full px-4 py-3 rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 focus:ring-2 focus:ring-red-500 outline-none text-red-800 dark:text-red-200 font-mono text-sm"
                                                                        placeholder="https://youtube.com/watch?v=..."
                                                                    />
                                                                </div>
                                                                {/* Preview */}
                                                                {section.youtubeUrl && section.youtubeUrl.includes('v=') && (
                                                                    <div className="aspect-video rounded-lg overflow-hidden bg-black shadow-lg">
                                                                        <iframe
                                                                            width="100%"
                                                                            height="100%"
                                                                            src={`https://www.youtube.com/embed/${section.youtubeUrl.split('v=')[1]?.split('&')[0]}`}
                                                                            title="YouTube video player"
                                                                            frameBorder="0"
                                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                            allowFullScreen
                                                                        ></iframe>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Tweet View */}
                                                        {activeTab === 'tweet' && (
                                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                                <div>
                                                                    <label className="block text-xs font-bold font-sans uppercase text-blue-400 tracking-wider mb-2">X / Tweet URL or Embed Code</label>
                                                                    <textarea
                                                                        rows={3}
                                                                        value={section.tweetUrl || ''}
                                                                        onChange={(e) => {
                                                                            let val = e.target.value;
                                                                            // Auto-extract URL from Embed Code
                                                                            if (val.includes('<blockquote') && val.includes('twitter-tweet')) {
                                                                                const match = val.match(/href="https:\/\/(twitter|x)\.com\/[^/]+\/status\/(\d+)/);
                                                                                if (match) {
                                                                                    val = match[0].replace('href="', '');
                                                                                }
                                                                            }
                                                                            handleSectionChange(idx, 'tweetUrl', val);
                                                                        }}
                                                                        className="w-full px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 focus:ring-2 focus:ring-blue-500 outline-none text-blue-800 dark:text-blue-200 font-mono text-sm resize-none"
                                                                        placeholder="Paste the URL or the full <blockquote ...> embed code here..."
                                                                    />
                                                                </div>
                                                                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 text-center flex items-center justify-center gap-2">
                                                                    <span className="text-xl">ℹ️</span>
                                                                    <p className="text-xs text-blue-500 text-left">
                                                                        System optimizes Embed Codes to standard components for performance. <br />
                                                                        Preview will load in the live article.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Table View */}
                                                        {activeTab === 'table' && (
                                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                                <div>
                                                                    <label className="block text-xs font-bold font-sans uppercase text-green-500 tracking-wider mb-2">Paste Table Data (Excel/Sheets)</label>
                                                                    <textarea
                                                                        rows={5}
                                                                        // Show raw TSV if editing, or convert back for display? 
                                                                        // Better to perhaps keep a separate rawText state? 
                                                                        // For now, let's just make it a "Input" area that populates the tableData
                                                                        placeholder="Paste cells directly from Google Sheets or Excel..."
                                                                        className="w-full px-4 py-3 rounded-lg border border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10 focus:ring-2 focus:ring-green-500 outline-none text-green-800 dark:text-green-200 font-mono text-xs resize-none whitespace-pre"
                                                                        onChange={(e) => {
                                                                            const rawInfo = e.target.value;
                                                                            // Split by newlines, then tabs
                                                                            const rows = rawInfo.split(/\r?\n/).filter(r => r.trim() !== '');
                                                                            const tableData = rows.map(r => r.split('\t'));
                                                                            // Update Section State
                                                                            // We need to cast because handleSectionChange expects string usually.
                                                                            // We need a specific handler or just ignore TS for a sec or update the function signature
                                                                            // Let's update handleSectionChange signature or use setSections directly here for complexity
                                                                            const newSections = [...sections];
                                                                            newSections[idx] = { ...newSections[idx], tableData };
                                                                            setSections(newSections);
                                                                        }}
                                                                    />
                                                                </div>

                                                                {section.tableData && section.tableData.length > 0 && (
                                                                    <div className="overflow-x-auto border border-green-200 dark:border-green-900/30 rounded-lg">
                                                                        <table className="w-full text-left border-collapse text-xs">
                                                                            <thead>
                                                                                <tr className="bg-green-100 dark:bg-green-900/20">
                                                                                    {section.tableData[0].map((header, hIdx) => (
                                                                                        <th key={hIdx} className="p-2 border-b border-r border-green-200 dark:border-green-900/30 last:border-r-0 font-bold text-green-800 dark:text-green-200 font-sans uppercase tracking-wider">
                                                                                            {header}
                                                                                        </th>
                                                                                    ))}
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {section.tableData.slice(1).map((row, rIdx) => (
                                                                                    <tr key={rIdx} className="border-b border-green-100 dark:border-green-900/10 last:border-b-0 hover:bg-green-50 dark:hover:bg-green-900/5 transition-colors">
                                                                                        {row.map((cell, cIdx) => (
                                                                                            <td key={cIdx} className="p-2 border-r border-green-100 dark:border-green-900/10 last:border-r-0 text-gray-600 dark:text-gray-300 font-mono">
                                                                                                {cell}
                                                                                            </td>
                                                                                        ))}
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                        <div className="p-2 bg-green-50 dark:bg-green-900/10 text-[10px] text-center text-green-600 dark:text-green-400 font-mono">
                                                                            {section.tableData.length - 1} Rows &times; {section.tableData[0].length} Columns
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Affiliate Links - Always Visible at Bottom */}
                                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4 mt-auto">
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase text-blue-500 mb-1">🛒 Product Link</label>
                                                            <input
                                                                type="url"
                                                                value={section.productUrl || ''}
                                                                onChange={(e) => handleSectionChange(idx, 'productUrl', e.target.value)}
                                                                className="w-full px-3 py-2 rounded-lg border border-blue-100 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 text-xs text-blue-800"
                                                                placeholder="https://amazon.com/..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase text-purple-500 mb-1">✨ CTA Text</label>
                                                            <input
                                                                type="text"
                                                                value={section.buttonText || ''}
                                                                onChange={(e) => handleSectionChange(idx, 'buttonText', e.target.value)}
                                                                className="w-full px-3 py-2 rounded-lg border border-purple-100 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800 text-xs text-purple-800 font-serif italic"
                                                                placeholder="Claim your match..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <button
                            onClick={() => {
                                setSections([
                                    ...sections,
                                    {
                                        heading: 'New Section',
                                        content: '',
                                        imageUrl: '',
                                        imageSearchQuery: '',
                                        _ui_id: Math.random().toString(36).substr(2, 9),
                                        _collapsed: false
                                    }
                                ]);
                            }}
                            className="w-full py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 font-bold uppercase tracking-widest hover:border-purple-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all mt-8"
                        >
                            + Add New Section
                        </button>
                    </div>
                </div>

                {/* Sidebar - Cover Image */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 sticky top-32">
                        <h3 className="font-serif font-bold text-xl mb-6 text-gray-800 dark:text-white">Cover Appearance</h3>
                        <ImageUploader
                            label="Cover Image"
                            recommendedSize="1920 x 1080 (16:9)"
                            currentUrl={imageUrl}
                            onUpload={setImageUrl}
                        />
                        <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                            This image will be the first thing readers see. Make it expansive and atmospheric.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
