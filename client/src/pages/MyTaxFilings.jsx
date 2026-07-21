import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const formatINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const MyTaxFilings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTaxFilings = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/tax/my');
        setFilings(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tax filings');
      } finally {
        setLoading(false);
      }
    };

    fetchTaxFilings();
  }, []);

  const handleDownloadReceiptPdf = async (filingId, receiptId) => {
    try {
      const response = await api.get(`/tax/${filingId}/receipt-pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tax-receipt-${receiptId || filingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download tax receipt PDF:', err);
    }
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif-display text-2xl text-ink-900">{t('tax.myFilingsTitle')}</h1>
            <p className="text-slate-500 text-sm mt-1">{t('tax.myFilingsDesc')}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/file-tax')}
            className="bg-ink-900 text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-opacity-90 transition cursor-pointer"
          >
            + {t('tax.fileTaxCard')}
          </button>
        </div>

        {loading && <p className="text-slate-500">{t('myApplications.loading')}</p>}
        {error && <p className="text-seal-600">{error}</p>}
        {!loading && !error && filings.length === 0 && (
          <div className="text-center py-16 text-slate-500">{t('tax.noFilings')}</div>
        )}

        {!loading && !error && filings.length > 0 && (
          <div className="space-y-4">
            {filings.map((filing) => (
              <div
                key={filing._id}
                className="w-full border border-slate-200 rounded-lg p-5 bg-white shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                      {filing.receiptId}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 border border-slate-200 px-2 py-0.5 rounded">
                      FY {filing.financialYear}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Filed on {new Date(filing.filedAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 block">{t('tax.annualIncome')}</span>
                    <span className="font-medium text-slate-700">{formatINR(filing.annualIncome)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{t('tax.taxableIncome')}</span>
                    <span className="font-medium text-slate-700">{formatINR(filing.taxableIncome)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{t('tax.taxPayable')}</span>
                    <span className="font-bold text-ink-900 text-base">{formatINR(filing.taxPayable)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadReceiptPdf(filing._id, filing.receiptId)}
                    className="border border-slate-300 bg-paper-50 hover:bg-slate-100 text-ink-900 font-semibold px-3 py-1.5 rounded-md text-xs transition cursor-pointer"
                  >
                    📄 Download Receipt (PDF)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default MyTaxFilings;
