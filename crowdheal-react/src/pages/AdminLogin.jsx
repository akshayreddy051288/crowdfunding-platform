import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSession, isAdminSession, signInAdmin } from '../utils/auth';
import './Auth.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdminSession(getSession())) navigate('/admin', { replace: true });
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInAdmin({ email, password });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="brand auth-brand">Crowd<span>Heal</span></Link>

        <h1 className="auth-title">Admin portal</h1>
        <p className="auth-sub">Review fundraiser requests before they go live.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="admin-email">Admin email</label>
            <input
              type="email"
              id="admin-email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@crowdheal.in"
              required
              autoComplete="username"
            />
          </div>

          <div className="field">
            <label htmlFor="admin-password">Password</label>
            <div className="pw-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                id="admin-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button type="button" className="pw-toggle" aria-label="Toggle password visibility" onClick={() => setShowPw(s => !s)}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <p className="form-message error" style={{ display: 'block' }}>{error}</p>}

          <button type="submit" className="btn btn--coral btn-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in as admin'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">← Fundraiser sign in</Link>
        </p>
      </div>
    </div>
  );
}
