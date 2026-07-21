import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const OfficerDashboard = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'GovVerify | Officer Analytics';
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/applications/stats');
        setStats(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const total = stats?.total || 0;

  return (
    <main className="min-h-screen bg-paper-50">
      {/* Header Bar */}
      <header className="bg-ink-900 text-white px-8 py-4 flex flex-wrap justify-between items-center gap-4">
        <div
          className="font-serif-display text-xl cursor-pointer"
          onClick={() => navigate('/dashboard/officer')}
        >
          GovVerify
        </div>

        <div className="flex items-center gap-3">
          {/* Navigation Links */}
          <button
            type="button"
            onClick={() => navigate('/dashboard/officer')}
            className="text-xs font-semibold px-3 py-1.5 rounded-md border border-white/20 hover:bg-white/10 transition cursor-pointer text-white/80"
          >
            📋 {t('officer.reviewQueueNav')}
          </button>
          <button
            type="button"
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-white text-ink-900 shadow-sm transition cursor-pointer"
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

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            className="text-white text-xs border border-white/30 px-3 py-1.5 rounded-md hover:bg-white/10 transition cursor-pointer"
          >
            {t('nav.logout')}
          </button>
        </div>
      </header>

      {/* Analytics Content */}
      <section className="px-6 py-10 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif-display text-2xl text-ink-900">{t('officer.analyticsTitle')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('officer.analyticsSubtitle')}</p>
        </div>

        {loading && <p className="text-slate-500">{t('myApplications.loading')}</p>}
        {error && <p className="text-seal-600">{error}</p>}

        {!loading && !error && stats && (
          <div className="space-y-8">
            {/* Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Applications Card */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t('officer.totalApplications')}
                </div>
                <div className="text-3xl font-extrabold text-ink-900 mt-2">{stats.total}</div>
                <div className="text-xs text-slate-500 mt-2">All submitted requests</div>
              </div>

              {/* Pending Review Card */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  {t('officer.pendingApplications')}
                </div>
                <div className="text-3xl font-extrabold text-amber-700 mt-2">{stats.pending}</div>
                <div className="text-xs text-amber-700/80 mt-2">Awaiting officer action</div>
              </div>

              {/* Approved Card */}
              <div className="bg-verified-600/10 border border-verified-600/30 rounded-lg p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-verified-600">
                  {t('officer.approvedApplications')}
                </div>
                <div className="text-3xl font-extrabold text-verified-600 mt-2">{stats.approved}</div>
                <div className="text-xs text-verified-600/80 mt-2">Issued on blockchain</div>
              </div>

              {/* Rejected Card */}
              <div className="bg-seal-600/10 border border-seal-600/30 rounded-lg p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-seal-600">
                  {t('officer.rejectedApplications')}
                </div>
                <div className="text-3xl font-extrabold text-seal-600 mt-2">{stats.rejected}</div>
                <div className="text-xs text-seal-600/80 mt-2">Application declined</div>
              </div>
            </div>

            {/* Certificate Type Breakdown */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ink-900 mb-6">
                {t('officer.breakdownTitle')}
              </h2>

              {stats.byCertificateType && stats.byCertificateType.length > 0 ? (
                <div className="space-y-5">
                  {stats.byCertificateType.map((item) => {
                    const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    return (
                      <div key={item.type} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium capitalize text-slate-800">
                            {item.type} Certificate
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                              {item.count} requests
                            </span>
                            <span className="font-semibold text-ink-900 text-xs w-10 text-right">
                              {percentage}%
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-ink-900 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No certificate type data available.</p>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default OfficerDashboard;
