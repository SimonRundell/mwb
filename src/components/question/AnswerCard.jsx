import { useState } from 'react';

/**
 * AnswerCard — a single anonymous student answer on the teacher's masonry
 * board. The flag/praise buttons send a big full-screen notification back
 * to whichever device submitted this card (see notifyAnswer.php), without
 * the teacher ever seeing which student that is.
 *
 * @param {string}   text      The student's answer text.
 * @param {Function} onNotify  async (type: 'warning'|'praise') => void
 */
export default function AnswerCard({ text, onNotify }) {
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
            <p className="answer-card-text">{text}</p>
        </div>
    );
}
