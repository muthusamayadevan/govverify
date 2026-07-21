import { useState } from 'react';
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

const FileTax = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [financialYear, setFinancialYear] = useState('2025-26');
  const [annualIncome, setAnnualIncome] = useState('');
  const [deductions, setDeductions] = useState('0');
  const [loading, setLoading] = useState(false);
  const [filingResult, setFilingResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setFilingResult(null);

    const incomeNum = Number(annualIncome);
    const deductionsNum = Number(deductions) || 0;

    if (isNaN(incomeNum) || incomeNum < 0) {
      setError('Please enter a valid annual income');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/tax', {
        financialYear,
        annualIncome: incomeNum,
        deductions: deductionsNum,
      });
      setFilingResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to file tax return');
    } finally {
      setLoading(false);
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
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <h1 className="font-serif-display text-2xl text-ink-900 mb-2">{t('tax.fileTaxTitle')}</h1>
          <p className="text-slate-500 text-sm mb-6">{t('tax.fileTaxDesc')}</p>

          {error && (
            <div className="bg-seal-600/10 border border-seal-600 text-seal-600 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {filingResult ? (
            <div className="space-y-6">
              <div className="bg-verified-600/10 border border-verified-600 rounded-lg p-6 text-ink-900">
                <div className="flex items-center gap-2 text-verified-600 font-semibold text-lg mb-4">
                  <span>✓</span>
                  <span>{t('tax.filingSuccess')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 block">{t('tax.receiptId')}</span>
                    <span className="font-mono font-semibold text-base">{filingResult.receiptId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t('tax.financialYear')}</span>
                    <span className="font-medium">{filingResult.financialYear}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t('tax.annualIncome')}</span>
                    <span className="font-medium">{formatINR(filingResult.annualIncome)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t('tax.deductions')}</span>
                    <span className="font-medium">{formatINR(filingResult.deductions)}</span>
                  </div>
                  <div className="pt-2 border-t border-verified-600/20">
                    <span className="text-slate-500 block">{t('tax.taxableIncome')}</span>
                    <span className="font-semibold text-lg">{formatINR(filingResult.taxableIncome)}</span>
                  </div>
                  <div className="pt-2 border-t border-verified-600/20">
                    <span className="text-slate-500 block">{t('tax.taxPayable')}</span>
                    <span className="font-bold text-xl text-verified-600">{formatINR(filingResult.taxPayable)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setFilingResult(null)}
                  className="flex-1 bg-white border border-slate-300 text-ink-900 font-semibold py-2.5 rounded-md hover:bg-slate-50 transition cursor-pointer text-sm"
                >
                  + File Another Return
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/my-tax-filings')}
                  className="flex-1 bg-ink-900 text-white font-semibold py-2.5 rounded-md hover:bg-opacity-90 transition cursor-pointer text-sm"
                >
                  {t('tax.viewFilingsButton')} →
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="block mb-6">
                <span className="text-sm font-medium text-slate-500">{t('tax.financialYear')}</span>
                <select
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-ink-900"
                >
                  <option value="2025-26">2025-26</option>
                  <option value="2024-25">2024-25</option>
                  <option value="2023-24">2023-24</option>
                </select>
              </label>

              <label className="block mb-6">
                <span className="text-sm font-medium text-slate-500">{t('tax.annualIncome')}</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  placeholder="1000000"
                  required
                  className="w-full border border-slate-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-ink-900"
                />
              </label>

              <label className="block mb-6">
                <span className="text-sm font-medium text-slate-500">{t('tax.deductions')}</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  placeholder="50000"
                  className="w-full border border-slate-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-ink-900"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-ink-900 text-white font-semibold py-2.5 rounded-md hover:bg-opacity-90 transition cursor-pointer"
              >
                {loading ? 'Submitting...' : t('tax.submitButton')}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default FileTax;
