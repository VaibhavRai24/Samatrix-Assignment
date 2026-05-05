import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">ProjectFlow</div>
      <div className="sidebar-nav">
        {[
          { path: '/', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/projects', label: 'Projects', icon: FolderKanban },
          { path: '/tasks', label: 'Tasks', icon: CheckSquare }
        ].map(item => (
          <Link key={item.path} to={item.path} className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
      <div style={{ padding: '1rem' }}>
        <button className="btn btn-danger" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={handleLogout}>
          <LogOut size={16} />Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
