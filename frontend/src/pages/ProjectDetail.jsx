import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [form, setForm] = useState({ link: '', notes: '' });
  const [loading, setLoading] = useState(true);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin';

  useEffect(() => {
    api.get('/projects/').then(res => {
      const found = res.data.find(p => p.id == projectId);
      if (!found) { navigate('/projects'); return; }
      setProject(found);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${projectId}/submit`, { link: form.link, notes: form.notes });
      setSubmittedData({ link: form.link, notes: form.notes });
      setSubmitted(true);
    } catch (err) {
      alert("Submission failed: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!project) return <div style={{ padding: '2rem' }}>Project not found.</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button className="btn btn-gray" style={{ marginBottom: '1.5rem' }} onClick={() => navigate('/projects')}>← Back</button>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>{project.name}</h1>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Description</h3>
        <p style={{ color: 'var(--text-secondary)' }}>{project.description}</p>
      </div>

      {!submitted ? (
        <div className="card" style={{ border: '1.5px solid var(--primary-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Submit Project</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Project URL</label>
              <input className="input-field" required value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="Enter your project URL (GitHub / Live Link)" />
            </div>
            <div className="input-group">
              <label>Work Description</label>
              <textarea className="input-field" required value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ minHeight: '150px' }} placeholder="Describe your work / paste your content here"></textarea>
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={!form.link.trim() || !form.notes.trim()}>Submit Project</button>
          </form>
        </div>
      ) : (
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>Submission Successful</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Your project has been submitted for review.</p>
          </div>
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Submitted URL:</strong><br />
              <a href={submittedData.link} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', wordBreak: 'break-all' }}>{submittedData.link}</a>
            </div>
            <div>
              <strong>Work Description:</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>{submittedData.notes}</p>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Member Submissions</h2>
          {(project.submissions || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No submissions yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {project.submissions.map(sub => (
                <div key={sub.id} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '0.5rem', borderLeft: '4px solid var(--success)' }}>
                  <div style={{ marginBottom: '0.5rem' }}><strong>Link:</strong> <a href={sub.link} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>{sub.link}</a></div>
                  <div><strong>Notes:</strong> <span style={{ color: 'var(--text-secondary)' }}>{sub.notes || 'None'}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
