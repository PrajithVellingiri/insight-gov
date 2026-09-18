import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Loader2, Eye, EyeOff, Lock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';
import BackgroundGrid from '@/components/ui/BackgroundGrid';

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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-blue-500/30 selection:text-white overflow-hidden">
      <BackgroundGrid showNodes={true} />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Side: 3D GovTech Visual & Trust Telemetry */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8 pr-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_0_25px_rgba(37,99,235,0.45)] border border-blue-400/40">
              <ShieldCheck size={26} className="text-white" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                InsightGov <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-400/30 font-semibold tracking-wider uppercase">AI</span>
              </span>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Government Public Infrastructure</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              Enterprise Governance <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                Command & Control
              </span>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Secure authentication gateway for citizens, departmental reviewing officers, and system administrators.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              'Cryptographically verified role-based access control',
              'Sub-second automated semantic petition routing',
              'Explainable AI decision logging with audit trails',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-400 flex-shrink-0">
                  <CheckCircle2 size={13} />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Mini Telemetry Badge */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold text-slate-300">System Telemetry Online</span>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              TLS 1.3 / AES-256
            </span>
          </div>
        </div>

        {/* Right Side: Glassmorphism Auth Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="glass-panel-elevated rounded-3xl p-7 sm:p-9 shadow-2xl relative overflow-hidden">
            {/* Subtle top glare */}
            <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-80 rounded-full bg-blue-500/15 blur-2xl" aria-hidden="true" />

            <div className="text-center mb-8">
              <div className="lg:hidden inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-400/30 mb-3 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                <ShieldCheck size={24} className="text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('sign_in_to_account', 'Sign in to InsightGov')}</h1>
              <p className="text-xs text-muted-foreground mt-1.5">{t('enter_credentials', 'Enter your official credentials to access the portal')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="form-label">{t('email_address', 'Email Address')}</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@insightgov.in"
                  className="form-input"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="form-label !mb-0">{t('password', 'Password')}</label>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={form.password}
                    onChange={set('password')}
                    placeholder="••••••••••••"
                    className="form-input pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-3 text-xs text-rose-400 font-medium animate-fade-in flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 mt-2 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{t('signing_in', 'Authenticating...')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('sign_in', 'Sign In')}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
              <p className="text-xs text-muted-foreground">
                {t('no_account_yet', "Don't have an account?")}{' '}
                <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  {t('register_as_citizen', 'Register as Citizen')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
