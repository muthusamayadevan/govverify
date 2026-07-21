import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import govverify from '../assets/govverify.png';

const Login = () => {
  const { t, i18n } = useTranslation();
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
    console.log('Google response received:', response);
    setError('');

    const credential = response?.credential;
    if (!credential) {
      console.error('Google response missing credential:', response);
      setError('Google sign-in failed: no credential returned');
      return;
    }

    console.log('Sending Google credential to API:', credential);

    try {
      const user = await loginWithGoogle(credential);
      console.log('Google login succeeded:', user);
      redirectByRole(user.role);
    } catch (err) {
      if (err?.response?.data) {
        console.error('Google login API error response:', err.response.data);
      } else {
        console.error('Google login error:', err);
      }
      setError(err.response?.data?.message || 'Google sign-in failed');
    }
  };

  useEffect(() => {
    document.title = 'GovVerify | Login';
    const googleButtonContainer = document.getElementById('googleSignInDiv');

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !googleButtonContainer) return;
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(googleButtonContainer, {
        theme: 'outline',
        size: 'large',
      });
      window.google.accounts.id.prompt();
    };

    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (script) {
      script.addEventListener('load', initGoogle);
      return () => script.removeEventListener('load', initGoogle);
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
    <main className="h-screen w-full relative overflow-hidden flex flex-col">
      <div
        className="absolute inset-0 bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: `url(${govverify})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-black/30 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-xs font-semibold">
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

      <div className="relative z-10 h-full flex flex-col">
        {/* Zone A: Header clearance zone */}
        <div className="h-[48%] md:h-[44%]" />

        {/* Zone B: Card zone */}
        <div className="flex-1 flex items-center justify-center px-4 pb-6">
          <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6">
            <div className="text-center mb-2">
              <Link to="/" className="font-serif-display text-3xl text-white hover:text-white/80 transition-colors">
                GovVerify
              </Link>
            </div>
            <h1 className="font-serif-display text-xl text-white/90 mb-4 text-center">
              {t('auth.signInTitle')}
            </h1>

            {successMessage && (
              <p className="bg-white/10 border border-white/30 text-white text-sm px-4 py-2 rounded-md mb-3 text-center">
                {successMessage}
              </p>
            )}
            {error && (
              <p className="bg-red-500/20 border border-red-300/50 text-white text-sm px-4 py-2 rounded-md mb-3 text-center">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <label className="block mb-3">
                <span className="text-sm font-medium text-white/80">{t('auth.email')}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/90 backdrop-blur-sm border border-white/30 rounded-md px-4 py-2 text-ink-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white mt-1 mb-1"
                />
              </label>

              <label className="block mb-3">
                <span className="text-sm font-medium text-white/80">{t('auth.password')}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/90 backdrop-blur-sm border border-white/30 rounded-md px-4 py-2 text-ink-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white mt-1 mb-1"
                />
              </label>

              <button
                type="submit"
                className="w-full bg-white text-ink-900 font-semibold py-2.5 rounded-md hover:bg-white/90 transition cursor-pointer"
              >
                {t('auth.loginButton')}
              </button>
            </form>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 border-t border-white/20" />
              <span className="text-white/60 text-xs">{t('auth.or')}</span>
              <div className="flex-1 border-t border-white/20" />
            </div>

            {/* Google Sign-In button — rendered by Google's GSI script */}
            <div id="googleSignInDiv" className="w-full mt-4" />

            <p className="text-sm text-white/70 text-center mt-4">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-white font-semibold underline">{t('auth.registerHere')}</Link>
            </p>
            <p className="text-sm text-white/70 text-center mt-2">
              {t('auth.verifyPrompt')}{' '}
              <Link to="/verify" className="text-white font-semibold underline">{t('auth.checkHere')}</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
