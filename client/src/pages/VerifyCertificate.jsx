import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';

const VerifyCertificate = () => {
  const { referenceId: routeReferenceId } = useParams();
  const [referenceId, setReferenceId] = useState(routeReferenceId || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const verifyCertificate = async (id) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await api.get(`/applications/verify/${id}`);
      setResult(response.data);
    } catch (err) {
      const message = err.response?.data?.message || 'Verification failed';
      setResult({ valid: false, message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeReferenceId) {
      setReferenceId(routeReferenceId);
      verifyCertificate(routeReferenceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeReferenceId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!referenceId.trim()) {
      setError('Please enter a reference ID');
      return;
    }
    verifyCertificate(referenceId.trim());
  };

  return (
    <main className="min-h-screen bg-paper-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="font-serif-display text-ink-900 text-xl">GovVerify</div>
      </header>

      <section className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif-display text-2xl text-ink-900">Verify a Certificate</h1>
          <p className="text-slate-500 mt-2">Enter a reference ID to check its authenticity.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Reference ID</span>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="GOV-2026-919048"
              className="mt-2 w-full rounded-md border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-ink-900"
            />
          </label>

          {error && <p className="text-seal-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-ink-900 px-5 py-2.5 text-white font-semibold hover:bg-opacity-90 transition"
            disabled={loading}
          >
            {loading ? 'Checking…' : 'Verify'}
          </button>
        </form>

        <div className="mt-10 space-y-4">
          {result && result.valid && (
            <div className="rounded-lg border-2 border-verified-600 bg-verified-600/10 p-6">
              <div className="flex items-center gap-3">
                <span className="text-verified-600 text-3xl">✓</span>
                <h2 className="text-verified-600 text-xl font-semibold">Certificate Verified</h2>
              </div>
              <div className="mt-4 space-y-3 text-ink-900">
                <div>
                  <div className="text-sm text-slate-500">Certificate type</div>
                  <div className="font-medium">{result.certificateType}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Applicant</div>
                  <div className="font-medium">{result.applicantName}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Issued at</div>
                  <div className="font-medium">{new Date(result.issuedAt).toLocaleString()}</div>
                </div>
                <div className="text-xs font-mono text-slate-500 break-all">
                  <a
                    href={`https://sepolia.etherscan.io/tx/${result.blockchainTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {result.blockchainTxHash}
                  </a>
                </div>
              </div>
            </div>
          )}

          {result && !result.valid && (
            <div className="rounded-lg border-2 border-seal-600 bg-seal-600/10 p-6">
              <div className="flex items-center gap-3">
                <span className="text-seal-600 text-3xl">✗</span>
                <h2 className="text-seal-600 text-xl font-semibold">Verification Failed</h2>
              </div>
              <p className="mt-4 text-ink-900">{result.message}</p>
            </div>
          )}
        </div>

        <div className="mt-10 text-sm text-slate-500">
          You can also verify a certificate by opening a direct URL like <span className="font-mono">/verify/GOV-2026-919048</span>.
        </div>
      </section>
    </main>
  );
};

export default VerifyCertificate;
