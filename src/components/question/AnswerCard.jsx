import { useState } from 'react';

/**
 * AnswerCard — a single student answer on the teacher's masonry board,
 * labelled with the student's name so misconceptions can be traced back to
 * who gave them. The flag/praise buttons send a big full-screen notification
 * back to whichever device submitted this card (see notifyAnswer.php).
 *
 * @param {string}   name      The student's name.
 * @param {string}   text      The student's answer text.
 * @param {Function} onNotify  async (type: 'warning'|'praise') => void
 */
export default function AnswerCard({ name, text, onNotify }) {
    const [sending, setSending] = useState(null);
    const [sent, setSent] = useState(null);

    async function handleNotify(type) {
        if (sending) return;
        setSending(type);
        try {
            await onNotify(type);
            setSent(type);
            setTimeout(() => setSent(null), 2000);
        } finally {
            setSending(null);
        }
    }

    return (
        <div className="answer-card">
            <div className="answer-card-actions">
                <button
                    type="button"
                    className="answer-card-action answer-card-action--warning"
                    title="Flag this answer back to the student"
                    disabled={!!sending}
                    onClick={() => handleNotify('warning')}
                >
                    {sent === 'warning' ? '✓' : '⚠️'}
                </button>
                <button
                    type="button"
                    className="answer-card-action answer-card-action--praise"
                    title="Highlight this answer back to the student"
                    disabled={!!sending}
                    onClick={() => handleNotify('praise')}
                >
                    {sent === 'praise' ? '✓' : '🌟'}
                </button>
            </div>
            <p className="answer-card-name">{name}</p>
            <p className="answer-card-text">{text}</p>
        </div>
    );
}
