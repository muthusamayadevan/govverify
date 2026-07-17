import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import govverify from '../assets/govverify.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.success || '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const user = await login(email, password);
      if (user.role === 'citizen') {
        navigate('/dashboard/citizen');
      } else if (user.role === 'officer') {
        navigate('/dashboard/officer');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <main className="min-h-screen w-full relative">
      <div
        className="absolute inset-0 bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${govverify})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
      <div className="relative z-10 min-h-screen flex items-end justify-center pb-10 md:pb-16 px-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
          <h1 className="font-serif-display text-2xl text-white mb-6 text-center">
            Sign in to your account
          </h1>

          {successMessage && (
            <p className="bg-white/10 border border-white/30 text-white text-sm px-4 py-3 rounded-md mb-4 text-center">
              {successMessage}
            </p>
          )}
          {error && (
            <p className="bg-red-500/20 border border-red-300/50 text-white text-sm px-4 py-3 rounded-md mb-4 text-center">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <label className="block mb-4">
              <span className="text-sm font-medium text-white/80">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/90 backdrop-blur-sm border border-white/30 rounded-md px-4 py-2.5 text-ink-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white mt-1 mb-2"
              />
            </label>

            <label className="block mb-6">
              <span className="text-sm font-medium text-white/80">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/90 backdrop-blur-sm border border-white/30 rounded-md px-4 py-2.5 text-ink-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white mt-1 mb-2"
              />
            </label>

            <button
              type="submit"
              className="w-full bg-white text-ink-900 font-semibold py-2.5 rounded-md hover:bg-white/90 transition"
            >
              Login
            </button>
          </form>

          <p className="text-sm text-white/70 text-center mt-6">
            Don&apos;t have an account?{' '}
            <span className="text-white font-semibold underline">Register here</span>
          </p>
          <p className="text-sm text-white/70 text-center mt-4">
            Verifying a certificate?{' '}
            <a href="/verify" className="text-white font-semibold underline">Check it here</a>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Login;
