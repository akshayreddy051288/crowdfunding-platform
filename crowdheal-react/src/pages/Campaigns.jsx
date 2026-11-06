import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { allCampaigns } from '../data/campaigns';
import { getAllCampaigns } from '../utils/helpers';
import CampaignCard from '../components/CampaignCard';
import './Campaigns.css';

const CATEGORIES = ['Cancer', 'Transplant', 'Surgery', 'Emergency', 'Pediatric', 'Treatment'];

export default function Campaigns() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('urgent');
  const [activeCategory, setActiveCategory] = useState('all');

  const allData = useMemo(() => getAllCampaigns(allCampaigns), [location.key]);

  const filtered = useMemo(() => {
    let list = allData;

    if (activeCategory !== 'all') {
      list = list.filter(c => c.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.story.toLowerCase().includes(q) ||
          c.hospital?.toLowerCase().includes(q) ||
          c.location?.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case 'urgent':       return [...list].sort((a, b) => a.daysLeft - b.daysLeft);
      case 'popular':      return [...list].sort((a, b) => b.donors - a.donors);
      case 'raised-high':  return [...list].sort((a, b) => b.raised - a.raised);
      case 'goal-percent': return [...list].sort((a, b) => (b.raised / b.goal) - (a.raised / a.goal));
      case 'newest':       return [...list].reverse();
      default:             return list;
    }
  }, [allData, search, sort, activeCategory]);

  function countByCategory(cat) {
    return allData.filter(c => c.category === cat).length;
  }

  return (
    <>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <div className="page-hero__badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            100% Hospital Verified Medical Campaigns
          </div>
          <h1 className="page-hero__title">Support a <em>life-saving treatment</em> today</h1>
          <p className="page-hero__desc">
            Every rupee goes directly towards hospital bills, surgeries, and critical medicines.
            Choose a story, give what you can, and be the miracle a family prays for.
          </p>

          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="filter-bar__search">
              <input
                type="search"
                placeholder="Search campaigns, hospitals, or treatments…"
                aria-label="Search campaigns"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-bar__sort">
              <label htmlFor="sortSelect">Sort By:</label>
              <select
                id="sortSelect"
                className="filter-bar__select"
                value={sort}
                onChange={e => setSort(e.target.value)}
              >
                <option value="urgent">Most Urgent (Fewest Days Left)</option>
                <option value="popular">Most Donors</option>
                <option value="raised-high">Highest Amount Raised</option>
                <option value="goal-percent">Closest to Goal</option>
                <option value="newest">Newest Fundraisers</option>
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="category-pills">
            <button
              className={`cat-pill${activeCategory === 'all' ? ' active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              <span>All Campaigns</span>
              <span className="cat-pill__count">{allData.length}</span>
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`cat-pill${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                <span>{cat}</span>
                <span className="cat-pill__count">{countByCategory(cat)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <main className="container">
        <div className="results-meta">
          <div>Showing <strong>{filtered.length}</strong> verified medical fundraisers</div>
        </div>

        {filtered.length === 0 ? (
          <div className="campaigns-grid">
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="56" height="56" style={{ margin: '0 auto 16px', color: '#6b7786', opacity: .6, display: 'block' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <h2 className="empty-state__title">No campaigns found</h2>
              <p className="empty-state__text">Try adjusting your search or category filter.</p>
              <button className="btn btn--outline" onClick={() => { setSearch(''); setActiveCategory('all'); }}>
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <section className="campaigns-grid" aria-label="Campaigns list">
            {filtered.map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </section>
        )}
      </main>

      {/* Trust Strip */}
      <section className="trust-strip">
        <div className="container">
          <div className="trust-strip__grid">
            {[
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                title: '100% Hospital Verified',
                desc: 'Every medical quotation and diagnosis is cross-verified with treating doctors and partner hospitals before publishing.',
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
                title: 'Zero Platform Fee',
                desc: 'We charge 0% commission on the first medical fundraiser so maximum financial help reaches the patient\'s bedside.',
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
                title: 'Direct Hospital Payouts',
                desc: 'Funds are disbursed directly into hospital escrow accounts to guarantee every donation fulfills real medical bills.',
              },
            ].map(item => (
              <div className="trust-item" key={item.title}>
                <div className="trust-item__icon">{item.icon}</div>
                <div>
                  <h3 className="trust-item__title">{item.title}</h3>
                  <p className="trust-item__desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
