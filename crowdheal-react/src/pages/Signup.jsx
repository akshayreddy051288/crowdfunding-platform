import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signUp, getSession, safeReturnTo } from '../utils/auth';
import './Auth.css';

function getStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = { '': '', 'Weak': '#E8563E', 'Fair': '#F0B429', 'Good': '#2E7D5B', 'Strong': '#2E7D5B' };
const STRENGTH_CLS = ['', 'weak', 'fair', 'strong', 'strong'];

export default function Signup() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [agreed, setAgreed] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('returnTo'));

  useEffect(() => {
    if (getSession()) navigate(returnTo, { replace: true });
  }, [navigate, returnTo]);

  const strength = getStrength(form.password);
  const strengthLabel = form.password ? STRENGTH_LABELS[strength] : '';

  function update(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields.'); return;
    }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (!agreed) { setError('Please agree to the Terms and Privacy Policy.'); return; }
    setLoading(true);
    try {
      await signUp({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password });
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="brand auth-brand">Crowd<span>Heal</span></Link>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">
          Already have an account?{' '}
          <Link to={`/login${returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`} className="auth-link">
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="name-row">
            <div className="field">
              <label htmlFor="firstName">First name</label>
              <input type="text" id="firstName" value={form.firstName} onChange={update('firstName')} placeholder="Jane" required autoComplete="given-name" />
            </div>
            <div className="field">
              <label htmlFor="lastName">Last name</label>
              <input type="text" id="lastName" value={form.lastName} onChange={update('lastName')} placeholder="Doe" required autoComplete="family-name" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={form.email} onChange={update('email')} placeholder="you@example.com" required autoComplete="email" />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="pw-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                id="password"
                value={form.password}
                onChange={update('password')}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)} aria-label="Toggle password visibility">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {showPw ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </>
                  )}
                </svg>
              </button>
            </div>
            {form.password && (
              <>
                <div className="pw-strength">
                  {[0,1,2,3].map(i => (
                    <div key={i} className={`pw-strength__bar${i < strength ? ` active ${STRENGTH_CLS[strength]}` : ''}`} />
                  ))}
                </div>
                <div className="pw-strength__label" style={{ color: STRENGTH_COLORS[strengthLabel] || '#8e99a4' }}>
                  {strengthLabel}
                </div>
              </>
            )}
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <div className="pw-wrap">
              <input
                type={showConfirm ? 'text' : 'password'}
                id="confirmPassword"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              <button type="button" className="pw-toggle" onClick={() => setShowConfirm(s => !s)} aria-label="Toggle confirm password visibility">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {showConfirm ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className="terms-row">
            <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            <label htmlFor="terms">
              I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
            </label>
          </div>

          {error && <p className="form-message error" style={{ display: 'block' }}>{error}</p>}

          <button type="submit" className="btn btn--coral btn-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/">← Back to CrowdHeal</Link>
        </p>
      </div>
    </div>
  );
}
