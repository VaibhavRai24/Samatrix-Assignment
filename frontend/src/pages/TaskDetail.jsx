import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [form, setForm] = useState({ submission_url: '', tags: '', description: '' });
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin';

  useEffect(() => {
    api.get('/tasks/').then(res => {
      const found = res.data.find(t => t.id == taskId);
      if (!found) { navigate('/tasks'); return; }
      setTask(found);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/tasks/${taskId}/submit`, {
        submission_url: form.submission_url,
        tags: form.tags,
        description: form.description
      });
      setSubmittedData({ ...form });
      setSubmitted(true);
    } catch (err) {
      alert("Submission failed: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!task) return <div style={{ padding: '2rem' }}>Task not found.</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button className="btn btn-gray" style={{ marginBottom: '1.5rem' }} onClick={() => navigate(-1)}>← Back</button>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{task.title}</h1>
          <span className="status-badge-pill" style={{ background: submitted ? 'var(--success)' : '#64748b' }}>
            {submitted ? 'Completed' : task.status}
          </span>
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Description</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{task.description}</p>
        <div className="task-meta-grid" style={{ marginBottom: 0 }}>
          <div><strong>Deadline:</strong> {new Date(task.deadline).toLocaleDateString()}</div>
          <div style={{ textAlign: 'right' }}><strong>Assignee:</strong> {task.assignee?.username || 'Member'}</div>
        </div>
      </div>

      {!isAdmin && !submitted ? (
        <div className="card" style={{ border: '1.5px solid var(--primary-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Submit Your Work</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Project URL</label>
              <input className="input-field" required value={form.submission_url} onChange={e => setForm({...form, submission_url: e.target.value})} placeholder="Enter your project URL (GitHub / Live Link)" />
            </div>
            <div className="input-group">
              <label>Tags (comma-separated)</label>
              <input className="input-field" required value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="frontend, react, ui" />
            </div>
            <div className="input-group">
              <label>Work Description</label>
              <textarea className="input-field" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ minHeight: '150px' }} placeholder="Describe your work / paste your content here"></textarea>
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={!form.submission_url.trim() || !form.description.trim()}>Submit Task</button>
          </form>
        </div>
      ) : !isAdmin && submitted ? (
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>Submission Successful</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Your task has been submitted for review.</p>
          </div>
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Submitted URL:</strong><br />
              <a href={submittedData.submission_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', wordBreak: 'break-all' }}>{submittedData.submission_url}</a>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Tags:</strong>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                {submittedData.tags.split(',').map(tag => (
                  <span key={tag} style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{tag.trim()}</span>
                ))}
              </div>
            </div>
            <div>
              <strong>Work Description:</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>{submittedData.description}</p>
            </div>
          </div>
        </div>
      ) : null}

      {isAdmin && (
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Member Submissions</h2>
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>View submissions in the Tasks tab.</div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
