'use client';

import { useState } from 'react';
import { TermDefinition } from '@/lib/types';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

interface GlossaryManagerProps {
    initialGlossary: Record<string, TermDefinition>;
}

export default function GlossaryManager({ initialGlossary }: GlossaryManagerProps) {
    const [glossary, setGlossary] = useState(initialGlossary);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingTerm, setEditingTerm] = useState<TermDefinition | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<TermDefinition>>({
        term: '',
        description: '',
        category: 'TECH'
    });

    const { success, error } = useToast();
    const router = useRouter();

    const termsList = Object.values(glossary).sort((a, b) => a.term.localeCompare(b.term));
    const filteredTerms = termsList.filter(t =>
        t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const resetForm = () => {
        setFormData({ term: '', description: '', category: 'TECH' });
        setEditingTerm(null);
        setIsAdding(false);
    };

    const handleEdit = (termDef: TermDefinition) => {
        setEditingTerm(termDef);
        setFormData(termDef);
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (term: string) => {
        if (!confirm(`Are you sure you want to delete "${term}"?`)) return;

        try {
            const res = await fetch('/api/admin/glossary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ term, action: 'delete' })
            });

            if (!res.ok) throw new Error('Failed to delete');

            const { glossary: newGlossary } = await res.json();
            setGlossary(newGlossary);
            success('Term deleted successfully');
            router.refresh();
        } catch (e) {
            console.error(e);
            error('Failed to delete term');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.term || !formData.description) {
            error('Term and Description are required');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/glossary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    term: formData.term,
                    description: formData.description,
                    category: formData.category
                })
            });

            if (!res.ok) throw new Error('Failed to save');

            const { glossary: newGlossary } = await res.json();
            setGlossary(newGlossary);
            success(`Term "${formData.term}" saved successfully`);
            resetForm();
            router.refresh();
        } catch (e) {
            console.error(e);
            error('Failed to save term');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">

            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold font-mono">
                    System Glossary <span className="text-gray-400 font-normal text-sm ml-2">({termsList.length} terms)</span>
                </h2>
                <div className="flex gap-4 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search terms..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none w-full md:w-64"
                    />
                    <button
                        onClick={() => { resetForm(); setIsAdding(!isAdding); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${isAdding
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/20'
                            }`}
                    >
                        {isAdding ? 'Cancel' : '+ Add Term'}
                    </button>
                </div>
            </div>

            {/* Editor Form */}
            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-purple-500/20 space-y-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4">
                        <h3 className="font-bold text-lg">{editingTerm ? 'Edit Term' : 'New Term Definition'}</h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Term Name</label>
                            <input
                                type="text"
                                value={formData.term}
                                onChange={e => setFormData({ ...formData, term: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                                placeholder="e.g. Neural Link"
                            />
                            <p className="text-[10px] text-gray-400">Case-sensitive matching in articles.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="TECH">TECH</option>
                                <option value="GAMEPLAY">GAMEPLAY</option>
                                <option value="LORE">LORE</option>
                                <option value="HARDWARE">HARDWARE</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                            placeholder="Brief explanation shown in the tooltip..."
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            className="px-8 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg shadow-purple-500/20 transition-all transform hover:scale-105"
                        >
                            {editingTerm ? 'Update Definition' : 'Save Definition'}
                        </button>
                    </div>
                </form>
            )}

            {/* Terms Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTerms.map((t) => (
                    <div key={t.term} className="group bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-purple-500/50 transition-colors relative">
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-gray-800 dark:text-white">{t.term}</h4>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded
                                ${t.category === 'TECH' ? 'bg-blue-100 text-blue-700' :
                                    t.category === 'LORE' ? 'bg-purple-100 text-purple-700' :
                                        t.category === 'GAMEPLAY' ? 'bg-green-100 text-green-700' :
                                            'bg-gray-100 text-gray-700'}`}>
                                {t.category}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8 line-clamp-3">
                            {t.description}
                        </p>

                        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEdit(t)}
                                className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Edit"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleDelete(t.term)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}

                {filteredTerms.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 font-mono text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        No terms found matching "{searchTerm}"
                    </div>
                )}
            </div>
        </div>
    );
}
