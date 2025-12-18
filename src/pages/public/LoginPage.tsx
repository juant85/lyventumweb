import React, { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AppRoute } from '../../types';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { getHomePathForRole } from '../../components/Layout'; // Helper for redirection
import LyVentumLogo from '../../components/Logo';
import BackgroundGradient from '../../components/ui/BackgroundGradient';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';


const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, currentUser, loadingAuth, authOpError } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loadingAuth && currentUser) {
      const homePath = getHomePathForRole(currentUser.role);
      navigate(homePath, { replace: true });
    }
  }, [currentUser, loadingAuth, navigate]);

  useEffect(() => {
    if (authOpError) {
      setError(authOpError);
    }
  }, [authOpError]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  if (loadingAuth && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }


  return (
    <div
      className="min-h-screen bg-slate-950 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(100, 116, 139, 0.2) 1px, transparent 0)`, backgroundSize: '20px 20px' }}
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center mb-10">
          <Link to={AppRoute.Landing} className="inline-block group">
            <LyVentumLogo className="h-20 w-auto filter drop-shadow-[0_4px_10px_rgba(59,130,246,0.25)] dark:drop-shadow-[0_5px_15px_rgba(96,165,250,0.25)] transition-transform duration-300 group-hover:scale-105" />
            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-white font-montserrat">
              LyVenTum
            </p>
          </Link>
        </div>

        <BackgroundGradient containerClassName="rounded-2xl" className="bg-slate-900/80 backdrop-blur-md rounded-[22px] p-8 space-y-6">
          <h2 className="text-2xl font-bold text-center text-slate-100">
            {t(localeKeys.accountLogin)}
          </h2>
          {error && <Alert type="error" message={error} className="mb-4" />}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="email"
              label={t(localeKeys.emailLabel)}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              wrapperClassName="!mb-0"
              aria-describedby={error ? "login-error" : undefined}
              disabled={isLoading || loadingAuth}
            />
            <Input
              id="password"
              label={t(localeKeys.passwordLabel)}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              wrapperClassName="!mb-0"
              aria-describedby={error ? "login-error" : undefined}
              disabled={isLoading || loadingAuth}
            />

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" className="w-full !py-3" disabled={isLoading || loadingAuth}>
              {isLoading || loadingAuth ? t(localeKeys.submitting) : t(localeKeys.accountLogin)}
            </Button>
          </form>
          {error && <p id="login-error" className="sr-only">{error}</p>}
        </BackgroundGradient>
      </div>
    </div>
  );
};

export default LoginPage;