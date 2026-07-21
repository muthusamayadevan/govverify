import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const MyApplications = () => {
  const { t, i18n } = useTranslation();
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

  const getStatusLabel = (status) => {
    if (status === 'pending') return t('myApplications.statusPending');
    if (status === 'approved') return t('myApplications.statusApproved');
    if (status === 'rejected') return t('myApplications.statusRejected');
    return status;
  };

  return (
    <main className="min-h-screen bg-paper-50">
      <header className="bg-ink-900 text-white px-8 py-4 flex justify-between items-center">
        <div
          className="font-serif-display text-xl cursor-pointer"
          onClick={() => navigate('/dashboard/citizen')}
        >
          GovVerify
        </div>
        <div className="flex items-center gap-4">
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
        </div>
      </header>

      <section className="px-6 py-10 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif-display text-2xl text-ink-900">{t('myApplications.title')}</h1>
        </div>

        {loading && <p className="text-slate-500">{t('myApplications.loading')}</p>}
        {error && <p className="text-seal-600">{error}</p>}
        {!loading && !error && applications.length === 0 && (
          <div className="text-center py-16 text-slate-500">{t('myApplications.noApplications')}</div>
        )}

        {!loading && !error && applications.length > 0 && (
          <div className="space-y-4">
            {applications.map((application) => {
              const statusClass =
                application.status === 'approved'
                  ? 'bg-verified-600/10 text-verified-600'
                  : application.status === 'rejected'
                  ? 'bg-seal-600/10 text-seal-600'
                  : 'bg-slate-100 text-slate-600';

              return (
                <button
                  key={application._id}
                  type="button"
                  onClick={() => navigate(`/applications/${application._id}`)}
                  className="w-full border border-slate-200 rounded-lg p-4 bg-white flex justify-between items-center hover:shadow-sm transition cursor-pointer text-left"
                >
                  <div>
                    <div className="font-mono text-sm text-slate-500">{application.referenceId}</div>
                    <div className="font-medium text-ink-900 mt-1">{application.certificateType}</div>
                    <div className="text-xs text-slate-500 mt-1">{new Date(application.createdAt).toLocaleString()}</div>
                    {application.status !== 'pending' && application.reviewedBy?.name && (
                      <div className="text-xs text-slate-500 mt-2">
                        {t('myApplications.reviewedBy')}: {application.reviewedBy.name}
                      </div>
                    )}
                    {application.status !== 'pending' && application.officerRemarks && (
                      <div className="text-xs text-slate-600 italic mt-1">
                        {t('myApplications.remarks')}: {application.officerRemarks}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${statusClass}`}>
                      {getStatusLabel(application.status)}
                    </span>
                    {application.status === 'approved' && application.qrCodeDataUrl && (
                      <span className="text-xs font-semibold text-ink-900 border border-slate-300 rounded-md px-2.5 py-1 bg-paper-50 hover:bg-slate-100 transition">
                        {t('myApplications.viewCertificate')} →
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default MyApplications;
