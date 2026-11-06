import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="container" style={{ flex: 1, padding: '80px 24px' }}>
      <div className="notice">
        <h1>Page not found</h1>
        <p>That link does not match a CrowdHeal page. Return home or browse current fundraisers.</p>
        <Link to="/">Go home →</Link>
        <br />
        <Link to="/campaigns">Browse campaigns →</Link>
      </div>
    </main>
  )
}
