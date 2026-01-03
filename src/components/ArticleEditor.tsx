'use client';

import { useState, useRef } from 'react';
import { Article, ArticleSection as Section } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { useModal } from '@/context/ModalContext';
import RichTextEditor from './RichTextEditor';
import { parseTableData } from '@/lib/csv';

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
    const { showConfirm } = useModal();
    const [title, setTitle] = useState(article.title);
    const [author, setAuthor] = useState(article.author || 'Protocol Officer');
    const [excerpt, setExcerpt] = useState(article.excerpt);
    const [status, setStatus] = useState(article.status || (article.isArchived ? 'archived' : 'published'));

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
    const [keyPoints, setKeyPoints] = useState<string[]>(article.keyPoints || []);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragReadyIndex, setDragReadyIndex] = useState<number | null>(null);

    // --- Table Modal State ---
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importTargetIdx, setImportTargetIdx] = useState<number | null>(null);
    const [importText, setImportText] = useState('');

    // --- Cell Edit State ---
    const [editingCell, setEditingCell] = useState<{ sectionIdx: number, rowIndex: number, colIndex: number } | null>(null);
    const [cellContent, setCellContent] = useState('');

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
                    keyPoints, // Persist key points
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

    const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        try {
            // Concatenate all section content to send context
            const fullContent = sections.map(s => `${s.heading}\n${s.content}`).join('\n\n');

            const res = await fetch('/api/admin/generate-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: fullContent })
            });

            if (!res.ok) throw new Error('Generation failed');

            const data = await res.json();
            if (data.keyPoints) {
                setKeyPoints(data.keyPoints);
                success('Protocol Brief generated successfully');
            }
        } catch (e) {
            console.error(e);
            error('Failed to generate summary');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleSectionChange = (index: number, field: keyof Section, value: any) => {
        const newSections = [...sections];
        newSections[index] = { ...newSections[index], [field]: value };
        setSections(newSections);
    };

    const handleSectionImageUpload = (index: number, url: string) => {
        handleSectionChange(index, 'imageUrl', url);
    };

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

            if (type === 'image') {
                section.youtubeUrl = '';
                section.tweetUrl = '';
                section.tableData = [];
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

    // --- Table Handlers ---
    const openImportModal = (sectionIdx: number) => {
        setImportTargetIdx(sectionIdx);
        setImportText('');
        setImportModalOpen(true);
    };

    const submitImport = () => {
        if (importTargetIdx === null) return;
        const parsed = parseTableData(importText);
        handleSectionChange(importTargetIdx, 'tableData', parsed);
        setImportModalOpen(false);
        setImportTargetIdx(null);
    };

    const openCellEditor = (sectionIdx: number, rowIndex: number, colIndex: number, currentContent: string) => {
        setEditingCell({ sectionIdx, rowIndex, colIndex });
        setCellContent(currentContent);
    };

    const saveCellEdit = () => {
        if (!editingCell) return;
        const { sectionIdx, rowIndex, colIndex } = editingCell;

        const newSections = [...sections];
        const newData = [...(newSections[sectionIdx].tableData || [])];
        if (newData[rowIndex]) {
            newData[rowIndex] = [...newData[rowIndex]];
            newData[rowIndex][colIndex] = cellContent;
            newSections[sectionIdx].tableData = newData;
            setSections(newSections);
        }
        setEditingCell(null);
    };

    return (
        <div className="space-y-8 max-w-[95%] mx-auto">
            {/* --- IMPORT MODAL --- */}
            {importModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg font-serif">Import Table Data</h3>
                            <button onClick={() => setImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-500">Paste your data from Excel, Google Sheets, or CSV below.</p>
                            <textarea
                                autoFocus
                                value={importText}
                                onChange={e => setImportText(e.target.value)}
                                rows={10}
                                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 font-mono text-xs focus:ring-2 focus:ring-green-500 outline-none resize-none"
                                placeholder="Rank, Model, Price..."
                            />
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                            <button onClick={() => setImportModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                            <button onClick={submitImport} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-green-500/20">Import Data</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CELL EDIT MODAL --- */}
            {editingCell && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg font-serif">Edit Cell Content</h3>
                            <button onClick={() => setEditingCell(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-6">
                            <RichTextEditor
                                content={cellContent}
                                onChange={setCellContent}
                            />
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                            <button onClick={() => setEditingCell(null)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                            <button onClick={saveCellEdit} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-purple-500/20">Save Content</button>
                        </div>
                    </div>
                </div>
            )}

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
                                                                <div className="text-center bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg p-6">
                                                                    <p className="text-xs text-green-700 dark:text-green-300 mb-4 font-mono">
                                                                        {section.tableData && section.tableData.length > 0
                                                                            ? `${section.tableData.length - 1} Rows Loaded`
                                                                            : 'No table data yet.'
                                                                        }
                                                                    </p>
                                                                    <button
                                                                        onClick={() => openImportModal(idx)}
                                                                        className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full text-xs uppercase tracking-widest shadow-lg shadow-green-500/20 transition-all transform hover:scale-105"
                                                                    >
                                                                        {section.tableData && section.tableData.length > 0 ? 'Replace Data' : 'Import from Sheets'}
                                                                    </button>
                                                                </div>

                                                                {section.tableData && section.tableData.length > 0 && (
                                                                    <div className="overflow-x-auto border border-green-200 dark:border-green-900/30 rounded-lg max-h-[300px]">
                                                                        <table className="w-full text-left border-collapse text-xs">
                                                                            <thead className="sticky top-0 z-10">
                                                                                <tr className="bg-green-100 dark:bg-green-900/50">
                                                                                    {section.tableData[0].map((header, hIdx) => (
                                                                                        <th key={hIdx} className="p-2 border-b border-r border-green-200 dark:border-green-900/30 last:border-r-0 font-bold text-green-800 dark:text-green-200 font-sans uppercase tracking-wider whitespace-nowrap">
                                                                                            {header}
                                                                                        </th>
                                                                                    ))}
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {section.tableData.slice(1).map((row, rIdx) => (
                                                                                    <tr key={rIdx} className="border-b border-green-100 dark:border-green-900/10 last:border-b-0 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                                                                                        {row.map((cell, cIdx) => (
                                                                                            <td
                                                                                                key={cIdx}
                                                                                                onClick={() => openCellEditor(idx, rIdx + 1, cIdx, cell)}
                                                                                                className="p-2 border-r border-green-100 dark:border-green-900/10 last:border-r-0 text-gray-600 dark:text-gray-300 font-mono cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30"
                                                                                                title="Click to edit cell"
                                                                                            >
                                                                                                <div dangerouslySetInnerHTML={{ __html: cell || '&nbsp;' }} className="line-clamp-2" />
                                                                                            </td>
                                                                                        ))}
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
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

                    {/* Protocol Briefing Widget */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 sticky top-[500px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-serif font-bold text-xl text-gray-800 dark:text-white">Protocol Brief</h3>
                            <button
                                onClick={handleGenerateSummary}
                                disabled={isGeneratingSummary}
                                className="text-[10px] uppercase font-bold tracking-widest bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white px-3 py-1 rounded transition-colors"
                            >
                                {isGeneratingSummary ? 'SYNCING...' : 'GENERATE AI'}
                            </button>
                        </div>

                        <div className="space-y-3">
                            {keyPoints.length === 0 && (
                                <p className="text-xs text-center text-gray-400 py-4 italic">
                                    No protocol data available.<br />Click Generate to sync.
                                </p>
                            )}
                            {keyPoints.map((point, idx) => (
                                <div key={idx} className="flex gap-2 items-start group">
                                    <span className="text-[9px] font-mono text-gray-400 mt-2">0{idx + 1}</span>
                                    <textarea
                                        value={point}
                                        onChange={(e) => {
                                            const newPoints = [...keyPoints];
                                            newPoints[idx] = e.target.value;
                                            setKeyPoints(newPoints);
                                        }}
                                        rows={2}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs font-mono text-gray-600 dark:text-gray-300 focus:ring-1 focus:ring-green-500 outline-none resize-none"
                                    />
                                    <button
                                        onClick={() => {
                                            const newPoints = keyPoints.filter((_, i) => i !== idx);
                                            setKeyPoints(newPoints);
                                        }}
                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setKeyPoints([...keyPoints, "New protocol point..."])}
                                className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 border border-dashed border-gray-200 dark:border-gray-700 rounded hover:border-gray-400 transition-colors mt-2"
                            >
                                + Add Point
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
