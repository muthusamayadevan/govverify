import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ScanLine, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import govverify from '../assets/govverify.png';

const LandingPage = () => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = 'GovVerify — Blockchain Verification Portal';
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* 1. Hero Section */}
      <section className="relative w-full min-h-[95vh] flex flex-col items-center justify-end pb-16 px-4">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-top bg-no-repeat"
          style={{ backgroundImage: `url(${govverify})` }}
        />
        {/* Dark Gradient Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

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

        {/* Content Container (Positioned in the lower area to not overlap any baked-in wordmark/logo in the center) */}
        <div className="relative z-10 w-full max-w-4xl mx-auto text-center mt-auto">
          {/* Tagline */}
          <h1 className="text-white text-xl md:text-2xl font-serif-display font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            {t('landing.heroTagline')}
          </h1>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="w-full sm:w-auto text-center bg-white text-ink-900 hover:bg-paper-50 px-8 py-3 rounded-md font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg active:scale-[0.98]"
            >
              {t('landing.getStarted')}
            </Link>
            <Link
              to="/verify"
              className="w-full sm:w-auto text-center border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-md font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {t('landing.verifyCertificate')}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. How it works section */}
      <section className="bg-paper-50 py-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          {/* Section heading */}
          <h2 className="font-serif-display text-3xl md:text-4xl text-ink-900 text-center font-medium mb-12">
            {t('landing.howItWorks')}
          </h2>

          {/* 3 steps horizontal grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="border border-slate-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow duration-300 flex flex-col">
              <span className="text-4xl font-serif-display text-ink-900 font-bold mb-4 block">
                1.
              </span>
              <h3 className="text-lg font-semibold text-ink-900 mb-2">
                {t('landing.step1Title')}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t('landing.step1Desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="border border-slate-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow duration-300 flex flex-col">
              <span className="text-4xl font-serif-display text-ink-900 font-bold mb-4 block">
                2.
              </span>
              <h3 className="text-lg font-semibold text-ink-900 mb-2">
                {t('landing.step2Title')}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t('landing.step2Desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="border border-slate-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow duration-300 flex flex-col">
              <span className="text-4xl font-serif-display text-ink-900 font-bold mb-4 block">
                3.
              </span>
              <h3 className="text-lg font-semibold text-ink-900 mb-2">
                {t('landing.step3Title')}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t('landing.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Trust/features section */}
      <section className="bg-white py-16 px-6 md:px-12 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          {/* 3-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-paper-50 text-ink-900 p-4 rounded-full mb-4 shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-semibold text-ink-900 mb-2">
                {t('landing.feat1Title')}
              </h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t('landing.feat1Desc')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-paper-50 text-ink-900 p-4 rounded-full mb-4 shadow-sm">
                <ScanLine className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-semibold text-ink-900 mb-2">
                {t('landing.feat2Title')}
              </h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t('landing.feat2Desc')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-paper-50 text-ink-900 p-4 rounded-full mb-4 shadow-sm">
                <Languages className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-semibold text-ink-900 mb-2">
                {t('landing.feat3Title')}
              </h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t('landing.feat3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="bg-ink-900 text-white/70 py-10 px-6 mt-auto text-center border-t border-white/10">
        <div className="max-w-5xl mx-auto space-y-2">
          <p className="text-sm font-medium">
            {t('landing.footerCopyright')}
          </p>
          <p className="text-xs text-white/50">
            {t('landing.footerDisclaimer')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
