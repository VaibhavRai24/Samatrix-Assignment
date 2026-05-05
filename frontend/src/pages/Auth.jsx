import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Auth = ({ isLogin }) => {
  const [form, setForm] = useState({ username: '', password: '', role: 'Member' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const formData = new FormData();
        formData.append('username', form.username);
        formData.append('password', form.password);
        const res = await api.post('/auth/login', formData);
        localStorage.setItem('token', res.data.access_token);
        const userRes = await api.get('/users/me');
        localStorage.setItem('user', JSON.stringify(userRes.data));
        navigate('/');
      } else {
        await api.post('/auth/signup', form);
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input className="input-field" required onChange={e => setForm({...form, username: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" className="input-field" required onChange={e => setForm({...form, password: e.target.value})} />
          </div>
          {!isLogin && (
            <div className="input-group">
              <label>Role</label>
              <select className="input-field" onChange={e => setForm({...form, role: e.target.value})}>
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          )}
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>{isLogin ? 'Login' : 'Sign Up'}</button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Link to={isLogin ? '/signup' : '/login'} style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
            {isLogin ? 'Sign up' : 'Login'}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;
