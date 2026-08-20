import { useEffect, useState } from 'react';
import CryptoJS from 'crypto-js';
import { useAuth }  from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import api        from '../../hooks/useApi';
import Button     from '../../components/ui/Button';
import Input      from '../../components/ui/Input';
import Spinner    from '../../components/ui/Spinner';
import Modal      from '../../components/ui/Modal';
import Switch     from '../../components/ui/Switch';
import AppHeader  from '../../components/layout/AppHeader';

const emptyEdit = { teacherName: '', email: '', password: '', isAdmin: false, isActive: true };

/**
 * TeacherAdmin — administrator tab for managing all staff accounts:
 * edit name/email, reset password, grant/revoke admin, activate/deactivate.
 */
export default function TeacherAdmin() {
    const { teacher } = useAuth();
    const toast = useToast();

    const [users,   setUsers]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [editTarget, setEditTarget] = useState(null);
    const [edit,       setEdit]       = useState(emptyEdit);
    const [saving,      setSaving]    = useState(false);
    const [error,       setError]     = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    function loadUsers() {
        setLoading(true);
        api.post('/getUsers.php', {})
            .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
            .catch(() => toast.error('Failed to load accounts.'))
            .finally(() => setLoading(false));
    }

    function openEdit(user) {
        setEditTarget(user);
        setEdit({
            teacherName: user.teacherName,
            email: user.email,
            password: '',
            isAdmin: user.isAdmin,
            isActive: user.isActive,
        });
        setError('');
    }

    async function saveEdit() {
        if (!edit.teacherName.trim()) return setError('Name cannot be empty.');
        if (!edit.email.trim()) return setError('Email cannot be empty.');

        setSaving(true);
        setError('');
        try {
            const payload = {
                id: editTarget.id,
                teacherName: edit.teacherName.trim(),
                email: edit.email.trim(),
                isAdmin: edit.isAdmin,
                isActive: edit.isActive,
            };
            if (edit.password) payload.passwordHash = CryptoJS.MD5(edit.password).toString();

            await api.post('/updateUser.php', payload);
            setUsers(prev => prev.map(u => u.id === editTarget.id
                ? { ...u, teacherName: payload.teacherName, email: payload.email, isAdmin: payload.isAdmin, isActive: payload.isActive }
                : u));
            toast.success('Account updated.');
            setEditTarget(null);
        } catch (err) {
            const msg = err.response?.data?.message;
            setError(msg || 'Failed to update account.');
        } finally {
            setSaving(false);
        }
    }

    const isSelf = editTarget?.id === teacher?.id;

    return (
        <div className="app-shell">
            <AppHeader />
            <main className="app-main">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Admin — Staff Accounts</h1>
                        <p className="dashboard-subtitle">Edit accounts, reset passwords, and activate or deactivate staff</p>
                    </div>
                </div>

                {loading && <Spinner overlay label="Loading accounts…" />}

                {!loading && (
                    <div className="card">
                        <div className="user-table-wrap">
                            <table className="user-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td className="user-table-name">
                                                {u.teacherName}
                                                {u.id === teacher?.id && <span className="user-table-you"> (you)</span>}
                                            </td>
                                            <td className="user-table-email">{u.email}</td>
                                            <td>
                                                <div className="user-table-badges">
                                                    {u.isAdmin && <span className="badge badge--blue">Admin</span>}
                                                    <span className={`badge ${u.isActive ? 'badge--green' : 'badge--red'}`}>
                                                        {u.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <Button variant="secondary" size="sm" onClick={() => openEdit(u)}>
                                                    Edit
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            <Modal
                open={!!editTarget}
                onClose={() => (saving ? null : setEditTarget(null))}
                title={`Edit ${editTarget?.teacherName || ''}`}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setEditTarget(null)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={saveEdit} disabled={saving}>
                            {saving ? 'Saving…' : 'Save changes'}
                        </Button>
                    </>
                }
            >
                <Input
                    label="Display name"
                    type="text"
                    value={edit.teacherName}
                    onChange={e => setEdit(v => ({ ...v, teacherName: e.target.value }))}
                />
                <Input
                    label="Email address"
                    type="email"
                    value={edit.email}
                    onChange={e => setEdit(v => ({ ...v, email: e.target.value }))}
                />
                <Input
                    label="Set new password"
                    type="password"
                    value={edit.password}
                    onChange={e => setEdit(v => ({ ...v, password: e.target.value }))}
                    hint="Leave blank to keep their current password."
                />
                <Switch
                    label="Administrator"
                    checked={edit.isAdmin}
                    disabled={isSelf}
                    onChange={v => setEdit(prev => ({ ...prev, isAdmin: v }))}
                />
                <Switch
                    label="Account active"
                    checked={edit.isActive}
                    disabled={isSelf}
                    onChange={v => setEdit(prev => ({ ...prev, isActive: v }))}
                />
                {isSelf && (
                    <p className="form-hint">Ask another administrator to change your own admin or active status.</p>
                )}
                {error && <p className="form-error mt-2" role="alert">{error}</p>}
            </Modal>
        </div>
    );
}
