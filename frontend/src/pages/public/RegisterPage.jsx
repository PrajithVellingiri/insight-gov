import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Shield, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F8F7F2] text-[#202522] flex items-center justify-center p-4 sm:p-6 lg:p-12 selection:bg-[#315C4A]/20 selection:text-[#202522]">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* Left Side: Editorial Introduction */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between h-full py-4 pr-6">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#315C4A] text-white">
                <Shield size={19} strokeWidth={2} />
              </div>
              <div>
                <span className="text-xl font-bold text-[#202522] tracking-tight">InsightGov</span>
                <p className="text-[10px] text-[#68716B] uppercase tracking-widest font-mono font-medium">Citizen Registration</p>
              </div>
            </div>

            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-3">
              01 / CITIZEN ENGAGEMENT
            </span>
            <h1 className="text-4xl font-extrabold text-[#202522] tracking-tight leading-[1.18] mb-5">
              Submit grievances with immediate accountability.
            </h1>
            <p className="text-sm text-[#68716B] leading-relaxed mb-8">
              InsightGov connects your neighborhood concerns directly to the competent government department with verified location records and open status tracking.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono font-bold text-[#315C4A] bg-[#EFF4F0] px-2 py-0.5 rounded border border-[#D4E2D8] mt-0.5">01</span>
                <div>
                  <h4 className="text-sm font-semibold text-[#202522]">Automated Department Routing</h4>
                  <p className="text-xs text-[#68716B]">Grievances are categorized without bureaucratic delay.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xs font-mono font-bold text-[#C58B5B] bg-[#FDF6F0] px-2 py-0.5 rounded border border-[#F2DFD0] mt-0.5">02</span>
                <div>
                  <h4 className="text-sm font-semibold text-[#202522]">Geospatial Cluster Deduplication</h4>
                  <p className="text-xs text-[#68716B]">Complaints within 200m are linked to coordinate action.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xs font-mono font-bold text-[#78917F] bg-[#EFF4F0] px-2 py-0.5 rounded border border-[#D4E2D8] mt-0.5">03</span>
                <div>
                  <h4 className="text-sm font-semibold text-[#202522]">Permanent Digital Case Files</h4>
                  <p className="text-xs text-[#68716B]">Review timeline and officer notes are preserved openly.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#E5E5DE] text-xs text-[#68716B]">
            All citizen submissions are safeguarded by public sector privacy guidelines.
          </div>
        </div>

        {/* Right Side: Clean Registration Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-[#E5E5DE] p-8 sm:p-10 shadow-card">
            <div className="mb-6">
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-1">
                CREATE ACCOUNT
              </span>
              <h2 className="text-2xl font-bold text-[#202522] tracking-tight">Citizen Registration</h2>
              <p className="text-xs text-[#68716B] mt-1">Register to file petitions and track civic resolutions.</p>
            </div>

            {errors.submit && (
              <div className="rounded-xl bg-[#FDF2F2] border border-[#FBD5D5] p-3 text-xs text-[#b91c1c] mb-5">
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
                  placeholder="Prajith V"
                  className="form-input"
                  autoComplete="name"
                />
                {errors.name && <p className="form-error">{errors.name}</p>}
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
                  placeholder="citizen@example.com"
                  className="form-input"
                  autoComplete="email"
                />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>

              <div>
                <label className="form-label" htmlFor="reg-password">
                  Create Password (min 8 characters)
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68716B] hover:text-[#202522]"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-sm font-medium mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#E5E5DE] text-center">
              <p className="text-xs text-[#68716B]">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-[#315C4A] hover:underline">
                  Sign in to your account
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
