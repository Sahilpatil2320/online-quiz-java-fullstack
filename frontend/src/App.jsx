import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ExamLayout from './layouts/ExamLayout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import QuizzesPage from './pages/QuizzesPage';
import QuizInstructionsPage from './pages/QuizInstructionsPage';
import QuizAttemptPage from './pages/QuizAttemptPage';
import ResultPage from './pages/ResultPage';
import ReviewPage from './pages/ReviewPage';
import MyResultsPage from './pages/MyResultsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminQuizEditorPage from './pages/admin/AdminQuizEditorPage';
import AdminPreviewPage from './pages/admin/AdminPreviewPage';

export default function App() {
  return (
    <Routes>
      <Route element={<ExamLayout />}>
        <Route path="/attempt/:attemptId" element={<ProtectedRoute><QuizAttemptPage /></ProtectedRoute>} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/quizzes" element={<QuizzesPage />} />
        <Route path="/quizzes/:quizId/instructions" element={<QuizInstructionsPage />} />
        <Route path="/results/:attemptId" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
        <Route path="/results/:attemptId/review" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
        <Route path="/my-results" element={<ProtectedRoute><MyResultsPage /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/admin" element={<ProtectedRoute admin><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/quizzes/new" element={<ProtectedRoute admin><AdminQuizEditorPage /></ProtectedRoute>} />
        <Route path="/admin/quizzes/:quizId/edit" element={<ProtectedRoute admin><AdminQuizEditorPage /></ProtectedRoute>} />
        <Route path="/admin/quizzes/:quizId/preview" element={<ProtectedRoute admin><AdminPreviewPage /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
