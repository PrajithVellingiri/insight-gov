import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Loader2, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';
import BackgroundGrid from '@/components/ui/BackgroundGrid';

export default function RegisterPage() {
  const { t } = useTranslation();
  usePageTitle(t('register', 'Register Citizen Account'));
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Full name required (min 2 chars)';
    if (!form.email.match(/^[^@]+@[^@]+\.[^@]+$/)) e.email = 'Valid email required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register({ ...form, role: 'citizen' });
      navigate('/citizen/dashboard');
    } catch (err) {
      setErrors({ submit: err?.response?.data?.detail || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-blue-500/30 selection:text-white overflow-hidden">
      <BackgroundGrid showNodes={true} />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Side: Citizen Empowerment Telemetry */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8 pr-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_0_25px_rgba(37,99,235,0.45)] border border-blue-400/40">
              <ShieldCheck size={26} className="text-white" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                InsightGov <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-400/30 font-semibold tracking-wider uppercase">Citizen</span>
              </span>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Civic Engagement Portal</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              Make Your Voice Heard <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                With Autonomous AI
              </span>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Submit community petitions with GPS location verification, audio voice descriptions, and photo attachments.
              Track live review milestones in real time.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              'Direct routing to 32 Tamil Nadu state ministries',
              'Automated priority escalation for urgent safety issues',
              'Complete resolution transparency and officer notes',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-400 flex-shrink-0">
                  <CheckCircle2 size={13} />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300">Public Grievance Redressal Protocol</span>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Open & Direct
            </span>
          </div>
        </div>

        {/* Right Side: Registration Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="glass-panel-elevated rounded-3xl p-7 sm:p-9 shadow-2xl relative overflow-hidden">
            <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-80 rounded-full bg-cyan-500/15 blur-2xl" aria-hidden="true" />

            <div className="text-center mb-8">
              <div className="lg:hidden inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-400/30 mb-3 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                <ShieldCheck size={24} className="text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('create_account', 'Create Citizen Account')}</h1>
              <p className="text-xs text-muted-foreground mt-1.5">{t('register_citizen_desc', 'Join the smart digital governance portal')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="form-label">{t('full_name', 'Full Name')}</label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Karthik Subramanian"
                  className={cn('form-input', errors.name && 'border-rose-500/60')}
                />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="reg-email" className="form-label">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={set('email')}
                  placeholder="karthik@example.com"
                  className={cn('form-input', errors.email && 'border-rose-500/60')}
                />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="reg-password" className="form-label">Password</label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min. 8 characters"
                    className={cn('form-input pr-10', errors.password && 'border-rose-500/60')}
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
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>

              {errors.submit && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-3 text-xs text-rose-400 font-medium animate-fade-in flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                  <span>{errors.submit}</span>
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
                    <span>{t('creating_account', 'Creating Account...')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('register', 'Register')}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
              <p className="text-xs text-muted-foreground">
                {t('already_have_account', 'Already have an account?')}{' '}
                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  {t('login_here', 'Sign in here')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
