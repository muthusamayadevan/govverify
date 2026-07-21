import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const OfficerReviewDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingDecision, setProcessingDecision] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);

  useEffect(() => {
    document.title = 'GovVerify | Review Application';
    const fetchApplication = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get(`/applications/${id}`);
        setApplication(response.data);
        setRemarks(response.data.officerRemarks || '');
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

  const handleReview = async (decision) => {
    if (!application) return;
    setSubmitting(true);
    setIsProcessing(true);
    setProcessingDecision(decision);
    setError('');

    try {
      const response = await api.patch(`/applications/${id}/review`, {
        decision,
        remarks,
      });
      if (decision === 'approved' && response.data?.qrCodeDataUrl) {
        setApplication(response.data);
        setQrCodeDataUrl(response.data.qrCodeDataUrl);
      } else {
        navigate('/dashboard/officer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
      setIsProcessing(false);
      setProcessingDecision(null);
    }
  };

  const handleRevokeCertificate = async () => {
    if (!application) return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently revoke this certificate (${application.referenceId || id})? This action cannot be undone on the blockchain.`
    );
    if (!confirmed) return;

    setSubmitting(true);
    setIsProcessing(true);
    setProcessingDecision('revoked');
    setError('');

    try {
      await api.put(`/applications/${id}/revoke`);
      setApplication((prev) => ({ ...prev, status: 'Revoked' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke certificate');
    } finally {
      setSubmitting(false);
      setIsProcessing(false);
      setProcessingDecision(null);
    }
  };

  const isApproved = application?.status === 'approved' || application?.status === 'Approved';
  const isRevoked = application?.status === 'revoked' || application?.status === 'Revoked';

  const statusClass = isApproved
    ? 'bg-verified-600/10 text-verified-600 border-verified-600/20'
    : isRevoked
    ? 'bg-red-600/10 text-red-600 border-red-600/20'
    : application?.status === 'rejected'
    ? 'bg-seal-600/10 text-seal-600 border-seal-600/20'
    : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <main className="min-h-screen bg-paper-50">
      <header className="bg-ink-900 text-white px-8 py-4 flex justify-between items-center">
        <div
          className="font-serif-display text-xl cursor-pointer"
          onClick={() => navigate('/dashboard/officer')}
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
          <button
            type="button"
            onClick={logout}
            className="text-white border border-white/30 px-4 py-1.5 rounded-md hover:bg-white/10 transition cursor-pointer"
          >
            {t('nav.logout')}
          </button>
        </div>
      </header>

      <section className="px-6 py-10 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif-display text-2xl text-ink-900">Review Application</h1>
          <p className="text-slate-500 mt-2">Review application details, download certificate documents, or revoke credentials.</p>
        </div>

        {loading && <p className="text-slate-500">Loading application...</p>}
        {error && <p className="text-seal-600 bg-seal-600/10 p-4 rounded-md mb-4">{error}</p>}

        {application && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="font-mono text-sm text-slate-500">{application.referenceId}</div>
                  <div className="text-ink-900 font-semibold text-lg mt-2 capitalize">{application.certificateType} Certificate</div>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide border ${statusClass}`}>
                  {application.status}
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-slate-500 text-sm">{t('officer.applicantDetails')}</div>
                  <div className="text-ink-900 font-medium mt-1">{application.applicant?.name}</div>
                  <div className="text-slate-500 text-sm mt-1">{application.applicant?.email}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-sm">Submitted</div>
                  <div className="text-ink-900 font-medium mt-1">{new Date(application.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-slate-500 text-sm">Details</div>
                <p className="text-ink-900 mt-2 whitespace-pre-line">{application.details}</p>
              </div>

              <div className="mt-6">
                <div className="text-slate-500 text-sm">Documents</div>
                <div className="mt-3 space-y-3">
                  {application.documents?.map((doc) => (
                    <a
                      key={doc.fileId}
                      href={`/api/applications/document/${doc.fileId}`}
                      className="block border border-slate-200 rounded-lg p-3 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    >
                      {doc.filename}
                    </a>
                  ))}
                </div>
              </div>

              {application.status !== 'pending' && (
                <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="text-slate-500 text-sm">{t('officer.remarks')}</div>
                  <p className="text-ink-900 mt-2 whitespace-pre-line">{application.officerRemarks || 'No remarks provided.'}</p>
                </div>
              )}
            </div>

            {(qrCodeDataUrl || (isApproved && application.qrCodeDataUrl)) && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col items-center">
                <img
                  src={qrCodeDataUrl || application.qrCodeDataUrl}
                  alt="Certificate QR Code"
                  className="w-40 h-40 mt-4 border border-slate-200 rounded-lg p-2 bg-white"
                />
                <p className="text-xs text-slate-500 mt-2">{t('officer.scanToVerify')}</p>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="mt-4 bg-ink-900 text-white font-semibold px-6 py-2.5 rounded-md hover:bg-opacity-90 transition cursor-pointer text-sm shadow-sm flex items-center gap-2"
                >
                  📄 {t('officer.downloadPdf')}
                </button>
              </div>
            )}

            {/* Revoke Action Section for Approved Certificates */}
            {isApproved && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-red-900 font-bold text-base">Certificate Revocation</h3>
                  <p className="text-xs text-red-700 mt-1">
                    Revoking this certificate permanently records its invalidation on the Sepolia blockchain.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRevokeCertificate}
                  disabled={isProcessing || submitting}
                  className="bg-red-600 text-white font-semibold px-5 py-2.5 rounded-md hover:bg-red-700 transition cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  {isProcessing && processingDecision === 'revoked' ? 'Revoking on Blockchain…' : '⚠️ Revoke Certificate'}
                </button>
              </div>
            )}

            {/* Pending Application Review Form */}
            {application.status === 'pending' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <label className="block mb-3">
                  <span className="text-sm font-medium text-slate-700">{t('officer.remarks')}</span>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-4 py-3 mt-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-ink-900"
                    rows={4}
                  />
                </label>

                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => handleReview('approved')}
                    disabled={isProcessing || submitting}
                    className="w-full sm:w-auto bg-verified-600 text-white font-semibold px-5 py-2.5 rounded-md hover:bg-verified-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('officer.approveButton')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview('rejected')}
                    disabled={isProcessing || submitting}
                    className="w-full sm:w-auto bg-seal-600 text-white font-semibold px-5 py-2.5 rounded-md hover:bg-seal-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('officer.rejectButton')}
                  </button>
                </div>

                {isProcessing && (
                  <div className="flex items-center gap-3 mt-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200">
                    <svg className="animate-spin h-5 w-5 text-ink-900 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>
                      {processingDecision === 'approved'
                        ? t('officer.issuingCertificate')
                        : processingDecision === 'revoked'
                        ? 'Revoking certificate on blockchain…'
                        : t('officer.processing')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default OfficerReviewDetail;
