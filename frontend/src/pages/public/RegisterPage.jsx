import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';

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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F7F6F2] text-[#181817]">
      {/* Left 55%: Charcoal Architectural Hero */}
      <div className="hidden lg:flex lg:col-span-7 bg-[#181817] text-[#F7F6F2] p-12 lg:p-20 flex-col justify-between relative overflow-hidden">
        {/* Minimal geometric orange accent lines */}
        <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none opacity-30">
          <svg viewBox="0 0 400 400" className="w-full h-full stroke-[#F05A3C]" fill="none" strokeWidth="1">
            <line x1="0" y1="120" x2="400" y2="120" strokeDasharray="4 4" />
            <line x1="200" y1="0" x2="200" y2="400" />
            <circle cx="200" cy="120" r="4" fill="#F05A3C" />
            <line x1="0" y1="300" x2="400" y2="300" strokeDasharray="4 4" />
            <circle cx="200" cy="300" r="4" fill="#F05A3C" />
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
              CITIZEN ACCESS
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white uppercase leading-[1.08]">
              Public redressal,<br />
              transparent<br />
              resolution.
            </h1>
            <p className="text-sm text-[#A3A39E] max-w-md leading-relaxed pt-2">
              Submit civic petitions with automatic departmental routing, 200m spatial duplicate deduplication, and real-time verifiable progress status.
            </p>
          </div>
        </div>

        <div className="pt-12 border-t border-[#292927] flex items-center justify-between text-xs font-mono text-[#6F6F6A]">
          <span>© 2026 INSIGHTGOV</span>
          <span>CITIZEN CHARTER COMPLIANT</span>
        </div>
      </div>

      {/* Right 45%: Off-white Minimal Registration Form */}
      <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#181817]" />
              <span className="font-mono font-bold tracking-widest text-sm uppercase text-[#181817]">
                INSIGHTGOV
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#181817] tracking-tight">Create Citizen Account</h2>
            <p className="text-xs text-[#6F6F6A] mt-1">Register to lodge petitions and monitor government progress.</p>
          </div>

          {errors.submit && (
            <div className="p-3 text-xs bg-[#FFF0EB] border border-[#F05A3C]/40 text-[#E13B22] rounded-md font-mono">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label" htmlFor="reg-name">
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={form.name}
                onChange={set('name')}
                placeholder="Citizen Name"
                className="form-input"
                autoComplete="name"
              />
              {errors.name && <p className="text-[11px] text-[#E13B22] mt-1 font-mono">{errors.name}</p>}
            </div>

            <div>
              <label className="form-label" htmlFor="reg-email">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="citizen@domain.com"
                className="form-input"
                autoComplete="email"
              />
              {errors.email && <p className="text-[11px] text-[#E13B22] mt-1 font-mono">{errors.email}</p>}
            </div>

            <div>
              <label className="form-label" htmlFor="reg-password">
                Password (min 8 chars)
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••••••"
                  className="form-input pr-10"
                  autoComplete="new-password"
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
              {errors.password && <p className="text-[11px] text-[#E13B22] mt-1 font-mono">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-xs font-bold tracking-wider uppercase mt-4"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register Account</span>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-[#DDDCD7] text-center">
            <p className="text-xs text-[#6F6F6A]">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-[#181817] hover:text-[#F05A3C] transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
