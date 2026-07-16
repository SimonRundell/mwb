import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth }  from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import api     from '../../hooks/useApi';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal   from '../../components/ui/Modal';

function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').trim();
}

/**
 * TeacherDashboard — lists the teacher's saved hinge questions with
 * create, edit, launch and copy-code actions.
 */
export default function TeacherDashboard() {
    const { teacher, logout } = useAuth();
    const toast    = useToast();
    const navigate = useNavigate();

    const [questions, setQuestions] = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [launchingId, setLaunchingId] = useState(null);
    const [filterText, setFilterText] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadQuestions();
    }, []);

    function loadQuestions() {
        setLoading(true);
        api.post('/getAllQuestions.php', {})
            .then(res => setQuestions(Array.isArray(res.data) ? res.data : []))
            .catch(() => toast.error('Failed to load questions.'))
            .finally(() => setLoading(false));
    }

    const filteredQuestions = questions.filter(q => {
        const needle = filterText.trim().toLowerCase();
        if (!needle) return true;
        return (
            (q.questionTitle || '').toLowerCase().includes(needle) ||
            (q.questionCode  || '').toLowerCase().includes(needle) ||
            stripHtml(q.questionHtml).toLowerCase().includes(needle)
        );
    });

    function copyCode(code) {
        navigator.clipboard.writeText(code)
            .then(() => toast.success(`Code "${code}" copied!`))
            .catch(() => toast.error('Could not access clipboard — please copy the code manually.'));
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.post('/deleteQuestion.php', { id: deleteTarget.id });
            setQuestions(prev => prev.filter(q => q.id !== deleteTarget.id));
            toast.success('Question deleted.');
            setDeleteTarget(null);
        } catch {
            toast.error('Failed to delete question.');
        } finally {
            setDeleting(false);
        }
    }

    async function launchQuestion(q) {
        setLaunchingId(q.id);
        try {
            await api.post('/launchQuestion.php', { id: q.id });
            navigate(`/teacher/watch/${q.id}`);
        } catch {
            toast.error('Failed to launch question.');
        } finally {
            setLaunchingId(null);
        }
    }

    return (
        <div className="app-shell">
            <header className="app-header">
                <Link to="/teacher" className="app-header-logo">
                    <img src="/exeter-logo.png" alt="Exeter College" />
                    <span className="app-header-title">Mini Whiteboard</span>
                </Link>
                <div className="app-header-nav">
                    <span className="app-header-user">Signed in as <strong>{teacher?.name}</strong></span>
                    <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
                </div>
            </header>

            <main className="app-main">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">My Questions</h1>
                        <p className="dashboard-subtitle">Launch a question to open its code for answers</p>
                    </div>
                    <Button onClick={() => navigate('/teacher/question/new')}>+ New Question</Button>
                </div>

                {!loading && questions.length > 0 && (
                    <div className="dashboard-toolbar">
                        <input
                            type="text"
                            className="form-input dashboard-search"
                            placeholder="Filter by title, code or content…"
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                        />
                    </div>
                )}

                {loading && <Spinner overlay label="Loading questions…" />}

                {!loading && questions.length === 0 && (
                    <div className="card">
                        <div className="card-body text-center">
                            <p className="empty-state-text">No questions yet — create your first one.</p>
                        </div>
                    </div>
                )}

                {!loading && questions.length > 0 && filteredQuestions.length === 0 && (
                    <div className="card">
                        <div className="card-body text-center">
                            <p className="empty-state-text">No questions match "{filterText}".</p>
                        </div>
                    </div>
                )}

                {!loading && filteredQuestions.length > 0 && (
                    <div className="question-list">
                        {filteredQuestions.map(q => (
                            <div key={q.id} className="card question-list-item">
                                <div className="card-body">
                                    <div className="question-list-row">
                                        <div className="question-list-info">
                                            <div className="question-list-title-row">
                                                <span className="quiz-accordion-name">{q.questionTitle}</span>
                                                {!!q.isActive && <span className="badge badge--green">Live</span>}
                                            </div>
                                            <p className="quiz-description">{stripHtml(q.questionHtml) || '(no preview)'}</p>
                                            <div className="quiz-meta">
                                                <span
                                                    className="code-chip"
                                                    title="Copy code"
                                                    onClick={() => copyCode(q.questionCode)}
                                                >
                                                    {q.questionCode}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="quiz-actions">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => navigate(`/teacher/question/edit/${q.id}`)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                disabled={!!q.isActive}
                                                title={q.isActive ? 'End the question before deleting it' : 'Delete question'}
                                                onClick={() => setDeleteTarget(q)}
                                            >
                                                Delete
                                            </Button>
                                            {q.isActive ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() => navigate(`/teacher/watch/${q.id}`)}
                                                >
                                                    View live board
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    disabled={launchingId === q.id}
                                                    onClick={() => launchQuestion(q)}
                                                >
                                                    {launchingId === q.id ? 'Launching…' : 'Launch'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Modal
                open={!!deleteTarget}
                onClose={() => (deleting ? null : setDeleteTarget(null))}
                title="Delete question?"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? 'Deleting…' : 'Delete'}
                        </Button>
                    </>
                }
            >
                <p>
                    Are you sure you want to delete <strong>{deleteTarget?.questionTitle}</strong>?
                    This will also remove any answers submitted for it. This cannot be undone.
                </p>
            </Modal>
        </div>
    );
}
