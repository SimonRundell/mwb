import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useToast } from '../../contexts/ToastContext';
import api      from '../../hooks/useApi';
import Button   from '../../components/ui/Button';
import Spinner  from '../../components/ui/Spinner';
import AnswerCard from '../../components/question/AnswerCard';

const POLL_INTERVAL_MS = 3000;

/**
 * WatchAnswers — projector-friendly live masonry board for a launched
 * hinge question. Polls getAnswers.php every 3 seconds. "End Question"
 * closes the code and deletes all answers.
 */
export default function WatchAnswers() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [question, setQuestion] = useState(null);
    const [answers,  setAnswers]  = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [ending,   setEnding]   = useState(false);
    const pollRef = useRef(null);

    useEffect(() => {
        api.post('/getQuestionById.php', { id: Number(id) })
            .then(res => setQuestion(res.data))
            .catch(() => toast.error('Failed to load question.'))
            .finally(() => setLoading(false));

        pollAnswers();
        pollRef.current = setInterval(pollAnswers, POLL_INTERVAL_MS);
        return () => clearInterval(pollRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    function pollAnswers() {
        api.post('/getAnswers.php', { id: Number(id) })
            .then(res => setAnswers(Array.isArray(res.data?.answers) ? res.data.answers : []))
            .catch(() => {});
    }

    async function handleEnd() {
        setEnding(true);
        try {
            await api.post('/endQuestion.php', { id: Number(id) });
            toast.success('Question ended — answers cleared.');
            navigate('/teacher');
        } catch {
            toast.error('Failed to end question.');
        } finally {
            setEnding(false);
        }
    }

    const sanitizedHtml = question ? DOMPurify.sanitize(question.questionHtml) : '';

    return (
        <div className="watch-page">
            <div className="watch-header">
                <div>
                    <div className="watch-title">🖊️ {question?.questionTitle || 'Mini Whiteboard'}</div>
                    <div className="watch-subtitle">
                        {answers.length} answer{answers.length !== 1 ? 's' : ''} so far
                    </div>
                </div>

                <div className="watch-code-box">
                    <span className="watch-code-prompt">Enter this code to join:</span>
                    <span className="watch-code-value">{question?.questionCode}</span>
                </div>

                <div className="watch-header-actions">
                    <Button variant="danger" onClick={handleEnd} disabled={ending}>
                        {ending ? 'Ending…' : 'End Question'}
                    </Button>
                    <Link to="/teacher" className="watch-dashboard-link">← Dashboard</Link>
                </div>
            </div>

            <div className="watch-body">
                {loading && <Spinner overlay label="Loading question…" />}

                {!loading && question && (
                    <div
                        className="watch-question-html"
                        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                    />
                )}

                {!loading && answers.length === 0 && (
                    <div className="watch-empty">
                        Waiting for answers…<br />
                        <span className="watch-empty-hint">
                            Tell students to visit the site and enter code <strong>{question?.questionCode}</strong>
                        </span>
                    </div>
                )}

                {answers.length > 0 && (
                    <div className="answer-masonry">
                        {answers.map(a => (
                            <AnswerCard key={a.id} text={a.answerText} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
