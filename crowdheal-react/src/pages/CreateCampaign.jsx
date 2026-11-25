import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { isAdminSession } from '../utils/auth';
import { campaignStatus, getLocalCampaigns, saveLocalCampaigns } from '../utils/helpers';
import './CreateCampaign.css';

const CATEGORIES = ['Cancer', 'Emergency', 'Pediatric', 'Surgery', 'Transplant', 'Treatment', 'Other'];
const DURATIONS = [7, 14, 30, 45, 60, 90];

const EMPTY = {
  name: '', organizerName: '', organizerEmail: '', story: '',
  hospital: '', location: '', category: '', daysLeft: '', goal: '', image: '',
};

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const session = useSession();

  const [form, setForm] = useState(EMPTY);
  const [imagePreviewSrc, setImagePreviewSrc] = useState('');
  const [imageError, setImageError] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [campaignToEdit, setCampaignToEdit] = useState(null);

  useEffect(() => {
    if (!session) {
      const target = editId ? `/create-campaign?edit=${editId}` : '/create-campaign';
      navigate(`/login?returnTo=${encodeURIComponent(target)}`, { replace: true });
      return;
    }
    if (isAdminSession(session)) navigate('/admin', { replace: true });
  }, [session, navigate, editId]);

  useEffect(() => {
    if (!session || editId) return;
    const organizerName = `${session.firstName} ${session.lastName}`.trim();
    const organizerEmail = session.email;
    setForm(prev => {
      if (prev.organizerName === organizerName && prev.organizerEmail === organizerEmail) return prev;
      return {
        ...prev,
        organizerName: prev.organizerName || organizerName,
        organizerEmail: prev.organizerEmail || organizerEmail,
      };
    });
  }, [session, editId]);

  // Pre-fill form if editing
  useEffect(() => {
    if (!editId || !session) return;
    const saved = getLocalCampaigns();
    const candidate = saved.find(c => c.id === editId);
    if (!candidate) { navigate('/dashboard', { replace: true }); return; }
    const ownerEmail = String(candidate.ownerEmail || candidate.organizerEmail || '').toLowerCase();
    const isOwner = ownerEmail ? ownerEmail === session.email.toLowerCase() : false;
    if (!isOwner) { navigate('/dashboard', { replace: true }); return; }
    setCampaignToEdit(candidate);
    setForm({
      name: candidate.name || '',
      organizerName: candidate.organizerName || `${session.firstName} ${session.lastName}`.trim(),
      organizerEmail: candidate.organizerEmail || session.email,
      story: candidate.story || '',
      hospital: candidate.hospital || '',
      location: candidate.location || '',
      category: candidate.category || '',
      daysLeft: String(candidate.daysLeft || ''),
      goal: String(candidate.goal || ''),
      image: candidate.image || '',
    });
    if (candidate.image) setImagePreviewSrc(candidate.image);
  }, [editId, session, navigate]);

  function update(field) {
    return e => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setMessage({ type: '', text: '' });
    };
  }

  function handleImageInput(e) {
    const val = e.target.value.trim();
    setForm(prev => ({ ...prev, image: val }));
    setImageError(false);
    if (val) setImagePreviewSrc(val);
    else setImagePreviewSrc('');
  }

  const isValid =
    form.name.trim() && form.organizerName.trim() && form.organizerEmail.trim() &&
    form.story.trim().length >= 30 && form.hospital.trim() && form.location.trim() &&
    form.category && form.daysLeft && Number(form.goal) >= 1000 && form.image.trim();

  function handleSubmit(e) {
    e.preventDefault();
    if (!session) { navigate('/login?returnTo=/create-campaign', { replace: true }); return; }
    if (!isValid) return;

    const id = campaignToEdit
      ? campaignToEdit.id
      : `campaign-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

    const daysLeft = Number(form.daysLeft);
    const previousStatus = campaignToEdit ? campaignStatus(campaignToEdit) : 'pending';
    const status = campaignToEdit && previousStatus === 'approved' ? 'approved' : 'pending';
    const campaign = {
      ...(campaignToEdit || {}),
      id,
      status,
      submittedAt: campaignToEdit?.submittedAt || new Date().toISOString(),
      reviewNote: status === 'pending' ? '' : campaignToEdit?.reviewNote || '',
      reviewedAt: status === 'pending' ? '' : campaignToEdit?.reviewedAt || '',
      name: form.name.trim(),
      organizerName: form.organizerName.trim(),
      organizerEmail: session.email,
      ownerEmail: session.email.toLowerCase(),
      location: form.location.trim(),
      story: form.story.trim(),
      raised: campaignToEdit ? Number(campaignToEdit.raised) || 0 : 0,
      goal: Number(form.goal),
      donors: campaignToEdit ? Number(campaignToEdit.donors) || 0 : 0,
      daysLeft,
      category: form.category,
      urgentBadge: daysLeft <= 7 ? `${daysLeft} Days Left` : daysLeft <= 14 ? 'Urgent' : 'New Campaign',
      hospital: form.hospital.trim(),
      image: form.image.trim(),
      alt: `Campaign image for ${form.name.trim()}`,
    };

    try {
      const saved = getLocalCampaigns();
      if (campaignToEdit) {
        const idx = saved.findIndex(c => c.id === campaignToEdit.id);
        if (idx < 0) throw new Error('Campaign no longer exists.');
        saved[idx] = campaign;
      } else {
        saved.push(campaign);
      }
      saveLocalCampaigns(saved);
      const successText = status === 'pending'
        ? (campaignToEdit ? 'Sent back for review. Redirecting…' : 'Submitted for review. Redirecting…')
        : 'Campaign updated. Redirecting…';
      setMessage({ type: 'success', text: successText });
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setMessage({ type: 'error', text: 'Could not save this campaign. Please try again.' });
    }
  }

  if (!session || isAdminSession(session)) return null;

  const editingLive = campaignToEdit && campaignStatus(campaignToEdit) === 'approved';

  return (
    <>
      <main style={{ flex: 1 }}>
        <section className="page-intro container">
          <span className="eyebrow">✦&nbsp;&nbsp;{editId ? 'Manage your fundraiser' : 'Start a verified fundraiser'}</span>
          <h1 className="page-title">
            {editId ? <>Update your <em>fundraiser.</em></> : <>Help your community <em>show up.</em></>}
          </h1>
          <p className="page-description">
            {editId
              ? editingLive
                ? "Edit the campaign details supporters see. Your fundraising progress and donor history will be kept."
                : "Update the request and send it back to the admin queue. It stays hidden until it is accepted."
              : "Share the patient's story and treatment goal. New fundraisers stay in the admin queue until they are accepted."}
          </p>
        </section>

        <div className="form-layout container">
          <form className="form-card" id="campaignForm" noValidate onSubmit={handleSubmit}>

            {/* Section 1 — Story */}
            <section className="form-section">
              <div className="section-heading">
                <span className="section-number">1</span>
                <div><h2>Campaign story</h2><p>Tell people who needs help and why.</p></div>
              </div>
              <div className="field-grid">
                <div className="field field--full">
                  <label htmlFor="campaignName">Campaign title <span className="required">*</span></label>
                  <input id="campaignName" type="text" maxLength={90} placeholder="e.g. Help Ravi get his liver transplant" required value={form.name} onChange={update('name')} />
                </div>
                <div className="field">
                  <label htmlFor="organizerName">Your name <span className="required">*</span></label>
                  <input id="organizerName" type="text" maxLength={80} placeholder="Your full name" required value={form.organizerName} onChange={update('organizerName')} />
                </div>
                <div className="field">
                  <label htmlFor="organizerEmail">Your email <span className="required">*</span></label>
                  <input id="organizerEmail" type="email" maxLength={120} placeholder="you@example.com" required value={form.organizerEmail} onChange={update('organizerEmail')} />
                </div>
                <div className="field field--full">
                  <label htmlFor="story">
                    Patient's story <span className="required">*</span>{' '}
                    <span className="hint">Include the diagnosis, treatment needed, and how donations will help.</span>
                  </label>
                  <textarea id="story" minLength={30} maxLength={1400} placeholder="Write the patient's story in your own words…" required value={form.story} onChange={update('story')} />
                  <div className="story-meta">
                    <span>At least 30 characters</span>
                    <span>{form.story.length} / 1400</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2 — Medical */}
            <section className="form-section">
              <div className="section-heading">
                <span className="section-number">2</span>
                <div><h2>Medical and hospital details</h2><p>Help supporters understand where treatment is taking place.</p></div>
              </div>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="hospital">Hospital or care centre <span className="required">*</span></label>
                  <input id="hospital" type="text" maxLength={100} placeholder="Hospital name" required value={form.hospital} onChange={update('hospital')} />
                </div>
                <div className="field">
                  <label htmlFor="location">City and region <span className="required">*</span></label>
                  <input id="location" type="text" maxLength={100} placeholder="e.g. Hyderabad, Telangana" required value={form.location} onChange={update('location')} />
                </div>
                <div className="field">
                  <label htmlFor="category">Treatment category <span className="required">*</span></label>
                  <select id="category" required value={form.category} onChange={update('category')}>
                    <option value="" disabled>Select a category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="daysLeft">Fundraising duration <span className="required">*</span></label>
                  <select id="daysLeft" required value={form.daysLeft} onChange={update('daysLeft')}>
                    <option value="" disabled>Select duration</option>
                    {DURATIONS.map(d => <option key={d} value={d}>{d} days</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Section 3 — Goal */}
            <section className="form-section">
              <div className="section-heading">
                <span className="section-number">3</span>
                <div><h2>Fundraising goal</h2><p>Set the amount needed for treatment and care.</p></div>
              </div>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="goal">Target amount (INR) <span className="required">*</span></label>
                  <input id="goal" type="number" min={1000} max={100000000} step={1000} inputMode="numeric" placeholder="e.g. 800000" required value={form.goal} onChange={update('goal')} />
                  <span className="hint">Minimum ₹1,000. You can update it later.</span>
                </div>
                <div className="field">
                  <label htmlFor="image">Campaign image URL <span className="required">*</span></label>
                  <input id="image" type="url" maxLength={500} placeholder="https://example.com/patient-photo.jpg" required value={form.image} onChange={handleImageInput} />
                  <span className="hint">A direct image link is required.</span>
                  {imagePreviewSrc && !imageError && (
                    <img
                      className="image-preview visible"
                      src={imagePreviewSrc}
                      alt="Campaign image preview"
                      onError={() => setImageError(true)}
                    />
                  )}
                </div>
              </div>
            </section>

            {message.text && (
              <p className={`form-message ${message.type}`}>{message.text}</p>
            )}

            <div className="publish-wrap">
              <button className="btn btn--coral publish-btn" type="submit" disabled={!isValid}>
                {editingLive ? 'Save Changes' : editId ? 'Resubmit for review' : 'Submit for review'}
              </button>
              <p className="publish-hint">
                {isValid
                  ? editingLive
                    ? 'Your required details are complete. You can save now.'
                    : 'Your required details are complete. An admin will accept or reject this request.'
                  : 'Complete all required fields to submit this fundraiser.'}
              </p>
            </div>
          </form>

          {/* Aside */}
          <aside className="aside">
            <section className="aside-card">
              <h2>Before you publish</h2>
              <ul className="check-list">
                <li><span className="check">✓</span><span>Use a clear title and explain the treatment in your own words.</span></li>
                <li><span className="check">✓</span><span>Double-check the hospital, location, and fundraising target.</span></li>
                <li><span className="check">✓</span><span>Choose an image URL that you have permission to share.</span></li>
              </ul>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
