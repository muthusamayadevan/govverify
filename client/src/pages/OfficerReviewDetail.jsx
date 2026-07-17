import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const OfficerReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);

  useEffect(() => {
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

  const handleReview = async (decision) => {
    if (!application) return;
    setSubmitting(true);
    setError('');

    try {
      const response = await api.patch(`/applications/${id}/review`, {
        decision,
        remarks,
      });
      if (decision === 'approved' && response.data?.qrCodeDataUrl) {
        setQrCodeDataUrl(response.data.qrCodeDataUrl);
      } else {
        navigate('/dashboard/officer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
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
        <div className="font-serif-display text-xl">GovVerify</div>
        <button
          type="button"
          onClick={logout}
          className="text-white border border-white/30 px-4 py-1.5 rounded-md hover:bg-white/10 transition"
        >
          Logout
        </button>
      </header>

      <section className="px-6 py-10 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif-display text-2xl text-ink-900">Review Application</h1>
          <p className="text-slate-500 mt-2">Review the details below and approve or reject as needed.</p>
        </div>

        {loading && <p className="text-slate-500">Loading application...</p>}
        {error && <p className="text-seal-600">{error}</p>}

        {application && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="font-mono text-sm text-slate-500">{application.referenceId}</div>
                  <div className="text-ink-900 font-semibold text-lg mt-2">{application.certificateType}</div>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide border ${statusClass}`}>
                  {application.status}
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-slate-500 text-sm">Applicant</div>
                  <div className="text-ink-900 font-medium">{application.applicant?.name}</div>
                  <div className="text-slate-500 text-sm mt-1">{application.applicant?.email}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-sm">Submitted</div>
                  <div className="text-ink-900 font-medium">{new Date(application.createdAt).toLocaleString()}</div>
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
                  <div className="text-slate-500 text-sm">Officer Remarks</div>
                  <p className="text-ink-900 mt-2 whitespace-pre-line">{application.officerRemarks || 'No remarks provided.'}</p>
                </div>
              )}
            </div>

            {qrCodeDataUrl && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col items-center">
                <img
                  src={qrCodeDataUrl}
                  alt="Certificate QR Code"
                  className="w-40 h-40 mt-4 border border-slate-200 rounded-lg p-2 bg-white"
                />
                <p className="text-xs text-slate-500 mt-2">Scan to verify this certificate</p>
              </div>
            )}

            {application.status === 'pending' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <label className="block mb-3">
                  <span className="text-sm font-medium text-slate-700">Remarks</span>
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
                    disabled={submitting}
                    className="w-full sm:w-auto bg-verified-600 text-white font-semibold px-5 py-2.5 rounded-md hover:bg-verified-700 transition"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview('rejected')}
                    disabled={submitting}
                    className="w-full sm:w-auto bg-seal-600 text-white font-semibold px-5 py-2.5 rounded-md hover:bg-seal-700 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default OfficerReviewDetail;
