import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

const INDENT = '    '; // 4 spaces, matches PEP 8

/**
 * Shifts every line touched by the current selection 4 spaces right (indent)
 * or removes up to 4 leading spaces (outdent). Only acts inside a code block,
 * where the block's content is one text node and lines are separated by \n.
 * @param {import('@tiptap/react').Editor} editor
 * @param {'indent'|'outdent'} direction
 */
function indentCodeLines(editor, direction) {
    editor.chain().focus().command(({ tr, state, dispatch }) => {
        const { $from, $to } = state.selection;
        if ($from.parent.type.name !== 'codeBlock') return false;

        const blockStart = $from.start();
        const text = $from.parent.textContent;
        const fromOffset = $from.pos - blockStart;
        const toOffset = $to.pos - blockStart;

        const lines = [];
        let pos = 0;
        for (const lineText of text.split('\n')) {
            lines.push({ text: lineText, start: pos, end: pos + lineText.length });
            pos += lineText.length + 1;
        }
        const affected = lines.filter(l => l.end >= fromOffset && l.start <= toOffset);
        if (!dispatch) return true;

        for (const line of [...affected].reverse()) {
            const linePos = blockStart + line.start;
            if (direction === 'indent') {
                tr.insertText(INDENT, linePos);
            } else {
                const leading = line.text.match(/^ {1,4}/);
                if (leading) tr.delete(linePos, linePos + leading[0].length);
            }
        }
        dispatch(tr);
        return true;
    }).run();
}

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
        { label: 'B',    title: 'Bold',          active: editor.isActive('bold'),        onClick: () => editor.chain().focus().toggleBold().run() },
        { label: 'I',    title: 'Italic',        active: editor.isActive('italic'),      onClick: () => editor.chain().focus().toggleItalic().run() },
        { label: 'U',    title: 'Underline',     active: editor.isActive('underline'),   onClick: () => editor.chain().focus().toggleUnderline().run() },
        { label: '</>',  title: 'Code',          active: editor.isActive('code'),        onClick: () => editor.chain().focus().toggleCode().run() },
        { label: '{ }',  title: 'Code block',    active: editor.isActive('codeBlock'),   onClick: () => editor.chain().focus().toggleCodeBlock().run() },
        { divider: true },
        { label: '¶',    title: 'Normal text',   active: editor.isActive('paragraph'),   onClick: () => editor.chain().focus().setParagraph().run() },
        { label: '•',    title: 'Bullet list',   active: editor.isActive('bulletList'),  onClick: () => editor.chain().focus().toggleBulletList().run() },
        { label: '1.',   title: 'Numbered list', active: editor.isActive('orderedList'), onClick: () => editor.chain().focus().toggleOrderedList().run() },
        { divider: true },
        { label: '⇥',    title: 'Indent',   active: false, disabled: !editor.isActive('codeBlock'), onClick: () => indentCodeLines(editor, 'indent') },
        { label: '⇤',    title: 'Outdent',  active: false, disabled: !editor.isActive('codeBlock'), onClick: () => indentCodeLines(editor, 'outdent') },
        { divider: true },
        { label: '―',    title: 'Horizontal rule', active: false,                        onClick: () => editor.chain().focus().setHorizontalRule().run() },
        { divider: true },
        { label: '↺',    title: 'Undo', active: false, disabled: !editor.can().undo(), onClick: () => editor.chain().focus().undo().run() },
        { label: '↻',    title: 'Redo', active: false, disabled: !editor.can().redo(), onClick: () => editor.chain().focus().redo().run() },
    ];

    return (
        <div className="question-editor">
            <div className="question-editor-toolbar">
                {toolbarButtons.map((btn, i) => (
                    btn.divider
                        ? <div key={`divider-${i}`} className="question-editor-divider" />
                        : (
                            <button
                                key={btn.title}
                                type="button"
                                className={`question-editor-btn${btn.active ? ' question-editor-btn--active' : ''}`}
                                title={btn.title}
                                disabled={btn.disabled}
                                onClick={btn.onClick}
                            >
                                {btn.label}
                            </button>
                        )
                ))}
            </div>
            <EditorContent editor={editor} className="question-editor-content" />
        </div>
    );
}
