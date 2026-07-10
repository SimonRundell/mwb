import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input  from '../../components/ui/Input';
import api    from '../../hooks/useApi';

/**
 * StudentEntry — the public landing page.
 * Students enter the code their teacher gave them; no account required.
 */
export default function StudentEntry() {
    const navigate = useNavigate();
    const [code,    setCode]    = useState('');
    const [error,   setError]   = useState('');
    const [loading, setLoading] = useState(false);

    async function handleJoin(e) {
        e.preventDefault();
        setError('');
        const trimmed = code.trim().toLowerCase();
        if (!trimmed) return setError('Please enter a code.');

        setLoading(true);
        try {
            await api.post('/getQuestionByCode.php', { questionCode: trimmed });
            navigate(`/answer/${trimmed}`);
        } catch (err) {
            if (err.response?.status === 410) {
                setError('This question is not currently accepting answers.');
            } else {
                setError('Code not found. Check the code and try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="entry-page">
            <div className="entry-card">
                <div className="entry-logo">
                    <img src="/exeter-logo.png" alt="Exeter College" />
                </div>
                <h1 className="entry-title">Mini Whiteboard</h1>
                <p className="entry-subtitle">Enter the code your teacher has given you</p>

                <form onSubmit={handleJoin} noValidate>
                    <Input
                        label="Question code"
                        placeholder="e.g. g4o21x"
                        value={code}
                        onChange={e => setCode(e.target.value.toLowerCase())}
                        autoComplete="off"
                        autoFocus
                    />
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <Button type="submit" fullWidth size="lg" disabled={loading} className="mt-2">
                        {loading ? 'Joining…' : 'Join →'}
                    </Button>
                </form>

                <p className="entry-teacher-link">
                    Are you a teacher? <Link to="/teacher/login">Sign in here</Link>
                </p>
            </div>
        </div>
    );
}
