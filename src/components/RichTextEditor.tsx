'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

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
                class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 min-h-[150px]',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Sync content if it changes externally (only when not focused to avoid cursor jumps, 
    // though purely controlled inputs in TipTap are tricky. This is a basic sync.)
    // For this specific use case (admin editor), we mostly push changes OUT.
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Check if content is empty or different significantly to avoid loops
            // editor.commands.setContent(content); 
            // Commented out to avoid re-render loops on every keystroke if parent updates too fast.
            // Only strictly necessary if 'sections' can be reordered or loaded from DB.
            // On load, useEditor 'content' param handles it.
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // update
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900/50">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700 text-purple-500' : 'text-gray-500'}`}
                    title="Bold"
                    type="button"
                >
                    <strong>B</strong>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700 text-purple-500' : 'text-gray-500'}`}
                    title="Italic"
                    type="button"
                >
                    <em>i</em>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${editor.isActive('strike') ? 'bg-gray-200 dark:bg-gray-700 text-purple-500' : 'text-gray-500'}`}
                    title="Strike"
                    type="button"
                >
                    <s>S</s>
                </button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 self-center"></div>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700 text-purple-500' : 'text-gray-500'}`}
                    title="Heading 2"
                    type="button"
                >
                    H2
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 dark:bg-gray-700 text-purple-500' : 'text-gray-500'}`}
                    title="Heading 3"
                    type="button"
                >
                    H3
                </button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 self-center"></div>
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700 text-purple-500' : 'text-gray-500'}`}
                    title="Bullet List"
                    type="button"
                >
                    • List
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700 text-purple-500' : 'text-gray-500'}`}
                    title="Ordered List"
                    type="button"
                >
                    1. List
                </button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 self-center"></div>
                <button
                    onClick={setLink}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${editor.isActive('link') ? 'bg-gray-200 dark:bg-gray-700 text-purple-500' : 'text-gray-500'}`}
                    title="Link"
                    type="button"
                >
                    🔗
                </button>
                <button
                    onClick={() => editor.chain().focus().unsetLink().run()}
                    disabled={!editor.isActive('link')}
                    className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-500 disabled:opacity-30"
                    title="Unlink"
                    type="button"
                >
                    ❌
                </button>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}
