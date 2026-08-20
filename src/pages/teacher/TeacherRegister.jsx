import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import { useAuth }  from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import api    from '../../hooks/useApi';
import Button from '../../components/ui/Button';
import Input  from '../../components/ui/Input';

/**
 * TeacherRegister — self-service account creation for staff.
 * Restricted server-side to the configured staff email domain.
 */
export default function TeacherRegister() {
    const navigate  = useNavigate();
    const { login } = useAuth();
    const toast     = useToast();

    const [teacherName,     setTeacherName]     = useState('');
    const [email,           setEmail]           = useState('');
    const [password,        setPassword]        = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading,         setLoading]         = useState(false);
    const [error,           setError]           = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (!teacherName || !email || !password) {
            return setError('Please fill in all fields.');
        }
        if (password !== confirmPassword) {
            return setError('Passwords do not match.');
        }
        setLoading(true);
        try {
            const hash = CryptoJS.MD5(password).toString();
            const res  = await api.post('/registerUser.php', {
                teacherName,
                email,
                passwordHash: hash,
            });
            const { token, teacher } = res.data;
            login(token, teacher);
            toast.success(`Welcome, ${teacher.name}!`);
            navigate('/teacher', { replace: true });
        } catch (err) {
            const msg = err.response?.data?.message;
            setError(msg || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <img src="/exeter-logo.png" alt="Exeter College" />
                    <div>
                        <h1 className="login-title">Staff Registration</h1>
                        <p className="login-subtitle">Mini Whiteboard — Staff Portal</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <Input
                        label="Full name"
                        type="text"
                        value={teacherName}
                        onChange={e => setTeacherName(e.target.value)}
                        autoComplete="name"
                        autoFocus
                    />
                    <Input
                        label="Email address"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoComplete="username"
                        hint="Must be a registered institution email address."
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                    <Input
                        label="Confirm password"
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                    {error && <p className="form-error mb-4" role="alert">{error}</p>}
                    <Button type="submit" fullWidth size="lg" disabled={loading}>
                        {loading ? 'Creating account…' : 'Create account'}
                    </Button>
                </form>

                <p className="login-back-link">
                    <Link to="/teacher/login">← Back to sign in</Link>
                </p>
            </div>
        </div>
    );
}
