import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const DashboardOfficer = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/applications/officer/all');
        setApplications(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const pendingCount = applications.filter((item) => item.status === 'pending').length;
  const approvedCount = applications.filter((item) => item.status === 'approved').length;
  const rejectedCount = applications.filter((item) => item.status === 'rejected').length;

  return (
    <main className="min-h-screen bg-paper-50">
      <header className="bg-ink-900 text-white px-8 py-4 flex justify-between items-center">
        <div className="font-serif-display text-xl">GovVerify</div>
        <button
          type="button"
          onClick={logout}
          className="text-white border border-white/30 px-4 py-1.5 rounded-md hover:bg-white/10 transition"
        >
          Logout
        </button>
      </header>

      <section className="px-6 py-10 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-serif-display text-2xl text-ink-900">Welcome, Officer {user?.name}</h1>
          <p className="text-slate-500 mt-2">Review pending applications and approve or reject requests.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="text-3xl font-bold text-ink-900">{pendingCount}</div>
            <div className="text-sm text-slate-500 mt-2">Pending Review</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="text-3xl font-bold text-ink-900">{approvedCount}</div>
            <div className="text-sm text-slate-500 mt-2">Approved</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="text-3xl font-bold text-ink-900">{rejectedCount}</div>
            <div className="text-sm text-slate-500 mt-2">Rejected</div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-ink-900">Review Queue</h2>
          <p className="text-slate-500 mt-1">Click an application to inspect it and take action.</p>
        </div>

        {loading && <p className="text-slate-500">Loading applications...</p>}
        {error && <p className="text-seal-600">{error}</p>}
        {!loading && !error && pendingCount === 0 && (
          <div className="text-center py-10 text-slate-500">No pending applications at the moment.</div>
        )}

        {!loading && !error && pendingCount > 0 && (
          <div className="space-y-4">
            {applications
              .filter((application) => application.status === 'pending')
              .map((application) => (
                <button
                  key={application._id}
                  type="button"
                  onClick={() => navigate(`/officer/review/${application._id}`)}
                  className="w-full border border-slate-200 rounded-lg p-4 bg-white flex flex-col sm:flex-row sm:justify-between sm:items-center hover:shadow-sm transition text-left"
                >
                  <div>
                    <div className="font-mono text-sm text-slate-500">{application.referenceId}</div>
                    <div className="font-medium text-ink-900 mt-1">{application.certificateType}</div>
                    <div className="text-sm text-slate-500 mt-1">{application.applicant?.name} · {application.applicant?.email}</div>
                    <div className="text-xs text-slate-500 mt-1">{new Date(application.createdAt).toLocaleString()}</div>
                  </div>
                  <span className="mt-4 sm:mt-0 inline-flex items-center rounded-full bg-seal-600/10 text-seal-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    pending
                  </span>
                </button>
              ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default DashboardOfficer;
