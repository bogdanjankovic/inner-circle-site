'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';
import { useModal } from '@/context/ModalContext';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-green-500 underline hover:text-green-400 transition-colors',
                },
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 min-h-[150px] outline-none',
            },
        },
        editable: true,
        injectCSS: false, // We control CSS via Tailwind
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Handle initial loading state
    if (!editor) {
        return <div className="h-[200px] w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse flex items-center justify-center text-gray-400">Loading Editor...</div>;
    }

    const { showPrompt } = useModal();

    const setLink = async () => {
        const previousUrl = editor.getAttributes('link').href;
        // OLD: const url = window.prompt('URL', previousUrl);
        const url = await showPrompt('Enter the URL for the link:', {
            title: 'Add Link',
            inputValue: previousUrl,
            inputPlaceholder: 'https://example.com'
        });

        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900/50 flex flex-col">
            {/* Toolbar - Explicit Colors to prevent invisibility */}
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`px-2 py-1 rounded text-sm font-bold border ${editor.isActive('bold') ? 'bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-black dark:text-white' : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                    title="Bold"
                    type="button"
                >
                    B
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`px-2 py-1 rounded text-sm italic border ${editor.isActive('italic') ? 'bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-black dark:text-white' : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                    title="Italic"
                    type="button"
                >
                    i
                </button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 self-center"></div>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`px-2 py-1 rounded text-sm font-bold border ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-black dark:text-white' : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                    title="Heading 2"
                    type="button"
                >
                    H2
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`px-2 py-1 rounded text-sm font-bold border ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-black dark:text-white' : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                    title="Heading 3"
                    type="button"
                >
                    H3
                </button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 self-center"></div>
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`px-2 py-1 rounded text-sm border ${editor.isActive('bulletList') ? 'bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-black dark:text-white' : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                    title="Bullet List"
                    type="button"
                >
                    • List
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`px-2 py-1 rounded text-sm border ${editor.isActive('orderedList') ? 'bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-black dark:text-white' : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                    title="Ordered List"
                    type="button"
                >
                    1. List
                </button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 self-center"></div>
                <button
                    onClick={setLink}
                    className={`px-2 py-1 rounded text-sm border ${editor.isActive('link') ? 'bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-black dark:text-white' : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                    title="Link"
                    type="button"
                >
                    🔗
                </button>
                {editor.isActive('link') && (
                    <button
                        onClick={() => editor.chain().focus().unsetLink().run()}
                        className="px-2 py-1 rounded text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Unlink"
                        type="button"
                    >
                        ⨉
                    </button>
                )}
            </div>

            {/* Editor Area */}
            <div className="cursor-text bg-white dark:bg-gray-900/50 min-h-[200px]" onClick={() => editor.commands.focus()}>
                <EditorContent editor={editor} className="min-h-[200px]" />
            </div>
        </div>
    );
}
