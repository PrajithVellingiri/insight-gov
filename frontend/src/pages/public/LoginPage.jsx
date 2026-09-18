import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Shield, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F8F7F2] text-[#202522] flex items-center justify-center p-4 sm:p-6 lg:p-12 selection:bg-[#315C4A]/20 selection:text-[#202522]">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* Left Side: Minimal Editorial Governance Visual */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between h-full py-4 pr-6">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#315C4A] text-white">
                <Shield size={19} strokeWidth={2} />
              </div>
              <div>
                <span className="text-xl font-bold text-[#202522] tracking-tight">InsightGov</span>
                <p className="text-[10px] text-[#68716B] uppercase tracking-widest font-mono font-medium">Platform Access</p>
              </div>
            </div>

            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-3">
              01 / CIVIC ACCESS
            </span>
            <h1 className="text-4xl font-extrabold text-[#202522] tracking-tight leading-[1.18] mb-5">
              Radical clarity in digital public administration.
            </h1>
            <p className="text-sm text-[#68716B] leading-relaxed mb-10">
              A unified gateway for citizens to file grievances and for state departments to resolve them with verifiable transparency and speed.
            </p>

            {/* Minimal Civic Network Nodes Illustration */}
            <div className="p-6 bg-white rounded-2xl border border-[#E5E5DE] shadow-card">
              <div className="flex items-center justify-between text-xs font-mono text-[#68716B] mb-4">
                <span>GOVERNANCE MESH</span>
                <span className="text-[#315C4A] font-semibold">AUTHENTICATED</span>
              </div>
              <svg viewBox="0 0 360 80" className="w-full h-16 stroke-[#D4E2D8]" fill="none" strokeWidth="1.5">
                <line x1="40" y1="40" x2="140" y2="40" />
                <line x1="140" y1="40" x2="240" y2="40" />
                <line x1="240" y1="40" x2="330" y2="40" />
                
                <circle cx="40" cy="40" r="12" className="fill-[#EFF4F0] stroke-[#315C4A]" />
                <text x="40" y="44" className="text-[9px] fill-[#315C4A] font-mono text-center font-bold" textAnchor="middle">CIT</text>
                
                <circle cx="140" cy="40" r="14" className="fill-[#FDF6F0] stroke-[#C58B5B]" />
                <text x="140" y="44" className="text-[9px] fill-[#C58B5B] font-mono text-center font-bold" textAnchor="middle">TRI</text>

                <circle cx="240" cy="40" r="14" className="fill-[#FAF6ED] stroke-[#C8A96B]" />
                <text x="240" y="44" className="text-[9px] fill-[#9A7B38] font-mono text-center font-bold" textAnchor="middle">MIN</text>

                <circle cx="330" cy="40" r="12" className="fill-[#EFF4F0] stroke-[#315C4A]" />
                <text x="330" y="44" className="text-[9px] fill-[#315C4A] font-mono text-center font-bold" textAnchor="middle">RES</text>
              </svg>
              <div className="flex justify-between text-[10px] text-[#68716B] font-mono mt-1 px-1">
                <span>Citizen</span>
                <span>AI Triage</span>
                <span>Ministry</span>
                <span>Resolved</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#E5E5DE] text-xs text-[#68716B]">
            Protected by official government state protocols and cryptographic audit logging.
          </div>
        </div>

        {/* Right Side: Clean Authentication Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-[#E5E5DE] p-8 sm:p-10 shadow-card">
            <div className="mb-6">
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-1">
                AUTHENTICATION
              </span>
              <h2 className="text-2xl font-bold text-[#202522] tracking-tight">Sign in to InsightGov</h2>
              <p className="text-xs text-[#68716B] mt-1">Enter your registered email and credentials below.</p>
            </div>

            {error && (
              <div className="rounded-xl bg-[#FDF2F2] border border-[#FBD5D5] p-3 text-xs text-[#b91c1c] mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label" htmlFor="login-email">
                  Official Email Address
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
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label mb-0" htmlFor="login-password">
                    Password
                  </label>
                </div>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68716B] hover:text-[#202522]"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-sm font-medium mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#E5E5DE] text-center">
              <p className="text-xs text-[#68716B]">
                New citizen applicant?{' '}
                <Link to="/register" className="font-semibold text-[#315C4A] hover:underline">
                  Create citizen account
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
