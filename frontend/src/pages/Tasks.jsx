import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', deadline: '', project_id: '', user_id: '' });
  const [taskSub, setTaskSub] = useState({ submission_url: '', tags: '', description: '', taskId: null });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin';
  const queryProject = new URLSearchParams(useLocation().search).get('project');

  const fetchTasks = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        api.get('/projects/'),
        api.get('/tasks/')
      ]);
      setProjects(pRes.data);
      setTasks(tRes.data);
      if (isAdmin) {
        const uRes = await api.get('/users/');
        setUsers(uRes.data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/tasks/', { ...newTask, deadline: new Date(newTask.deadline).toISOString() });
    setNewTask({ title: '', description: '', deadline: '', project_id: '', user_id: '' });
    fetchTasks();
  };

  const handleStatus = async (id, status) => {
    await api.put(`/tasks/${id}`, { status });
    fetchTasks();
  };

  const submitTask = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/tasks/${taskSub.taskId}/submit`, {
        submission_url: taskSub.submission_url,
        tags: taskSub.tags,
        description: taskSub.description
      });
      setTaskSub({ submission_url: '', tags: '', description: '', taskId: null });
      alert("Work submitted successfully!");
      fetchTasks();
    } catch (err) {
      alert("Submission failed");
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/tasks/${id}`);
    fetchTasks();
  };

  const displayedTasks = queryProject ? tasks.filter(t => t.project_id == queryProject) : tasks;

  return (
    <div>
      <h1 className="page-title">All Tasks</h1>
      
      {/* TASK SUBMISSION FORM AT TOP (Same as Project style) */}
      {taskSub.taskId && (
        <div className="card" style={{ marginBottom: '2rem', border: '1.5px solid var(--primary-color)' }}>
          <h2 style={{ marginBottom: '1.25rem', fontSize: '1.25rem' }}>Submit Task Response</h2>
          <form onSubmit={submitTask}>
            <div className="input-group">
              <label>Submission Link (GitHub / Deployed URL)</label>
              <input className="input-field" required value={taskSub.submission_url} onChange={e => setTaskSub({...taskSub, submission_url: e.target.value})} placeholder="https://github.com/..." />
            </div>
            <div className="input-group">
              <label>Tags (comma-separated)</label>
              <input className="input-field" required value={taskSub.tags} onChange={e => setTaskSub({...taskSub, tags: e.target.value})} placeholder="frontend, react, ui" />
            </div>
            <div className="input-group">
              <label>Notes / Work Done</label>
              <textarea className="input-field" required value={taskSub.description} onChange={e => setTaskSub({...taskSub, description: e.target.value})} style={{ minHeight: '100px' }} placeholder="Explain what you have achieved..."></textarea>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" type="submit">Submit Now</button>
              <button className="btn btn-gray" type="button" onClick={() => setTaskSub({ submission_url: '', tags: '', description: '', taskId: null })}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isAdmin && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: '2rem' }}>
          <div className="grid-3" style={{ marginBottom: '1rem' }}>
            <div><label>Title</label><input className="input-field" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} /></div>
            <div><label>Deadline</label><input type="datetime-local" className="input-field" required value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} /></div>
            <div><label>Project</label>
              <select className="input-field" required value={newTask.project_id} onChange={e => setNewTask({...newTask, project_id: e.target.value})}>
                <option value="">Select Project...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-3" style={{ marginBottom: '1rem' }}>
            <div style={{ gridColumn: 'span 2' }}><label>Description</label><input className="input-field" required value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} /></div>
            <div><label>Assignee</label>
              <select className="input-field" required value={newTask.user_id} onChange={e => setNewTask({...newTask, user_id: e.target.value})}>
                <option value="">Select Assignee...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary">Create Task</button>
        </form>
      )}

      <div className="grid-3">
        {displayedTasks.map(t => {
          const project = projects.find(p => p.id === t.project_id);
          const safeStatus = t.status || 'Pending';
          return (
            <div key={t.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{t.title}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{safeStatus}</span>
              </div>
              
              <div className="task-project-label">Project: {project?.name || 'Unknown'}</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{t.description}</p>
              
              <div className="task-meta-grid">
                <div><strong>Deadline:</strong> {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'N/A'}</div>
                <div style={{ textAlign: 'right' }}><strong>Assignee:</strong> {t.assignee?.username || 'Member'}</div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {safeStatus === 'Pending' && <button className="btn btn-primary" onClick={() => handleStatus(t.id, 'In Progress')}>Start Task</button>}
                {safeStatus === 'In Progress' && <button className="btn btn-success" onClick={() => setTaskSub({ ...taskSub, taskId: t.id })}>Complete Task</button>}
                
                {/* View submission details directly on card if completed */}
                {safeStatus === 'Completed' && (
                  <div style={{ width: '100%' }}>
                    <span style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.85rem' }}>✓ Completed</span>
                    {t.submissions?.length > 0 && (
                      <div style={{ marginTop: '0.5rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', borderLeft: '3px solid var(--success)' }}>
                         <button className="btn btn-primary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }} onClick={() => setTaskSub({ ...taskSub, taskId: t.id })}>View Details</button>
                      </div>
                    )}
                  </div>
                )}
                {isAdmin && <button className="btn btn-danger" onClick={() => handleDelete(t.id)}>Delete</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tasks;
