import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

/**
 * QuestionEditor — Tiptap-based rich text editor for authoring a hinge
 * question. Emits the current content as an HTML string via onChange.
 * @param {string}   content   Initial/controlled HTML content.
 * @param {Function} onChange  Called with the updated HTML string.
 */
export default function QuestionEditor({ content, onChange }) {
    const editor = useEditor({
        extensions: [StarterKit, Underline],
        content: content || '',
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
    });

    // Keeps the editor in sync when content arrives asynchronously
    // (e.g. loading an existing question for editing) without fighting
    // the user's own typing on every keystroke.
    useEffect(() => {
        if (editor && content !== undefined && content !== editor.getHTML()) {
            editor.commands.setContent(content || '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content, editor]);

    if (!editor) return null;

    const toolbarButtons = [
        { label: 'B',  title: 'Bold',          active: editor.isActive('bold'),        onClick: () => editor.chain().focus().toggleBold().run() },
        { label: 'I',  title: 'Italic',        active: editor.isActive('italic'),      onClick: () => editor.chain().focus().toggleItalic().run() },
        { label: 'U',  title: 'Underline',     active: editor.isActive('underline'),   onClick: () => editor.chain().focus().toggleUnderline().run() },
        { label: '•',  title: 'Bullet list',   active: editor.isActive('bulletList'),  onClick: () => editor.chain().focus().toggleBulletList().run() },
        { label: '1.', title: 'Numbered list', active: editor.isActive('orderedList'), onClick: () => editor.chain().focus().toggleOrderedList().run() },
    ];

    return (
        <div className="question-editor">
            <div className="question-editor-toolbar">
                {toolbarButtons.map(btn => (
                    <button
                        key={btn.title}
                        type="button"
                        className={`question-editor-btn${btn.active ? ' question-editor-btn--active' : ''}`}
                        title={btn.title}
                        onClick={btn.onClick}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>
            <EditorContent editor={editor} className="question-editor-content" />
        </div>
    );
}
