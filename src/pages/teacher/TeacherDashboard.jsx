import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }  from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import api        from '../../hooks/useApi';
import Button     from '../../components/ui/Button';
import Spinner    from '../../components/ui/Spinner';
import Modal      from '../../components/ui/Modal';
import AppHeader  from '../../components/layout/AppHeader';
import { genCode } from '../../utils/questionCode';

function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').trim();
}

const EXPORT_APP = 'mwb';
const EXPORT_TYPE = 'questions';

/**
 * Validates a parsed import file and returns the usable question entries.
 * Accepts { app: 'mwb', type: 'questions', questions: [...] } and, leniently,
 * a bare array of question objects.
 */
function parseImportPayload(data) {
    const list = Array.isArray(data) ? data : data?.questions;
    if (!Array.isArray(list)) {
        return { valid: [], skipped: 0, formatError: true };
    }
    const valid = [];
    let skipped = 0;
    for (const item of list) {
        const questionTitle = typeof item?.questionTitle === 'string' ? item.questionTitle.trim() : '';
        const questionHtml  = typeof item?.questionHtml  === 'string' ? item.questionHtml.trim()  : '';
        if (questionTitle && questionHtml) {
            valid.push({ questionTitle, questionHtml });
        } else {
            skipped++;
        }
    }
    return { valid, skipped, formatError: false };
}

/**
 * TeacherDashboard — lists the teacher's saved hinge questions with
 * create, edit, launch and copy-code actions.
 */
export default function TeacherDashboard() {
    const { teacher } = useAuth();
    const toast    = useToast();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [questions, setQuestions] = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [launchingId, setLaunchingId] = useState(null);
    const [filterText, setFilterText] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [importPreview, setImportPreview] = useState(null); // { valid, skipped, formatError }
    const [importing, setImporting] = useState(false);

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

    const allFilteredSelected = filteredQuestions.length > 0
        && filteredQuestions.every(q => selectedIds.has(q.id));

    function toggleSelected(id) {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }

    function toggleSelectAllFiltered() {
        setSelectedIds(prev => {
            if (allFilteredSelected) {
                const next = new Set(prev);
                filteredQuestions.forEach(q => next.delete(q.id));
                return next;
            }
            const next = new Set(prev);
            filteredQuestions.forEach(q => next.add(q.id));
            return next;
        });
    }

    function exportSelected() {
        const selected = questions.filter(q => selectedIds.has(q.id));
        if (selected.length === 0) return;

        const payload = {
            app: EXPORT_APP,
            type: EXPORT_TYPE,
            version: 1,
            exportedAt: new Date().toISOString(),
            exportedBy: teacher?.name || '',
            questions: selected.map(q => ({
                questionTitle: q.questionTitle,
                questionHtml: q.questionHtml,
            })),
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        const stamp = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `mwb-questions-${stamp}.json`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success(`Exported ${selected.length} question${selected.length === 1 ? '' : 's'}.`);
    }

    function handleImportFileChange(e) {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-selecting the same file later
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            let data;
            try {
                data = JSON.parse(reader.result);
            } catch {
                setImportPreview({ valid: [], skipped: 0, formatError: true });
                return;
            }
            setImportPreview(parseImportPayload(data));
        };
        reader.onerror = () => toast.error('Could not read that file.');
        reader.readAsText(file);
    }

    async function confirmImport() {
        if (!importPreview?.valid.length) return;
        setImporting(true);

        let created = 0;
        let failed = 0;

        for (const item of importPreview.valid) {
            let ok = false;
            for (let attempt = 0; attempt < 2 && !ok; attempt++) {
                try {
                    await api.post('/insertQuestion.php', {
                        questionCode: genCode(),
                        questionTitle: item.questionTitle,
                        questionHtml: item.questionHtml,
                    });
                    ok = true;
                } catch {
                    // retry once with a fresh code in case of a questionCode collision
                }
            }
            if (ok) created++; else failed++;
        }

        setImporting(false);
        setImportPreview(null);
        loadQuestions();

        if (failed === 0) {
            toast.success(`Imported ${created} question${created === 1 ? '' : 's'}.`);
        } else {
            toast.error(`Imported ${created}, ${failed} failed. Check the file and try again.`);
        }
    }

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
            setSelectedIds(prev => {
                if (!prev.has(deleteTarget.id)) return prev;
                const next = new Set(prev);
                next.delete(deleteTarget.id);
                return next;
            });
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
            <AppHeader />

            <main className="app-main">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">My Questions</h1>
                        <p className="dashboard-subtitle">Launch a question to open its code for answers</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                            Import…
                        </Button>
                        <Button onClick={() => navigate('/teacher/question/new')}>+ New Question</Button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/json"
                        onChange={handleImportFileChange}
                        style={{ display: 'none' }}
                    />
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
                        <div className="dashboard-selection-bar">
                            <label className="dashboard-select-all">
                                <input
                                    type="checkbox"
                                    checked={allFilteredSelected}
                                    onChange={toggleSelectAllFiltered}
                                />
                                Select all
                            </label>
                            <span className="dashboard-selection-count">
                                {selectedIds.size} selected
                            </span>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={selectedIds.size === 0}
                                onClick={exportSelected}
                            >
                                Export selected
                            </Button>
                        </div>
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
                                        <input
                                            type="checkbox"
                                            className="question-list-checkbox"
                                            checked={selectedIds.has(q.id)}
                                            onChange={() => toggleSelected(q.id)}
                                            aria-label={`Select ${q.questionTitle}`}
                                        />
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

            <Modal
                open={!!importPreview}
                onClose={() => (importing ? null : setImportPreview(null))}
                title="Import questions"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setImportPreview(null)} disabled={importing}>
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmImport}
                            disabled={importing || !importPreview?.valid.length}
                        >
                            {importing ? 'Importing…' : `Import ${importPreview?.valid.length || 0}`}
                        </Button>
                    </>
                }
            >
                {importPreview?.formatError && (
                    <p className="form-error" role="alert">
                        That file does not look like an mwb questions export.
                        Expected a JSON file with a questions array.
                    </p>
                )}
                {!importPreview?.formatError && importPreview?.valid.length === 0 && (
                    <p className="form-error" role="alert">
                        No valid questions found in that file.
                    </p>
                )}
                {!importPreview?.formatError && importPreview?.valid.length > 0 && (
                    <p>
                        Found <strong>{importPreview.valid.length}</strong> question
                        {importPreview.valid.length === 1 ? '' : 's'} to import
                        {importPreview.skipped > 0 && (
                            <> ({importPreview.skipped} skipped — missing title or content)</>
                        )}. Each will be added to your question list as a new, unlaunched question.
                    </p>
                )}
            </Modal>
        </div>
    );
}
