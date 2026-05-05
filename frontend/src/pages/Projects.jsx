import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin';
  const navigate = useNavigate();

  const fetchData = () => {
    api.get('/projects/').then(res => setProjects(res.data)).catch(console.error);
    api.get('/tasks/').then(res => setTasks(res.data)).catch(console.error);
  };
  
  useEffect(() => {
    fetchData();
    if (isAdmin) api.get('/users/').then(res => setUsers(res.data)).catch(console.error);
  }, [isAdmin]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/projects/', newProject);
    setNewProject({ name: '', description: '' });
    fetchData();
  };

  const handleLeave = async (id) => {
    if (isAdmin) await api.delete(`/projects/${id}`);
    else await api.delete(`/projects/${id}/leave`);
    fetchData();
  };

  return (
    <div>
      <h1 className="page-title">Projects</h1>

      {isAdmin && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}><label>Project Name</label><input className="input-field" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} /></div>
          <div style={{ flex: 2 }}><label>Description</label><input className="input-field" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} /></div>
          <button className="btn btn-primary">Add Project</button>
        </form>
      )}

      <div className="grid-3" style={{ alignItems: 'start' }}>
        {projects.map(p => {
          const pTasks = tasks.filter(t => t.project_id === p.id);
          const completedCount = pTasks.filter(t => t.status === 'Completed').length;
          const isSubmitted = (p.submissions || []).some(s => s.user_id === user.id);
          
          return (
            <div key={p.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{p.name}</h3>
                {isSubmitted && <span className="status-badge-pill">Submitted ✓</span>}
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 1rem', fontSize: '0.9rem' }}>{p.description}</p>
              
              <div className="progress-container">Tasks: {completedCount} / {pTasks.length}</div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!isAdmin && (
                  <button className="btn btn-primary" onClick={() => navigate(`/projects/${p.id}`)}>
                    Submit Project
                  </button>
                )}
                {isAdmin && (
                  <button className="btn btn-primary" onClick={() => navigate(`/projects/${p.id}`)}>
                    View Details
                  </button>
                )}
                <button className="btn btn-danger" onClick={() => handleLeave(p.id)}>{isAdmin ? 'Delete' : 'Leave'}</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default Projects;
