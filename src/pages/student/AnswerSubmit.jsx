import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import api from '../../hooks/useApi';
import Button  from '../../components/ui/Button';
import Input   from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';

const NOTIFY_POLL_INTERVAL_MS = 3000;

/**
 * Reads (or creates) the per-browser random token used to identify this
 * student's own answer card.
 */
function getStudentToken() {
    let token = localStorage.getItem('mwbStudentToken');
    if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem('mwbStudentToken', token);
    }
    return token;
}

/**
 * AnswerSubmit — renders the teacher's rich-text question, a required name
 * field, and a short answer box. The name is shown on the student's card so
 * the teacher can trace an answer back to who gave it (e.g. to follow up on
 * a misconception); it's remembered in this browser so it doesn't need
 * retyping for the next question. Submission upserts the student's own card
 * by studentToken, so they can revise their answer any time, whether or not
 * the teacher has opened the monitor screen yet.
 */
export default function AnswerSubmit() {
    const { code } = useParams();
    const navigate = useNavigate();

    const [question,   setQuestion]   = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [notFound,   setNotFound]   = useState(false);
    const [name,       setName]       = useState(() => localStorage.getItem('mwbStudentName') || '');
    const [answer,     setAnswer]     = useState('');
    const [submitted,  setSubmitted]  = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error,      setError]      = useState('');
    const [notification, setNotification] = useState(null); // 'warning' | 'praise' | null
    const notifyPollRef = useRef(null);

    useEffect(() => {
        api.post('/getQuestionByCode.php', { questionCode: code })
            .then(res => setQuestion(res.data))
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [code]);

    // Polls for a big notification the teacher has sent back to this
    // device by clicking this student's card on the monitor screen.
    useEffect(() => {
        if (!question || notFound) return;

        function pollNotification() {
            api.post('/checkNotification.php', {
                questionId: question.id,
                studentToken: getStudentToken(),
            })
                .then(res => {
                    if (res.data?.notifyType) setNotification(res.data.notifyType);
                })
                .catch(() => {});
        }

        pollNotification();
        notifyPollRef.current = setInterval(pollNotification, NOTIFY_POLL_INTERVAL_MS);
        return () => clearInterval(notifyPollRef.current);
    }, [question, notFound]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (!name.trim()) return setError('Please enter your name.');
        if (!answer.trim()) return setError('Please type an answer.');

        setSubmitting(true);
        try {
            const trimmedName = name.trim();
            await api.post('/submitAnswer.php', {
                questionId: question.id,
                studentToken: getStudentToken(),
                studentName: trimmedName,
                answerText: answer.trim(),
            });
            localStorage.setItem('mwbStudentName', trimmedName);
            setSubmitted(true);
        } catch {
            setError('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <Spinner overlay label="Loading question…" />;

    if (notFound) {
        return (
            <div className="entry-page">
                <div className="entry-card">
                    <div className="entry-logo">
                        <img src="/exeter-logo.png" alt="Exeter College" />
                    </div>
                    <h1 className="entry-title">Code not found</h1>
                    <p className="entry-subtitle">Check the code and try again.</p>
                    <Button fullWidth size="lg" onClick={() => navigate('/')}>← Back to start</Button>
                </div>
            </div>
        );
    }

    const sanitizedHtml = DOMPurify.sanitize(question.questionHtml);

    return (
        <div className="entry-page">
            {notification && (
                <div
                    className={`notify-overlay notify-overlay--${notification}`}
                    role="alert"
                    onClick={() => setNotification(null)}
                >
                    <div className="notify-overlay-icon">
                        {notification === 'warning' ? '⚠️' : '🌟'}
                    </div>
                    <div className="notify-overlay-title">
                        {notification === 'warning' ? 'Please check your answer' : 'Great answer!'}
                    </div>
                    <div className="notify-overlay-message">
                        {notification === 'warning'
                            ? 'Your teacher has flagged your answer on the board. Please review and update it.'
                            : 'Your teacher has highlighted your answer on the board. Well done!'}
                    </div>
                    <div className="notify-overlay-hint">Tap anywhere to dismiss</div>
                </div>
            )}

            <div className="entry-card">
                <div className="entry-logo">
                    <img src="/exeter-logo.png" alt="Exeter College" />
                </div>

                <div className="answer-question-html" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />

                <form onSubmit={handleSubmit} noValidate>
                    <Input
                        label="Your name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Jamie Smith"
                        maxLength={50}
                        autoFocus={!name}
                    />
                    <Input
                        label="Your answer"
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        placeholder="Type your answer…"
                        maxLength={500}
                        autoFocus={!!name}
                    />
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <Button type="submit" fullWidth size="lg" disabled={submitting} className="mt-2">
                        {submitting ? 'Sending…' : submitted ? 'Update answer' : 'Submit answer'}
                    </Button>
                    {submitted && (
                        <p className="form-hint text-center mt-3">
                            Answer submitted — you can change it any time.
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
