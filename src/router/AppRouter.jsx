import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute     from './AdminRoute';

import StudentEntry       from '../pages/student/StudentEntry';
import AnswerSubmit       from '../pages/student/AnswerSubmit';
import TeacherLogin       from '../pages/teacher/TeacherLogin';
import TeacherRegister    from '../pages/teacher/TeacherRegister';
import TeacherDashboard   from '../pages/teacher/TeacherDashboard';
import TeacherAccount     from '../pages/teacher/TeacherAccount';
import TeacherAdmin       from '../pages/teacher/TeacherAdmin';
import QuestionEditorPage from '../pages/teacher/QuestionEditorPage';
import WatchAnswers       from '../pages/teacher/WatchAnswers';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <Routes>
                        {/* Student (public) */}
                        <Route path="/"                 element={<StudentEntry />} />
                        <Route path="/answer/:code"      element={<AnswerSubmit />} />

                        {/* Teacher auth */}
                        <Route path="/teacher/login"    element={<TeacherLogin />} />
                        <Route path="/teacher/register" element={<TeacherRegister />} />

                        {/* Teacher (protected) */}
                        <Route path="/teacher" element={
                            <ProtectedRoute><TeacherDashboard /></ProtectedRoute>
                        } />
                        <Route path="/teacher/account" element={
                            <ProtectedRoute><TeacherAccount /></ProtectedRoute>
                        } />
                        <Route path="/teacher/admin" element={
                            <AdminRoute><TeacherAdmin /></AdminRoute>
                        } />
                        <Route path="/teacher/question/new" element={
                            <ProtectedRoute><QuestionEditorPage /></ProtectedRoute>
                        } />
                        <Route path="/teacher/question/edit/:id" element={
                            <ProtectedRoute><QuestionEditorPage /></ProtectedRoute>
                        } />
                        <Route path="/teacher/watch/:id" element={
                            <ProtectedRoute><WatchAnswers /></ProtectedRoute>
                        } />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
