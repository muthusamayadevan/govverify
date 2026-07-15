import { useAuth } from '../context/AuthContext';

const DashboardOfficer = () => {
  const { user, logout } = useAuth();

  return (
    <main style={{ maxWidth: 640, margin: '2rem auto', padding: '1rem' }}>
      <h1>Welcome, {user?.name}</h1>
      <p>This is your officer dashboard.</p>
      <button onClick={logout} style={{ padding: '0.75rem 1.2rem' }}>
        Logout
      </button>
    </main>
  );
};

export default DashboardOfficer;
