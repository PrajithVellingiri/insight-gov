import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { t } = useTranslation();
  usePageTitle(t('login', 'Login'));
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form);
      const redirects = { citizen: '/citizen/dashboard', officer: '/officer/dashboard', admin: '/admin/dashboard' };
      navigate(redirects[user.role] ?? '/');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-card/10 border border-white/20 mb-4">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('app_name', 'InsightGov AI')}</h1>
          <p className="text-primary-200 text-sm mt-1">{t('sign_in_to_account', 'Sign in to your account')}</p>
        </div>

        <div className="bg-card rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="form-label">{t('email_address', 'Email address')}</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.gov.in"
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="form-label">{t('password', 'Password')}</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  className="form-input pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive font-medium">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> {t('signing_in', 'Signing in...')}</> : t('sign_in', 'Sign In')}
            </button>
          </form>
        </div>

        <p className="text-center text-primary-200/80 text-sm mt-6">
          {t('dont_have_account', 'Don\'t have an account?')} <Link to="/register" className="text-white font-medium hover:underline">{t('register_here', 'Register here')}</Link>
        </p>

        <p className="mt-6 text-center text-xs text-primary-300">
          Government officers and admins receive login credentials from the administrator.
        </p>
      </div>
    </div>
  );
}
