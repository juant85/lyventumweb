// src/components/ui/RichTextEditor.tsx
import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import {
    Bold, Italic, List, ListOrdered, Undo, Redo,
    Heading1, Heading2, Quote, Code as CodeIcon
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            Color,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[384px] px-4 py-3',
            },
        },
    });

    if (!editor) {
        return null;
    }

    const MenuButton = ({
        onClick,
        isActive = false,
        children,
        title
    }: {
        onClick: () => void;
        isActive?: boolean;
        children: React.ReactNode;
        title: string;
    }) => (
        <button
            onClick={onClick}
            type="button"
            title={title}
            className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition ${isActive ? 'bg-slate-300 dark:bg-slate-600' : ''
                }`}
        >
            {children}
        </button>
    );

    return (
        <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
            {/* Toolbar */}
            <div className="border-b border-slate-300 dark:border-slate-600 p-2 flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-900">
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold"
                >
                    <Bold className="h-4 w-4" />
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic"
                >
                    <Italic className="h-4 w-4" />
                </MenuButton>

                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 className="h-4 w-4" />
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 className="h-4 w-4" />
                </MenuButton>

                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Numbered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </MenuButton>

                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    title="Quote"
                >
                    <Quote className="h-4 w-4" />
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    isActive={editor.isActive('codeBlock')}
                    title="Code Block"
                >
                    <CodeIcon className="h-4 w-4" />
                </MenuButton>

                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().undo().run()}
                    title="Undo"
                >
                    <Undo className="h-4 w-4" />
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().redo().run()}
                    title="Redo"
                >
                    <Redo className="h-4 w-4" />
                </MenuButton>
            </div>

            {/* Editor Content */}
            <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default RichTextEditor;
