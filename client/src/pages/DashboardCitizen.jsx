import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardCitizen = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <main style={{ maxWidth: 640, margin: '2rem auto', padding: '1rem' }}>
      <h1>Welcome, {user?.name}</h1>
      <p>Select an action to manage your certificate requests.</p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
        <button
          onClick={() => navigate('/apply')}
          style={{ padding: '0.75rem 1.2rem', minWidth: 180 }}
        >
          Apply for a Certificate
        </button>
        <button
          onClick={() => navigate('/my-applications')}
          style={{ padding: '0.75rem 1.2rem', minWidth: 180 }}
        >
          My Applications
        </button>
      </div>

      <button
        onClick={logout}
        style={{ marginTop: '2rem', padding: '0.75rem 1.2rem', backgroundColor: '#ef4444', color: 'white' }}
      >
        Logout
      </button>
    </main>
  );
};

export default DashboardCitizen;
