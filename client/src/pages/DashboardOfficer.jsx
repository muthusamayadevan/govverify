import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const DashboardOfficer = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [revokingId, setRevokingId] = useState(null);

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

  useEffect(() => {
    document.title = 'GovVerify | Officer Dashboard';
    fetchApplications();
  }, []);

  const handleRevoke = async (appId, refId, e) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to permanently revoke this certificate (${refId})? This action cannot be undone on the blockchain.`
    );
    if (!confirmed) return;

    setRevokingId(appId);
    setError('');

    try {
      await api.put(`/applications/${appId}/revoke`);
      setApplications((prev) =>
        prev.map((app) => (app._id === appId ? { ...app, status: 'Revoked' } : app))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke certificate on blockchain');
    } finally {
      setRevokingId(null);
    }
  };

  const pendingCount = applications.filter((item) => item.status === 'pending').length;
  const approvedCount = applications.filter((item) => item.status === 'approved' || item.status === 'Approved').length;
  const rejectedCount = applications.filter((item) => item.status === 'rejected' || item.status === 'Rejected').length;
  const revokedCount = applications.filter((item) => item.status === 'revoked' || item.status === 'Revoked').length;

  const filteredApplications = applications.filter((app) => {
    if (activeTab === 'pending') return app.status === 'pending';
    if (activeTab === 'approved') return app.status === 'approved' || app.status === 'Approved';
    if (activeTab === 'revoked') return app.status === 'revoked' || app.status === 'Revoked';
    return true; // 'all'
  });

  return (
    <main className="min-h-screen bg-paper-50">
      <header className="bg-ink-900 text-white px-8 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="font-serif-display text-xl cursor-pointer" onClick={() => navigate('/dashboard/officer')}>
          GovVerify
        </div>
        <div className="flex items-center gap-3">
          {/* Navigation Links */}
          <button
            type="button"
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-white text-ink-900 shadow-sm transition cursor-pointer"
          >
            📋 {t('officer.reviewQueueNav')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/officer/analytics')}
            className="text-xs font-semibold px-3 py-1.5 rounded-md border border-white/20 hover:bg-white/10 transition cursor-pointer text-white/80"
          >
            📊 {t('officer.analyticsNav')}
          </button>

          {/* Language Switcher */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-xs font-semibold">
            <button
              type="button"
              onClick={() => i18n.changeLanguage('en')}
              className={`cursor-pointer px-2 py-0.5 rounded transition ${
                i18n.language.startsWith('en')
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              EN
            </button>
            <span className="text-white/20">|</span>
            <button
              type="button"
              onClick={() => i18n.changeLanguage('ta')}
              className={`cursor-pointer px-2 py-0.5 rounded transition ${
                i18n.language.startsWith('ta')
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              TA
            </button>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-white text-xs border border-white/30 px-3 py-1.5 rounded-md hover:bg-white/10 transition cursor-pointer"
          >
            {t('nav.logout')}
          </button>
        </div>
      </header>

      <section className="px-6 py-10 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-serif-display text-2xl text-ink-900">{t('officer.welcome')} {user?.name}</h1>
          <p className="text-slate-500 mt-2">Review pending applications, inspect issued certificates, or revoke invalid credentials.</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div
            onClick={() => setActiveTab('pending')}
            className={`bg-white border rounded-lg p-4 shadow-sm cursor-pointer transition ${
              activeTab === 'pending' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-sm font-medium text-slate-600 mt-2">{t('officer.pendingReview')}</div>
          </div>
          <div
            onClick={() => setActiveTab('approved')}
            className={`bg-white border rounded-lg p-4 shadow-sm cursor-pointer transition ${
              activeTab === 'approved' ? 'border-verified-600 ring-2 ring-verified-600/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-3xl font-bold text-verified-600">{approvedCount}</div>
            <div className="text-sm font-medium text-slate-600 mt-2">Approved Certificates</div>
          </div>
          <div
            onClick={() => setActiveTab('revoked')}
            className={`bg-white border rounded-lg p-4 shadow-sm cursor-pointer transition ${
              activeTab === 'revoked' ? 'border-red-600 ring-2 ring-red-600/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-3xl font-bold text-red-600">{revokedCount}</div>
            <div className="text-sm font-medium text-slate-600 mt-2">Revoked Certificates</div>
          </div>
          <div
            onClick={() => setActiveTab('all')}
            className={`bg-white border rounded-lg p-4 shadow-sm cursor-pointer transition ${
              activeTab === 'all' ? 'border-ink-900 ring-2 ring-ink-900/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-3xl font-bold text-slate-700">{applications.length}</div>
            <div className="text-sm font-medium text-slate-600 mt-2">Total Applications</div>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-slate-200 mb-6 space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`pb-3 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'pending'
                ? 'border-b-2 border-ink-900 text-ink-900'
                : 'text-slate-500 hover:text-ink-900'
            }`}
          >
            Pending Queue ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`pb-3 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'approved'
                ? 'border-b-2 border-verified-600 text-verified-600'
                : 'text-slate-500 hover:text-ink-900'
            }`}
          >
            Issued Certificates ({approvedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('revoked')}
            className={`pb-3 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'revoked'
                ? 'border-b-2 border-red-600 text-red-600'
                : 'text-slate-500 hover:text-ink-900'
            }`}
          >
            Revoked ({revokedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'all'
                ? 'border-b-2 border-ink-900 text-ink-900'
                : 'text-slate-500 hover:text-ink-900'
            }`}
          >
            All Requests ({applications.length})
          </button>
        </div>

        {loading && <p className="text-slate-500">Loading applications...</p>}
        {error && <p className="text-seal-600 bg-seal-600/10 p-3 rounded-md mb-4">{error}</p>}

        {!loading && !error && filteredApplications.length === 0 && (
          <div className="text-center py-10 text-slate-500">No applications match this filter.</div>
        )}

        {!loading && !error && filteredApplications.length > 0 && (
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const isApproved = application.status === 'approved' || application.status === 'Approved';
              const isRevoked = application.status === 'revoked' || application.status === 'Revoked';
              const isPending = application.status === 'pending';
              const isRevokingThis = revokingId === application._id;

              return (
                <div
                  key={application._id}
                  onClick={() => navigate(`/officer/review/${application._id}`)}
                  className="w-full border border-slate-200 rounded-lg p-5 bg-white flex flex-col sm:flex-row sm:justify-between sm:items-center hover:shadow-sm transition cursor-pointer text-left gap-4"
                >
                  <div>
                    <div className="font-mono text-sm text-slate-500">{application.referenceId || application._id}</div>
                    <div className="font-medium text-ink-900 text-lg mt-0.5 capitalize">{application.certificateType} Certificate</div>
                    <div className="text-sm text-slate-500 mt-1">{application.applicant?.name} · {application.applicant?.email}</div>
                    <div className="text-xs text-slate-400 mt-1">{new Date(application.createdAt).toLocaleString()}</div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center">
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        isApproved
                          ? 'bg-verified-600/10 text-verified-600 border border-verified-600/20'
                          : isRevoked
                          ? 'bg-red-600/10 text-red-600 border border-red-600/20'
                          : isPending
                          ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {application.status}
                    </span>

                    {/* Revoke Button for Approved Certificates */}
                    {isApproved && (
                      <button
                        type="button"
                        onClick={(e) => handleRevoke(application._id, application.referenceId, e)}
                        disabled={isRevokingThis}
                        className="bg-red-600 text-white font-semibold text-xs px-3.5 py-1.5 rounded-md hover:bg-red-700 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                      >
                        {isRevokingThis ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Revoking…</span>
                          </>
                        ) : (
                          <>⚠️ Revoke</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default DashboardOfficer;
