import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import api from '../../hooks/useApi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import QuestionEditor from '../../components/question/QuestionEditor';

function genCode() { return Math.random().toString(36).substring(2, 8); }

/**
 * QuestionEditorPage — creates a new hinge question or edits an existing
 * one, depending on whether :id is present in the route.
 */
export default function QuestionEditorPage() {
    const { id } = useParams();
    const isEdit = !!id;
    const navigate = useNavigate();
    const toast = useToast();

    const [title,   setTitle]   = useState('');
    const [html,    setHtml]    = useState('');
    const [code,    setCode]    = useState('');
    const [loading, setLoading] = useState(isEdit);
    const [saving,  setSaving]  = useState(false);

    useEffect(() => {
        if (!isEdit) { setCode(genCode()); return; }
        api.post('/getQuestionById.php', { id: Number(id) })
            .then(res => {
                setTitle(res.data.questionTitle);
                setHtml(res.data.questionHtml);
                setCode(res.data.questionCode);
            })
            .catch(() => toast.error('Failed to load question.'))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function handleSave() {
        if (!title.trim()) return toast.error('Please give the question a title.');
        if (!html || html === '<p></p>') return toast.error('Please write the question.');

        setSaving(true);
        try {
            if (isEdit) {
                await api.post('/updateQuestion.php', {
                    id: Number(id),
                    questionTitle: title.trim(),
                    questionHtml: html,
                });
                toast.success('Question updated!');
            } else {
                await api.post('/insertQuestion.php', {
                    questionCode: code,
                    questionTitle: title.trim(),
                    questionHtml: html,
                });
                toast.success('Question created!');
            }
            navigate('/teacher');
        } catch {
            toast.error('Failed to save question.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <Spinner overlay label="Loading question…" />;

    return (
        <div className="app-shell">
            <header className="app-header">
                <Link to="/teacher" className="app-header-logo">
                    <img src="/exeter-logo.png" alt="Exeter College" />
                    <span className="app-header-title">Mini Whiteboard</span>
                </Link>
            </header>

            <main className="app-main">
                <div className="editor-toolbar">
                    <h1 className="editor-toolbar-title">{isEdit ? 'Edit Question' : 'New Question'}</h1>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={() => navigate('/teacher')}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
                    </div>
                </div>

                <div className="card editor-metadata">
                    <div className="card-body">
                        <Input
                            label="Title (for your dashboard only — not shown to students)"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Mitosis vs Meiosis check"
                            autoFocus
                        />
                        {code && (
                            <p className="form-hint">
                                Code: <span className="code-chip">{code}</span>{' '}
                                {isEdit ? '(fixed once created)' : '(assigned now, stays the same every time you launch)'}
                            </p>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h3>Question</h3></div>
                    <div className="card-body">
                        <QuestionEditor content={html} onChange={setHtml} />
                    </div>
                </div>
            </main>
        </div>
    );
}
