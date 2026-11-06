import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { getLocalCampaigns, saveLocalCampaigns, getDonations, saveDonations, money } from '../utils/helpers';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const session = useSession();

  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState({});

  useEffect(() => {
    if (!session) { navigate('/login?returnTo=/dashboard', { replace: true }); return; }
    loadData();
  }, [session, navigate]);

  function loadData() {
    const allLocal = getLocalCampaigns();
    const userCampaigns = allLocal.filter(c => ownedByUser(c, session));
    setCampaigns(userCampaigns);
    setDonations(getDonations());
  }

  function ownedByUser(c, user) {
    const email = String(c.ownerEmail || c.organizerEmail || '').toLowerCase();
    if (email) return email === user.email.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.trim().toLowerCase();
    return fullName && String(c.organizerName || '').toLowerCase() === fullName;
  }

  const handleRemove = useCallback((id) => {
    const campaign = getLocalCampaigns().find(c => c.id === id);
    if (!campaign || !ownedByUser(campaign, session)) return;
    if (!window.confirm(`Remove "${campaign.name}" from your campaigns? Saved donation history will also be removed.`)) return;
    const updated = getLocalCampaigns().filter(c => c.id !== id);
    saveLocalCampaigns(updated);
    const updatedDonations = getDonations();
    delete updatedDonations[id];
    saveDonations(updatedDonations);
    loadData();
  }, [session]);

  if (!session) return null;

  const fullName = `${session.firstName} ${session.lastName}`.trim();

  return (
    <>
      <main className="dashboard-main container">
        <section className="intro">
          <p className="eyebrow-dash">Fundraiser workspace</p>
          <h1 className="page-title-dash">{fullName ? `Welcome, ${fullName}` : 'Your campaigns'}</h1>
          <p className="intro-copy">Track your fundraising progress, thank your latest supporters, and manage campaign details.</p>
          <div className="top-actions">
            <Link to="/create-campaign" className="btn btn--coral">Create a campaign</Link>
            <Link to="/campaigns" className="btn btn--outline">Browse campaigns</Link>
          </div>
        </section>

        <section className="campaign-list" aria-live="polite">
          {campaigns.length === 0 ? (
            <div className="empty-state">
              <h2>Your fundraiser journey starts here</h2>
              <p>You have not published a campaign yet. Start one to share your story and keep track of donations in this dashboard.</p>
              <Link to="/create-campaign" className="btn btn--coral">Start a fundraiser</Link>
            </div>
          ) : (
            campaigns.map(c => {
              const d = donations[c.id] || {};
              const raised = (Number(c.raised) || 0) + (Number(d.amount) || 0);
              const donors = (Number(c.donors) || 0) + (Number(d.donors) || 0);
              const pct = c.goal ? Math.min(Math.round(raised / c.goal * 100), 100) : 0;
              const recentDonors = Array.isArray(d.recent) ? [...d.recent].reverse().slice(0, 5) : [];

              return (
                <article className="campaign-card-dash" key={c.id}>
                  <div className="campaign-head">
                    <img className="campaign-image" src={c.image || ''} alt={c.alt || c.name} />
                    <div>
                      <div className="campaign-title-row">
                        <div>
                          <h2 className="campaign-title">{c.name}</h2>
                          <p className="campaign-meta">{c.category || 'Medical care'} · {c.location || ''}</p>
                        </div>
                        <div className="campaign-actions">
                          <Link to={`/campaign/${c.id}`} className="btn btn--outline">View</Link>
                          <Link to={`/create-campaign?edit=${c.id}`} className="btn btn--outline">Edit</Link>
                          <button className="btn btn--danger" type="button" onClick={() => handleRemove(c.id)}>Remove</button>
                        </div>
                      </div>

                      <div className="funding-stats">
                        <div className="stat">
                          <strong>{money(raised)}</strong>
                          <span>Raised toward {money(c.goal)}</span>
                        </div>
                        <div className="stat">
                          <strong>{pct}%</strong>
                          <span>Funded</span>
                        </div>
                        <div className="stat">
                          <strong>{donors.toLocaleString('en-IN')}</strong>
                          <span>Donors</span>
                        </div>
                      </div>

                      <div className="progress-dash" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                      <div className="progress-copy">
                        <span>{pct}% funded</span>
                        <span>{money(Math.max((Number(c.goal) || 0) - raised, 0))} to go</span>
                      </div>

                      <p className="campaign-story">{c.story || ''}</p>
                    </div>
                  </div>

                  <section className="donor-section">
                    <div className="donor-heading">
                      <h3>Latest supporters</h3>
                      <span>Last 5 donations</span>
                    </div>
                    <div className="donor-list">
                      {recentDonors.length === 0 ? (
                        <p className="empty-donors">Recent donor details will appear here as new donations are made.</p>
                      ) : (
                        recentDonors.map((donor, i) => (
                          <article className="donor" key={i}>
                            <span className="donor-name" title={donor.name || 'Supporter'}>{donor.name || 'Supporter'}</span>
                            <span className="donor-amount">{money(donor.amount)}</span>
                            <time className="donor-date">
                              {new Date(donor.date || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </time>
                          </article>
                        ))
                      )}
                    </div>
                  </section>
                </article>
              );
            })
          )}
        </section>
      </main>
    </>
  );
}
