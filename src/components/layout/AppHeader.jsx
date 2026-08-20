import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

/**
 * AppHeader — shared teacher-area header: logo, signed-in name, account
 * links and sign out. The Admin link only appears for admin accounts.
 */
export default function AppHeader() {
    const { teacher, logout } = useAuth();

    return (
        <header className="app-header">
            <Link to="/teacher" className="app-header-logo">
                <img src="/exeter-logo.png" alt="Exeter College" />
                <span className="app-header-title">Mini Whiteboard</span>
            </Link>
            <div className="app-header-nav">
                <span className="app-header-user">Signed in as <strong>{teacher?.name}</strong></span>
                <Link to="/teacher/account" className="app-header-link">My Account</Link>
                {teacher?.isAdmin && <Link to="/teacher/admin" className="app-header-link">Admin</Link>}
                <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
            </div>
        </header>
    );
}
