import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { t } = useTranslation();
  usePageTitle(t('login', 'Sign In'));
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F7F6F2] text-[#181817]">
      {/* Left 55%: Charcoal Architectural Hero */}
      <div className="hidden lg:flex lg:col-span-7 bg-[#181817] text-[#F7F6F2] p-12 lg:p-20 flex-col justify-between relative overflow-hidden">
        {/* Minimal geometric orange accent lines */}
        <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none opacity-30">
          <svg viewBox="0 0 400 400" className="w-full h-full stroke-[#F05A3C]" fill="none" strokeWidth="1">
            <line x1="0" y1="80" x2="400" y2="80" strokeDasharray="4 4" />
            <line x1="160" y1="0" x2="160" y2="400" />
            <circle cx="160" cy="80" r="4" fill="#F05A3C" />
            <line x1="0" y1="240" x2="400" y2="240" strokeDasharray="4 4" />
            <circle cx="160" cy="240" r="4" fill="#F05A3C" />
          </svg>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-16">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F05A3C]" />
            <span className="font-mono font-bold tracking-widest text-sm uppercase text-white">
              INSIGHTGOV
            </span>
          </div>

          <div className="max-w-xl space-y-6">
            <div className="text-xs font-mono uppercase tracking-widest text-[#F05A3C]">
              GOVERNANCE ARCHITECTURE
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white uppercase leading-[1.08]">
              The intelligence layer<br />
              for public<br />
              administration.
            </h1>
            <p className="text-sm text-[#A3A39E] max-w-md leading-relaxed pt-2">
              High-precision grievance classification, geospatial coordinate clustering, and verifiable administrative resolution in a unified institutional console.
            </p>
          </div>
        </div>

        <div className="pt-12 border-t border-[#292927] flex items-center justify-between text-xs font-mono text-[#6F6F6A]">
          <span>© 2026 INSIGHTGOV</span>
          <span>SYSTEM VERIFICATION 4.2</span>
        </div>
      </div>

      {/* Right 45%: Off-white Minimal Login Form */}
      <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#181817]" />
              <span className="font-mono font-bold tracking-widest text-sm uppercase text-[#181817]">
                INSIGHTGOV
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#181817] tracking-tight">Welcome back.</h2>
            <p className="text-xs text-[#6F6F6A] mt-1">Enter your official credentials to access the console.</p>
          </div>

          {error && (
            <div className="p-3 text-xs bg-[#FFF0EB] border border-[#F05A3C]/40 text-[#E13B22] rounded-md font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="name@domain.gov.in"
                className="form-input"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••••••"
                  className="form-input pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F6F6A] hover:text-[#181817]"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-xs font-bold tracking-wider uppercase mt-4"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-[#DDDCD7] text-center">
            <p className="text-xs text-[#6F6F6A]">
              New citizen applicant?{' '}
              <Link to="/register" className="font-semibold text-[#181817] hover:text-[#F05A3C] transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
