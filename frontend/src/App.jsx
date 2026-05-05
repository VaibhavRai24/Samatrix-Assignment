import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Auth from './pages/Auth';

const PrivateRoute = ({ children }) => {
  return localStorage.getItem('token') ? (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  ) : <Navigate to="/login" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth isLogin={true} />} />
        <Route path="/signup" element={<Auth isLogin={false} />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
        <Route path="/projects/:projectId" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
        <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
        <Route path="/tasks/:taskId" element={<PrivateRoute><TaskDetail /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
