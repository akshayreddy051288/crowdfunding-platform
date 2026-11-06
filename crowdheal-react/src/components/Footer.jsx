import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__inner">
          <Link to="/" className="brand">Crowd<span>Heal</span></Link>
          <nav className="site-footer__links">
            <Link to="/campaigns">Browse Campaigns</Link>
            <Link to="/create-campaign">Start a Fundraiser</Link>
            <Link to="/login">Sign In</Link>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
          </nav>
          <p className="site-footer__copy">© 2026 CrowdHeal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
