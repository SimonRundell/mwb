/**
 * AnswerCard — a single anonymous student answer on the teacher's masonry board.
 * @param {string} text  The student's answer text.
 */
export default function AnswerCard({ text }) {
    return (
        <div className="answer-card">
            <p className="answer-card-text">{text}</p>
        </div>
    );
}
