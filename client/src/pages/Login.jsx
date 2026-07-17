import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import govverify from '../assets/govverify.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.success || '';

  const redirectByRole = (role) => {
    if (role === 'citizen') navigate('/dashboard/citizen');
    else if (role === 'officer') navigate('/dashboard/officer');
    else navigate('/login');
  };

  const handleGoogleResponse = async (response) => {
    setError('');
    try {
      const user = await loginWithGoogle(response.credential);
      redirectByRole(user.role);
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed');
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInDiv'),
        { theme: 'outline', size: 'large' },
      );
    };

    if (window.google?.accounts?.id) {
      // Script already loaded (e.g. navigating back to this page)
      initGoogle();
    } else {
      // Script still loading — wait for it
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (script) {
        script.addEventListener('load', initGoogle);
        return () => script.removeEventListener('load', initGoogle);
      }
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const user = await login(email, password);
      redirectByRole(user.role);
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

          {/* OR divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 border-t border-white/20" />
            <span className="text-white/60 text-xs">OR</span>
            <div className="flex-1 border-t border-white/20" />
          </div>

          {/* Google Sign-In button — rendered by Google's GSI script */}
          <div id="googleSignInDiv" className="w-full" />

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
