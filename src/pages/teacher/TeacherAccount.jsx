import { useState } from 'react';
import CryptoJS from 'crypto-js';
import { useAuth }  from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import api        from '../../hooks/useApi';
import Button     from '../../components/ui/Button';
import Input      from '../../components/ui/Input';
import AppHeader  from '../../components/layout/AppHeader';

/**
 * TeacherAccount — self-service page for a signed-in teacher to change
 * their own display name and/or password. Email is fixed (admin-only).
 */
export default function TeacherAccount() {
    const { teacher, updateTeacher } = useAuth();
    const toast = useToast();

    const [teacherName,     setTeacherName]     = useState(teacher?.name || '');
    const [password,        setPassword]        = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving,          setSaving]          = useState(false);
    const [error,           setError]           = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!teacherName.trim()) {
            return setError('Name cannot be empty.');
        }
        if (password && password !== confirmPassword) {
            return setError('Passwords do not match.');
        }

        const payload = {};
        if (teacherName.trim() !== teacher?.name) payload.teacherName = teacherName.trim();
        if (password) payload.passwordHash = CryptoJS.MD5(password).toString();

        if (Object.keys(payload).length === 0) {
            return setError('Nothing to save.');
        }

        setSaving(true);
        try {
            const res = await api.post('/updateMyAccount.php', payload);
            updateTeacher(res.data.teacher);
            setPassword('');
            setConfirmPassword('');
            toast.success('Account updated.');
        } catch (err) {
            const msg = err.response?.data?.message;
            setError(msg || 'Failed to update account.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="app-shell">
            <AppHeader />
            <main className="app-main">
                <div className="account-page">
                    <div className="dashboard-header">
                        <div>
                            <h1 className="dashboard-title">My Account</h1>
                            <p className="dashboard-subtitle">Update your display name and password</p>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-body">
                            <form onSubmit={handleSubmit} noValidate>
                                <Input
                                    label="Display name"
                                    type="text"
                                    value={teacherName}
                                    onChange={e => setTeacherName(e.target.value)}
                                    autoComplete="name"
                                />
                                <Input
                                    label="Email address"
                                    type="email"
                                    value={teacher?.email || ''}
                                    disabled
                                    hint="Contact an administrator to change your email address."
                                />
                                <Input
                                    label="New password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    hint="Leave blank to keep your current password."
                                />
                                <Input
                                    label="Confirm new password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                                {error && <p className="form-error mb-4" role="alert">{error}</p>}
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Saving…' : 'Save changes'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
