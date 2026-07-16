import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ApplyApplication = () => {
  const navigate = useNavigate();
  const [certificateType, setCertificateType] = useState('income');
  const [details, setDetails] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files).slice(0, 5);
    setDocuments(files);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('certificateType', certificateType);
    formData.append('details', details);
    documents.forEach((file) => {
      formData.append('documents', file);
    });

    try {
      const response = await api.post('/applications', formData);
      setSuccess(`Application submitted. Reference ID: ${response.data.referenceId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper-50">
      <header className="bg-ink-900 text-white px-8 py-4 flex justify-between items-center">
        <div className="font-serif-display text-xl">GovVerify</div>
        <div />
      </header>

      <section className="px-6 py-10 max-w-5xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <h1 className="font-serif-display text-2xl text-ink-900 mb-6">Apply for a Certificate</h1>

          {success && (
            <div className="bg-verified-600/10 border border-verified-600 text-verified-600 px-4 py-3 rounded-md mb-6">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-seal-600/10 border border-seal-600 text-seal-600 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="block mb-6">
              <span className="text-sm font-medium text-slate-500">Certificate Type</span>
              <select
                value={certificateType}
                onChange={(e) => setCertificateType(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-ink-900"
              >
                <option value="income">Income</option>
                <option value="residence">Residence</option>
                <option value="caste">Caste</option>
                <option value="educational">Educational</option>
              </select>
            </label>

            <label className="block mb-6">
              <span className="text-sm font-medium text-slate-500">Details</span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={5}
                required
                className="w-full border border-slate-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-ink-900"
              />
            </label>

            <label className="block mb-6">
              <span className="text-sm font-medium text-slate-500">Documents (max 5)</span>
              <input
                type="file"
                multiple
                accept="*"
                onChange={handleFileChange}
                className="mt-2 block w-full text-slate-700"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink-900 text-white font-semibold py-2.5 rounded-md hover:bg-opacity-90 transition"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>

          {success && (
            <button
              type="button"
              onClick={() => navigate('/my-applications')}
              className="mt-6 w-full bg-white border border-slate-200 text-ink-900 font-medium py-2.5 rounded-md hover:bg-slate-50 transition"
            >
              View My Applications
            </button>
          )}
        </div>
      </section>
    </main>
  );
};

export default ApplyApplication;
