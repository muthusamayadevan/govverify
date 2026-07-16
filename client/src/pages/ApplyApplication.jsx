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
    <main style={{ maxWidth: 640, margin: '2rem auto', padding: '1rem' }}>
      <h1>Apply for a Certificate</h1>
      {success && <p style={{ color: 'green' }}>{success}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: '1rem' }}>
          Certificate Type
          <select
            value={certificateType}
            onChange={(e) => setCertificateType(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
          >
            <option value="income">Income</option>
            <option value="residence">Residence</option>
            <option value="caste">Caste</option>
            <option value="educational">Educational</option>
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: '1rem' }}>
          Details
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={5}
            required
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '1rem' }}>
          Documents (max 5)
          <input
            type="file"
            multiple
            accept="*"
            onChange={handleFileChange}
            style={{ display: 'block', marginTop: '0.5rem' }}
          />
        </label>

        <button type="submit" disabled={loading} style={{ padding: '0.75rem 1.2rem' }}>
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>

      {success && (
        <button
          type="button"
          onClick={() => navigate('/my-applications')}
          style={{ marginTop: '1rem', padding: '0.75rem 1.2rem' }}
        >
          View My Applications
        </button>
      )}
    </main>
  );
};

export default ApplyApplication;
