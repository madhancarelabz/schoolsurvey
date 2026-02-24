import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SessionPage from './pages/SessionPage';
import CompletePage from './pages/CompletePage';

function App() {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/session" element={<SessionPage />} />
            <Route path="/complete" element={<CompletePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
