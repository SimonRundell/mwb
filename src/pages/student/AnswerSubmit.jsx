import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import api from '../../hooks/useApi';
import Button  from '../../components/ui/Button';
import Input   from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';

/**
 * Reads (or creates) the per-browser random token used to identify this
 * student's own answer card, without ever collecting their name.
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
 * AnswerSubmit — renders the teacher's rich-text question and a short
 * answer box. Submission upserts the student's own card by studentToken,
 * so they can revise their answer until the teacher ends the question.
 */
export default function AnswerSubmit() {
    const { code } = useParams();
    const navigate = useNavigate();

    const [question,   setQuestion]   = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [ended,      setEnded]      = useState(false);
    const [notFound,   setNotFound]   = useState(false);
    const [answer,     setAnswer]     = useState('');
    const [submitted,  setSubmitted]  = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error,      setError]      = useState('');

    useEffect(() => {
        api.post('/getQuestionByCode.php', { questionCode: code })
            .then(res => setQuestion(res.data))
            .catch(err => {
                if (err.response?.status === 410) setEnded(true);
                else setNotFound(true);
            })
            .finally(() => setLoading(false));
    }, [code]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (!answer.trim()) return setError('Please type an answer.');

        setSubmitting(true);
        try {
            await api.post('/submitAnswer.php', {
                questionId: question.id,
                studentToken: getStudentToken(),
                answerText: answer.trim(),
            });
            setSubmitted(true);
        } catch (err) {
            if (err.response?.status === 410) {
                setEnded(true);
            } else {
                setError('Failed to submit. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <Spinner overlay label="Loading question…" />;

    if (notFound || ended) {
        return (
            <div className="entry-page">
                <div className="entry-card">
                    <div className="entry-logo">
                        <img src="/exeter-logo.png" alt="Exeter College" />
                    </div>
                    <h1 className="entry-title">{notFound ? 'Code not found' : 'Question ended'}</h1>
                    <p className="entry-subtitle">
                        {notFound
                            ? 'Check the code and try again.'
                            : 'Your teacher has closed this question to new answers.'}
                    </p>
                    <Button fullWidth size="lg" onClick={() => navigate('/')}>← Back to start</Button>
                </div>
            </div>
        );
    }

    const sanitizedHtml = DOMPurify.sanitize(question.questionHtml);

    return (
        <div className="entry-page">
            <div className="entry-card">
                <div className="entry-logo">
                    <img src="/exeter-logo.png" alt="Exeter College" />
                </div>

                <div className="answer-question-html" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />

                <form onSubmit={handleSubmit} noValidate>
                    <Input
                        label="Your answer"
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        placeholder="Type your answer…"
                        maxLength={500}
                        autoFocus
                    />
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <Button type="submit" fullWidth size="lg" disabled={submitting} className="mt-2">
                        {submitting ? 'Sending…' : submitted ? 'Update answer' : 'Submit answer'}
                    </Button>
                    {submitted && (
                        <p className="form-hint text-center mt-3">
                            Answer submitted — you can change it any time until your teacher ends the question.
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
