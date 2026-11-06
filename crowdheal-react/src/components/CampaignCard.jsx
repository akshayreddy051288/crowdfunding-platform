import { Link } from 'react-router-dom';
import { money, percent } from '../utils/helpers';

export default function CampaignCard({ campaign }) {
  const pct = percent(campaign.raised, campaign.goal);

  return (
    <article className="campaign-card">
      <div className="campaign-card__img-box">
        <img
          className="campaign-card__img"
          src={campaign.image}
          alt={campaign.alt}
          loading="lazy"
        />
        <span className="campaign-card__tag">{campaign.category}</span>
        <span className="campaign-card__urgency-pill">{campaign.urgentBadge}</span>
        {campaign.hospital && (
          <span className="campaign-card__hospital-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            {campaign.hospital}
          </span>
        )}
      </div>

      <div className="campaign-card__body">
        <p className="campaign-card__location">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {campaign.location}
        </p>

        <h3 className="campaign-card__title">{campaign.name}</h3>
        <p className="campaign-card__story">{campaign.story}</p>

        <div className="campaign-card__amounts">
          <strong>{money(campaign.raised)}</strong>
          <span>of {money(campaign.goal)}</span>
        </div>

        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="campaign-card__meta">
          <span>{campaign.donors.toLocaleString('en-IN')} donors</span>
          <span>{campaign.daysLeft} days left</span>
        </div>

        <div className="campaign-card__actions">
          <Link to={`/campaign/${campaign.id}`} className="btn btn--coral">
            Donate Now
          </Link>
          <Link to={`/campaign/${campaign.id}`} className="btn btn--outline">
            Learn More
          </Link>
        </div>
      </div>
    </article>
  );
}
