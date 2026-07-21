import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const ApplicationDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplication = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/applications/${id}`);
        setApplication(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load application');
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!application) return;
    try {
      const response = await api.get(`/applications/${id}/certificate-pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${application.referenceId || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF certificate:', err);
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'pending') return t('myApplications.statusPending');
    if (status === 'approved') return t('myApplications.statusApproved');
    if (status === 'rejected') return t('myApplications.statusRejected');
    return status;
  };

  const statusClass =
    application?.status === 'approved'
      ? 'bg-verified-600/10 text-verified-600 border-verified-600/20'
      : application?.status === 'rejected'
      ? 'bg-seal-600/10 text-seal-600 border-seal-600/20'
      : 'bg-slate-100 text-slate-600 border-slate-200';

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

      <section className="px-6 py-10 max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/my-applications')}
          className="text-sm font-medium text-slate-500 hover:text-ink-900 mb-6 inline-flex items-center gap-1 transition cursor-pointer"
        >
          ← {t('applicationDetail.backButton')}
        </button>

        <h1 className="font-serif-display text-2xl text-ink-900 mb-6">
          {t('applicationDetail.title')}
        </h1>

        {loading && <p className="text-slate-500">{t('myApplications.loading')}</p>}
        {error && <p className="text-seal-600">{error}</p>}

        {application && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="font-mono text-sm text-slate-500">{application.referenceId}</div>
                  <div className="text-ink-900 font-semibold text-xl mt-1">
                    {application.certificateType}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {t('applicationDetail.submittedOn')}: {new Date(application.createdAt).toLocaleString()}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wide border ${statusClass}`}
                >
                  {getStatusLabel(application.status)}
                </span>
              </div>

              {application.status !== 'pending' && application.reviewedBy?.name && (
                <div className="mt-4 text-sm text-slate-600">
                  <span className="font-medium text-slate-500">{t('applicationDetail.reviewedBy')}:</span>{' '}
                  <span className="text-ink-900 font-semibold">{application.reviewedBy.name}</span>
                </div>
              )}

              {application.status !== 'pending' && application.officerRemarks && (
                <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-100 italic">
                  <span className="font-medium not-italic text-slate-500">{t('applicationDetail.remarks')}:</span>{' '}
                  {application.officerRemarks}
                </div>
              )}

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {t('applicationDetail.details')}
                </div>
                <p className="text-slate-800 text-sm whitespace-pre-line leading-relaxed">
                  {application.details}
                </p>
              </div>

              {application.documents && application.documents.length > 0 && (
                <div className="mt-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    {t('applicationDetail.documents')}
                  </div>
                  <div className="space-y-2">
                    {application.documents.map((doc) => (
                      <a
                        key={doc.fileId}
                        href={`/api/applications/document/${doc.fileId}`}
                        className="block border border-slate-200 rounded-md p-3 bg-slate-50 text-slate-700 hover:bg-slate-100 text-sm transition"
                      >
                        📄 {doc.filename}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* QR Code Section */}
            {application.status === 'approved' && application.qrCodeDataUrl ? (
              <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm flex flex-col items-center text-center">
                <img
                  src={application.qrCodeDataUrl}
                  alt={`QR Code for ${application.referenceId}`}
                  className="w-56 h-56 border border-slate-200 rounded-xl p-3 bg-white shadow-sm"
                />
                <p className="text-sm text-slate-600 max-w-md mt-4 leading-relaxed">
                  {t('applicationDetail.scanPrompt', { referenceId: application.referenceId })}
                </p>
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <a
                    href={application.qrCodeDataUrl}
                    download={`certificate-${application.referenceId}.png`}
                    className="inline-flex items-center justify-center border border-slate-300 bg-white text-ink-900 font-semibold px-5 py-2.5 rounded-md hover:bg-slate-50 transition cursor-pointer text-sm shadow-sm"
                  >
                    ↓ {t('applicationDetail.downloadQr')}
                  </a>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center justify-center bg-ink-900 text-white font-semibold px-5 py-2.5 rounded-md hover:bg-opacity-90 transition cursor-pointer text-sm shadow-sm"
                  >
                    📄 {t('applicationDetail.downloadPdf')}
                  </button>
                </div>
              </div>
            ) : application.status === 'pending' ? (
              <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-sm text-slate-500">
                {t('applicationDetail.pendingNotice')}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
};

export default ApplicationDetail;
