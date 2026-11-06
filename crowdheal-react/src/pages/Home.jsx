import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { successStories } from '../data/successStories';
import { money, percent } from '../utils/helpers';
import featuredCare from '../assets/featured-care.svg';
import './Home.css';

function SuccessStoryCard({ story }) {
  const pct = percent(story.raised, story.goal);
  return (
    <article className="success-card">
      <div className="success-card__img">
        <img src={story.image} alt={story.alt} loading="lazy" />
        <span className="success-card__badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          {story.outcome}
        </span>
      </div>
      <div className="success-card__body">
        <h3 className="success-card__name">{story.name}</h3>
        <p className="success-card__story">{story.story}</p>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="success-card__meta">
          <strong>{money(story.raised)}</strong>
          <span>raised · {story.donors.toLocaleString('en-IN')} donors</span>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [slide, setSlide] = useState(0);
  const perSlide = 3;
  const totalSlides = Math.ceil(successStories.length / perSlide);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSlide(s => (s + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [totalSlides]);

  const visibleStories = successStories.slice(slide * perSlide, slide * perSlide + perSlide);

  // Reveal animation via IntersectionObserver
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="container">
          <div className="hero__grid">
            <div className="hero__content rise-in">
              <span className="hero__eyebrow">Medical crowdfunding with heart</span>
              <h1 className="hero__title">
                When treatment costs too much, <em>community steps in.</em>
              </h1>
              <p className="hero__sub">
                Start a verified fundraiser in minutes&mdash;or give hope to someone fighting for their life today.
              </p>
              <div className="hero__actions">
                <Link to="/create-campaign" className="btn btn--coral">Start a Fundraiser</Link>
                <Link to="/campaigns" className="btn btn--outline">Browse Campaigns</Link>
              </div>
              <div className="hero__stats">
                <div className="hero__stat">
                  <strong>&#8377;2.4Cr+</strong>
                  <span>Raised for treatment</span>
                </div>
                <div className="hero__stat">
                  <strong>18,000+</strong>
                  <span>Donors stepped in</span>
                </div>
                <div className="hero__stat">
                  <strong>1,200+</strong>
                  <span>Campaigns funded</span>
                </div>
              </div>
            </div>

            <div className="hero__featured hero__purpose rise-in rise-in-delay-1" aria-hidden="true">
              <img src={featuredCare} alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Success Stories / Featured Campaigns ── */}
      <section className="section section--alt" id="campaigns">
        <div className="container">
          <div className="section__header reveal">
            <h2 className="section__title">Small acts of kindness can change a life.</h2>
            <p className="section__sub">See how people came together to help families reach the care they needed.</p>
          </div>

          <div className="campaign-grid reveal">
            {visibleStories.map((story, i) => (
              <SuccessStoryCard key={i} story={story} />
            ))}
          </div>

          {/* Slideshow dots */}
          <div className="story-slideshow-dots" role="group" aria-label="Choose success story slide">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                className="story-slideshow-dot"
                aria-current={slide === i ? 'true' : undefined}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section__header reveal">
            <h2 className="section__title">How CrowdHeal works</h2>
            <p className="section__sub">Simple, transparent, and built for families in crisis&mdash;not paperwork.</p>
          </div>

          <div className="steps reveal">
            {[
              {
                num: 'Step 01',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                ),
                title: 'Tell Your Story',
                text: "Share the patient's diagnosis, treatment need, and goal. Our team verifies details before your campaign goes live.",
              },
              {
                num: 'Step 02',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
                title: 'Community Rallies',
                text: 'Supporters from across India donate securely. Every rupee goes directly toward the patient\'s medical bills.',
              },
              {
                num: 'Step 03',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                ),
                title: 'Funds Reach Hospital',
                text: 'Funds disburse directly to the treating hospital\'s escrow account, ensuring every donation fulfills a real medical bill.',
              },
            ].map((step, i) => (
              <div className="step" key={i}>
                <div className="step__icon">{step.icon}</div>
                <p className="step__num">{step.num}</p>
                <h3 className="step__title">{step.title}</h3>
                <p className="step__text">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Band ── */}
      <section className="trust-band">
        <div className="container">
          <blockquote className="trust-band__quote">
            "CrowdHeal helped us pay for Riya's heart surgery in 11 days. I never thought strangers would care this much."
          </blockquote>
          <p className="trust-band__author">— Sunita Verma, Riya's mother</p>
          <div className="trust-band__badges">
            {[
              '100% Hospital Verified',
              'Zero Platform Fee on 1st Campaign',
              'Direct Hospital Payouts',
              'SSL Secure Payments',
            ].map(badge => (
              <div className="trust-band__badge" key={badge}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dual CTA ── */}
      <section className="section">
        <div className="container">
          <div className="dual-cta reveal">
            <div className="dual-cta__card dual-cta__card--help">
              <p className="dual-cta__label">Need financial help?</p>
              <h3 className="dual-cta__title">Start a Medical Fundraiser</h3>
              <p className="dual-cta__text">
                Get verified, go live in minutes, and let your community help carry the cost of care.
              </p>
              <Link to="/create-campaign" className="btn btn--coral">Start a Fundraiser</Link>
            </div>
            <div className="dual-cta__card dual-cta__card--give">
              <p className="dual-cta__label">Want to give?</p>
              <h3 className="dual-cta__title">Donate to a Campaign</h3>
              <p className="dual-cta__text">
                Browse verified campaigns and give hope to a patient who needs you most today.
              </p>
              <Link to="/campaigns" className="btn btn--outline">Browse Campaigns</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
