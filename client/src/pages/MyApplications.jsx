import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const statusStyles = {
  pending: { backgroundColor: '#e2e8f0', color: '#1f2937', padding: '0.25rem 0.5rem', borderRadius: '999px' },
  approved: { backgroundColor: '#d1fae5', color: '#065f46', padding: '0.25rem 0.5rem', borderRadius: '999px' },
  rejected: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.5rem', borderRadius: '999px' },
};

const MyApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/applications/my');
        setApplications(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: '2rem auto', padding: '1rem' }}>
      <h1>My Applications</h1>

      {loading && <p>Loading applications...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && applications.length === 0 && <p>No applications yet.</p>}

      {!loading && !error && applications.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Reference ID</th>
              <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr
                key={application._id}
                onClick={() => navigate(`/applications/${application._id}`)}
                style={{ cursor: 'pointer', backgroundColor: '#ffffff' }}
              >
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{application.referenceId}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{application.certificateType}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={statusStyles[application.status] || statusStyles.pending}>{application.status}</span>
                </td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                  {new Date(application.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
};

export default MyApplications;
