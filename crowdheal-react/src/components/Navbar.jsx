import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getSession, logout } from '../utils/auth';
import './Navbar.css';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState(getSession());
  const navigate = useNavigate();
  const location = useLocation();

  // Re-read session whenever route changes (after login/logout)
  useEffect(() => {
    setSession(getSession());
    setMobileOpen(false);
  }, [location.pathname]);

  function handleLogout(e) {
    e.preventDefault();
    logout();
    setSession(null);
    navigate('/');
  }

  const isActive = (path) => location.pathname === path;

  return (
    <header className="site-header">
      <div className="container">
        <div className="site-header__inner">
          <Link to="/" className="brand" aria-label="CrowdHeal home">
            Crowd<span>Heal</span>
          </Link>

          <nav className="site-nav" aria-label="Main navigation">
            <Link to="/campaigns" className={isActive('/campaigns') ? 'active' : ''}>Browse Campaigns</Link>
            <Link to="/#how-it-works">How It Works</Link>
            <Link to="/create-campaign" className={isActive('/create-campaign') ? 'active' : ''}>Start a Fundraiser</Link>
            {session && (
              <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>Dashboard</Link>
            )}
          </nav>

          <div className="site-header__actions">
            {session ? (
              <button className="btn btn--coral" onClick={handleLogout}>Sign Out</button>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost">Sign In</Link>
                <Link to="/campaigns" className="btn btn--coral">Donate Now</Link>
              </>
            )}
          </div>

          <button
            className="nav-toggle"
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(o => !o)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        <nav className={`mobile-nav${mobileOpen ? ' open' : ''}`} aria-label="Mobile navigation">
          <Link to="/campaigns">Browse Campaigns</Link>
          <Link to="/#how-it-works">How It Works</Link>
          <Link to="/create-campaign">Start a Fundraiser</Link>
          {session ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <button className="btn btn--coral" style={{ marginTop: 8 }} onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login">Sign In</Link>
              <Link to="/campaigns" className="btn btn--coral" style={{ marginTop: 8 }}>Donate Now</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
