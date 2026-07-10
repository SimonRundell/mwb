import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

/**
 * Provides JWT-based authentication state throughout the app.
 * Token and teacher profile are persisted to localStorage.
 */
export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('mwbToken'));
    const [teacher, setTeacher] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('mwbTeacher'));
        } catch {
            return null;
        }
    });

    function login(tok, teacherObj) {
        localStorage.setItem('mwbToken', tok);
        localStorage.setItem('mwbTeacher', JSON.stringify(teacherObj));
        setToken(tok);
        setTeacher(teacherObj);
    }

    function logout() {
        localStorage.removeItem('mwbToken');
        localStorage.removeItem('mwbTeacher');
        setToken(null);
        setTeacher(null);
    }

    return (
        <AuthContext.Provider value={{ token, teacher, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
