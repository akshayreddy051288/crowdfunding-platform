import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { allCampaigns } from '../data/campaigns';
import { getAllCampaigns, getLocalCampaigns, isPublicCampaign, getDonations, saveDonations, money, percent } from '../utils/helpers';
import { useSession } from '../hooks/useSession';
import { isAdminSession } from '../utils/auth';
import './CampaignDetail.css';

const PRESETS = [500, 1000, 2500, 5000];

export default function CampaignDetail() {
  const { id } = useParams();
  const session = useSession();
  const [campaign, setCampaign] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);

  // Donation state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState('1000');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const found = getAllCampaigns(allCampaigns).find(c => c.id === id);
    if (found) {
      setCampaign(found);
      setPreviewOnly(false);
      setNotFound(false);
      return;
    }

    const local = getLocalCampaigns().find(c => c.id === id);
    const ownerEmail = String(local?.ownerEmail || local?.organizerEmail || '').toLowerCase();
    const canPreview = local && session && (
      isAdminSession(session) || ownerEmail === session.email.toLowerCase()
    );
    if (canPreview && !isPublicCampaign(local)) {
      setCampaign(local);
      setPreviewOnly(true);
      setNotFound(false);
      return;
    }

    setCampaign(null);
    setPreviewOnly(false);
    setNotFound(true);
  }, [id, session]);

  const pct = campaign ? percent(campaign.raised, campaign.goal) : 0;

  // Close modal on Escape
  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e) => { if (e.key === 'Escape') setModalOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modalOpen]);

  // Lock scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  const handlePreset = useCallback((amt) => {
    setSelectedAmount(amt);
    setCustomAmount(String(amt));
  }, []);

  const handleCustomChange = (e) => {
    setCustomAmount(e.target.value);
    setSelectedAmount(Number(e.target.value) || 0);
  };

  async function handleShare() {
    const shareData = { title: campaign.name, text: `Support ${campaign.name} on CrowdHeal`, url: location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(location.href);
        alert('Campaign link copied.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') alert('Unable to share this link right now.');
    }
  }

  function handleDonate() {
    if (!donorName.trim()) { alert('Please enter your name.'); return; }
    if (!donorEmail.trim() || !/\S+@\S+\.\S+/.test(donorEmail)) { alert('Please enter a valid email.'); return; }
    if (selectedAmount < 50) { alert('Minimum donation is ₹50.'); return; }

    // Save donation
    const donations = getDonations();
    const campaignTotal = donations[campaign.id] || { amount: 0, donors: 0, recent: [] };
    campaignTotal.amount = (Number(campaignTotal.amount) || 0) + selectedAmount;
    campaignTotal.donors = (Number(campaignTotal.donors) || 0) + 1;
    campaignTotal.recent = Array.isArray(campaignTotal.recent) ? campaignTotal.recent : [];
    campaignTotal.recent.push({ name: donorName, amount: selectedAmount, date: new Date().toISOString() });
    campaignTotal.recent = campaignTotal.recent.slice(-5);
    donations[campaign.id] = campaignTotal;
    saveDonations(donations);

    // Update local state
    setCampaign(prev => ({
      ...prev,
      raised: prev.raised + selectedAmount,
      donors: prev.donors + 1,
    }));

    setModalOpen(false);
    setToast(`Thank you, ${donorName}! Your ${money(selectedAmount)} gift was received.`);
    setTimeout(() => setToast(''), 3200);
  }

  const campaignOwnerEmail = campaign ? String(campaign.ownerEmail || campaign.organizerEmail || '').toLowerCase() : '';
  const canManage = session && campaignOwnerEmail && campaignOwnerEmail === session.email.toLowerCase();

  if (notFound) {
    return (
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 24px 80px', flex: 1 }}>
        <div className="notice">
          <h1>Campaign not found</h1>
          <p>This campaign link may be incomplete or out of date. Browse the current campaigns to find one to support.</p>
          <Link to="/campaigns">Browse campaigns →</Link>
        </div>
      </main>
    );
  }

  if (!campaign) return null;

  return (
    <>
      <main className="campaign-detail-main">
        <p className="breadcrumb">
          <Link to="/campaigns">Campaigns</Link> / Campaign details
        </p>

        <div className="layout">
          {/* Story */}
          <article className="story-card">
            <div className="cover">
              <img src={campaign.image} alt={campaign.alt} />
              <div className="chips">
                <span className="chip">{campaign.category}</span>
                <span className="chip urgent">{campaign.urgentBadge}</span>
              </div>
            </div>
            <div className="story">
              <div className="location">⌖&nbsp;&nbsp;{campaign.location}</div>
              <h1 className="h1">{campaign.name}</h1>
              <p className="story-copy">{campaign.story}</p>
              <div className="divider" />
              <h2 className="section-title">About this fundraiser</h2>
              <p className="story-copy">
                Your support helps cover treatment and care at {campaign.hospital}.
                Every contribution brings this family closer to the care they need.
              </p>
              <div className="divider" />
              <div className="verified">
                <span aria-hidden="true">✓</span>
                <div>
                  <b>Campaign details available</b>
                  Hospital: {campaign.hospital}. Please review the fundraiser information before donating.
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="side" aria-label="Fundraising progress">
            <section className="donate-card">
              <div className="raised-label">Raised so far</div>
              <div className="raised">{money(campaign.raised)}</div>
              <div className="goal">of {money(campaign.goal)} goal</div>

              <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                <span style={{ width: `${pct}%` }} />
              </div>
              <div className="pct">{pct}% funded</div>

              <div className="stats">
                <div>
                  <strong>{campaign.donors.toLocaleString('en-IN')}</strong>
                  donors
                </div>
                <div className="days-left">
                  <strong>{campaign.daysLeft}</strong>
                  days left
                </div>
              </div>

              {canManage && (
                <Link to="/dashboard" className="share">Manage your campaign</Link>
              )}

              {previewOnly ? (
                <p className="goal">This request is not public yet, so donations are closed.</p>
              ) : (
                <button className="donate" onClick={() => setModalOpen(true)}>
                  Support this campaign
                </button>
              )}
              <button className="share" onClick={handleShare}>
                Share campaign
              </button>
            </section>

            <section className="trust-card">
              <strong>Every contribution matters</strong>
              Share this fundraiser with friends and family to help it reach more people.
            </section>
          </aside>
        </div>
      </main>

      {/* Donation Modal */}
      <div
        className={`payment-backdrop${modalOpen ? ' open' : ''}`}
        aria-hidden={!modalOpen}
        onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
      >
        <section className="payment-dialog" role="dialog" aria-modal="true" aria-labelledby="paymentTitle">
          <header className="payment-head">
            <img className="payment-thumb" src={campaign.image} alt={campaign.alt} />
            <div>
              <h2 className="payment-title" id="paymentTitle">{campaign.name}</h2>
              <div className="payment-sub">{campaign.hospital} · Verified</div>
            </div>
            <button className="payment-close" type="button" aria-label="Close payment form" onClick={() => setModalOpen(false)}>×</button>
          </header>

          <div className="payment-body">
            <label className="payment-label">Select or enter a donation amount</label>
            <div className="payment-presets">
              {PRESETS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  className={`payment-preset${selectedAmount === amt ? ' active' : ''}`}
                  onClick={() => handlePreset(amt)}
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
            <div className="payment-amount">
              <span className="payment-symbol">₹</span>
              <input
                type="number"
                value={customAmount}
                min="50"
                step="50"
                inputMode="numeric"
                onChange={handleCustomChange}
              />
            </div>
            <div className="payment-fields">
              <input
                type="text"
                placeholder="Full name (required)"
                value={donorName}
                onChange={e => setDonorName(e.target.value)}
                autoComplete="name"
              />
              <input
                type="email"
                placeholder="Email address (required)"
                value={donorEmail}
                onChange={e => setDonorEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <button className="payment-submit" type="button" onClick={handleDonate}>
              Proceed to Donate {money(selectedAmount)}
            </button>
          </div>
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`payment-toast show`} role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </>
  );
}
