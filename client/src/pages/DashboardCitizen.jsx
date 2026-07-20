import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const DashboardCitizen = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-paper-50">
      <header className="bg-ink-900 text-white px-8 py-4 flex justify-between items-center">
        <div className="font-serif-display text-xl">GovVerify</div>
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
          <button
            type="button"
            onClick={logout}
            className="text-white border border-white/30 px-4 py-1.5 rounded-md hover:bg-white/10 transition cursor-pointer"
          >
            {t('nav.logout')}
          </button>
        </div>
      </header>

      <section className="px-6 py-10 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-serif-display text-2xl text-ink-900">
            {t('dashboard.welcome')}, {user?.name}
          </h1>
          <p className="text-slate-500 mt-2">Select an action to manage your certificate requests.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <button
            type="button"
            onClick={() => navigate('/apply')}
            className="flex-1 border border-slate-200 rounded-lg p-6 bg-white hover:shadow-md transition cursor-pointer text-left"
          >
            <h2 className="text-lg font-medium text-ink-900">{t('dashboard.applyForCertificate')}</h2>
            <p className="text-slate-500 mt-2">Start a new certificate application and upload your documents.</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/my-applications')}
            className="flex-1 border border-slate-200 rounded-lg p-6 bg-white hover:shadow-md transition cursor-pointer text-left"
          >
            <h2 className="text-lg font-medium text-ink-900">{t('dashboard.myApplications')}</h2>
            <p className="text-slate-500 mt-2">Review the status of your submitted applications.</p>
          </button>
        </div>
      </section>
    </main>
  );
};

export default DashboardCitizen;
