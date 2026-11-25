import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { isAdminSession } from '../utils/auth';
import { campaignStatus, getLocalCampaigns, money, reviewCampaign } from '../utils/helpers';
import './Admin.css';

export default function Admin() {
  const navigate = useNavigate();
  const session = useSession();
  const [campaigns, setCampaigns] = useState([]);
  const [rejectingId, setRejectingId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!isAdminSession(session)) {
      navigate('/dashboard', { replace: true });
      return;
    }
    setCampaigns(getLocalCampaigns());
  }, [session, navigate]);

  function reload() {
    setCampaigns(getLocalCampaigns());
  }

  function accept(id) {
    setError('');
    try {
      reviewCampaign(id, 'approved');
      setRejectingId('');
      setNote('');
      reload();
    } catch (err) {
      setError(err.message || 'Could not accept this campaign.');
    }
  }

  function reject(id) {
    setError('');
    try {
      reviewCampaign(id, 'rejected', note);
      setRejectingId('');
      setNote('');
      reload();
    } catch (err) {
      setError(err.message || 'Could not reject this campaign.');
    }
  }

  if (!session || !isAdminSession(session)) return null;

  const pending = campaigns.filter(c => campaignStatus(c) === 'pending');
  const reviewed = campaigns
    .filter(c => campaignStatus(c) !== 'pending')
    .sort((a, b) => String(b.reviewedAt || '').localeCompare(String(a.reviewedAt || '')));

  return (
    <main className="admin-main container">
      <section className="intro">
        <p className="eyebrow-dash">Admin portal</p>
        <h1 className="page-title-dash">Campaign review queue</h1>
        <p className="intro-copy">
          {pending.length === 0
            ? 'No fundraiser requests are waiting.'
            : `${pending.length} request${pending.length === 1 ? '' : 's'} waiting for a decision.`}
        </p>
      </section>

      {error && <p className="form-message error" style={{ display: 'block', marginBottom: 18 }}>{error}</p>}

      <section className="admin-list" aria-live="polite">
        {pending.length === 0 ? (
          <div className="empty-state">
            <h2>Queue is clear</h2>
            <p>New fundraiser submissions will appear here until you accept or reject them.</p>
          </div>
        ) : (
          pending.map(c => (
            <article className="admin-card" key={c.id}>
              <div className="admin-card__head">
                <img src={c.image || ''} alt="" />
                <div>
                  <div className="admin-card__title-row">
                    <h2>{c.name}</h2>
                    <span className="status-pill status-pill--pending">Pending</span>
                  </div>
                  <p className="admin-meta">
                    {c.organizerName || 'Organizer'} · {c.organizerEmail || c.ownerEmail || 'No email'}
                  </p>
                  <p className="admin-meta">
                    {c.category || 'Medical care'} · {c.hospital || 'Hospital not set'} · {c.location || ''}
                  </p>
                  <p className="admin-goal">Goal {money(c.goal)} · {c.daysLeft} days</p>
                  <p className="admin-story">{c.story}</p>
                </div>
              </div>

              <div className="admin-actions">
                <button className="btn btn--coral" type="button" onClick={() => accept(c.id)}>Accept</button>
                <button
                  className="btn btn--danger"
                  type="button"
                  onClick={() => {
                    setRejectingId(rejectingId === c.id ? '' : c.id);
                    setNote('');
                  }}
                >
                  Reject
                </button>
              </div>

              {rejectingId === c.id && (
                <form
                  className="reject-box"
                  onSubmit={e => {
                    e.preventDefault();
                    reject(c.id);
                  }}
                >
                  <label htmlFor={`note-${c.id}`}>Reason for the fundraiser</label>
                  <textarea
                    id={`note-${c.id}`}
                    value={note}
                    maxLength={280}
                    placeholder="Tell them what needs to change."
                    onChange={e => setNote(e.target.value)}
                  />
                  <button className="btn btn--danger" type="submit">Confirm reject</button>
                </form>
              )}
            </article>
          ))
        )}
      </section>

      {reviewed.length > 0 && (
        <section className="reviewed">
          <h2>Recent decisions</h2>
          <ul>
            {reviewed.map(c => {
              const status = campaignStatus(c);
              return (
                <li key={c.id}>
                  <div className="decision-who">
                    <strong>{c.name}</strong>
                    <span>{c.organizerName || c.ownerEmail}</span>
                  </div>
                  <span className={`status-pill status-pill--${status}`}>
                    {status === 'approved' ? 'Accepted' : 'Rejected'}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
