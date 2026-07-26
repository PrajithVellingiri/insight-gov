import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-primary-950 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20 mb-4">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-primary-200 text-sm mt-1">Register as a citizen to submit petitions</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="form-label">Full Name</label>
              <input id="reg-name" type="text" value={form.name} onChange={set('name')}
                placeholder="Rajesh Kumar" className={cn('form-input', errors.name && 'border-red-400')} />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="reg-email" className="form-label">Email Address</label>
              <input id="reg-email" type="email" value={form.email} onChange={set('email')}
                placeholder="you@example.com" className={cn('form-input', errors.email && 'border-red-400')} />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="reg-password" className="form-label">Password</label>
              <div className="relative">
                <input id="reg-password" type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={set('password')} placeholder="Min. 8 characters"
                  className={cn('form-input pr-10', errors.password && 'border-red-400')} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>

            {errors.submit && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{errors.submit}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
