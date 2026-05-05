import { useState, useEffect } from 'react';
import api from '../api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    api.get('/dashboard')
      .then(res => setStats(res.data))
      .catch(console.error);
  }, []);

  if (!stats) return <div style={{ padding: '2rem' }}>Loading Dashboard...</div>;

  const cards = [
    { label: 'Total Tasks', value: stats.total_tasks },
    { label: 'Completed', value: stats.completed_tasks },
    { label: 'Pending/In Progress', value: stats.pending_tasks },
    { label: 'Overdue Tasks', value: stats.overdue_tasks }
  ];

  return (
    <div>
      <h1 className="page-title">Dashboard Overview</h1>
      <div className="grid-3">
        {cards.map(card => (
          <div className="card" key={card.label}>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>{card.label}</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-main)' }}>{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
