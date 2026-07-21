import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const MyDocuments = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/applications/my-documents');
        setDocuments(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleDownload = async (doc) => {
    try {
      const response = await api.get(doc.downloadUrl, { responseType: 'blob' });
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileExt = doc.documentType === 'supporting_document' ? '' : '.pdf';
      link.download = doc.title ? `${doc.title}${fileExt}` : `${doc.documentType}-${doc.referenceId || doc.id}${fileExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download document:', err);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (filter === 'all') return true;
    if (filter === 'certificates') return doc.documentType === 'certificate';
    if (filter === 'tax') return doc.documentType === 'tax_receipt';
    if (filter === 'supporting') return doc.documentType === 'supporting_document';
    return true;
  });

  const getBadgeStyle = (type) => {
    if (type === 'certificate') return 'bg-verified-600/10 text-verified-600 border-verified-600/20';
    if (type === 'tax_receipt') return 'bg-emerald-600/10 text-emerald-700 border-emerald-600/20';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getTypeLabel = (type) => {
    if (type === 'certificate') return t('myDocuments.typeCertificate');
    if (type === 'tax_receipt') return t('myDocuments.typeTaxReceipt');
    return t('myDocuments.typeSupporting');
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
          <h1 className="font-serif-display text-2xl text-ink-900">{t('myDocuments.title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('myDocuments.subtitle')}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-3">
          {[
            { key: 'all', label: t('myDocuments.filterAll') },
            { key: 'certificates', label: t('myDocuments.filterCertificates') },
            { key: 'tax', label: t('myDocuments.filterTax') },
            { key: 'supporting', label: t('myDocuments.filterSupporting') },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                filter === tab.key
                  ? 'bg-ink-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-slate-500">{t('myApplications.loading')}</p>}
        {error && <p className="text-seal-600">{error}</p>}
        {!loading && !error && filteredDocs.length === 0 && (
          <div className="text-center py-16 text-slate-500">{t('myDocuments.noDocuments')}</div>
        )}

        {!loading && !error && filteredDocs.length > 0 && (
          <div className="space-y-4">
            {filteredDocs.map((doc, idx) => (
              <div
                key={doc.id || idx}
                className="w-full border border-slate-200 rounded-lg p-5 bg-white shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-ink-900 text-base">{doc.title}</span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getBadgeStyle(
                        doc.documentType
                      )}`}
                    >
                      {getTypeLabel(doc.documentType)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                    {doc.referenceId && (
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{doc.referenceId}</span>
                    )}
                    <span>{new Date(doc.date).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  className="bg-ink-900 text-white font-semibold px-4 py-2 rounded-md hover:bg-opacity-90 transition text-xs cursor-pointer shadow-sm self-start md:self-auto"
                >
                  ↓ {t('myDocuments.download')}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default MyDocuments;
