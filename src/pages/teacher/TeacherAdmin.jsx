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
const emptyAdd  = { teacherName: '', email: '', password: '', isAdmin: false, isActive: true };

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

    const [addOpen, setAddOpen] = useState(false);
    const [add,     setAdd]     = useState(emptyAdd);
    const [adding,  setAdding]  = useState(false);
    const [addError, setAddError] = useState('');

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting]     = useState(false);

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

    function openAdd() {
        setAdd(emptyAdd);
        setAddError('');
        setAddOpen(true);
    }

    async function saveAdd() {
        if (!add.teacherName.trim()) return setAddError('Name cannot be empty.');
        if (!add.email.trim()) return setAddError('Email cannot be empty.');
        if (!add.password) return setAddError('A password is required for a new account.');

        setAdding(true);
        setAddError('');
        try {
            const payload = {
                teacherName: add.teacherName.trim(),
                email: add.email.trim(),
                passwordHash: CryptoJS.MD5(add.password).toString(),
                isAdmin: add.isAdmin,
                isActive: add.isActive,
            };
            const res = await api.post('/addUser.php', payload);
            setUsers(prev => [...prev, res.data].sort((a, b) => a.teacherName.localeCompare(b.teacherName)));
            toast.success('Account created.');
            setAddOpen(false);
        } catch (err) {
            const msg = err.response?.data?.message;
            setAddError(msg || 'Failed to create account.');
        } finally {
            setAdding(false);
        }
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.post('/deleteUser.php', { id: deleteTarget.id });
            setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
            toast.success('Account deleted.');
            setDeleteTarget(null);
        } catch (err) {
            const msg = err.response?.data?.message;
            toast.error(msg || 'Failed to delete account.');
        } finally {
            setDeleting(false);
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
                    <Button onClick={openAdd}>+ Add user</Button>
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
                                                <div className="flex gap-2">
                                                    <Button variant="secondary" size="sm" onClick={() => openEdit(u)}>
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        disabled={u.id === teacher?.id}
                                                        title={u.id === teacher?.id ? 'Ask another administrator to delete your own account' : 'Delete account'}
                                                        onClick={() => setDeleteTarget(u)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
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

            <Modal
                open={addOpen}
                onClose={() => (adding ? null : setAddOpen(false))}
                title="Add user"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={adding}>
                            Cancel
                        </Button>
                        <Button onClick={saveAdd} disabled={adding}>
                            {adding ? 'Creating…' : 'Create account'}
                        </Button>
                    </>
                }
            >
                <Input
                    label="Display name"
                    type="text"
                    value={add.teacherName}
                    onChange={e => setAdd(v => ({ ...v, teacherName: e.target.value }))}
                />
                <Input
                    label="Email address"
                    type="email"
                    value={add.email}
                    onChange={e => setAdd(v => ({ ...v, email: e.target.value }))}
                />
                <Input
                    label="Password"
                    type="password"
                    value={add.password}
                    onChange={e => setAdd(v => ({ ...v, password: e.target.value }))}
                />
                <Switch
                    label="Administrator"
                    checked={add.isAdmin}
                    onChange={v => setAdd(prev => ({ ...prev, isAdmin: v }))}
                />
                <Switch
                    label="Account active"
                    checked={add.isActive}
                    onChange={v => setAdd(prev => ({ ...prev, isActive: v }))}
                />
                {addError && <p className="form-error mt-2" role="alert">{addError}</p>}
            </Modal>

            <Modal
                open={!!deleteTarget}
                onClose={() => (deleting ? null : setDeleteTarget(null))}
                title="Delete account?"
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
                    Are you sure you want to delete <strong>{deleteTarget?.teacherName}</strong>&apos;s account?
                    This will also permanently delete any questions and answers they own. This cannot be undone.
                </p>
            </Modal>
        </div>
    );
}
