'use client';

import { useState, type ReactNode } from 'react';
import { brand, footerNote } from '@adequate/mock-content';
import { deviceClass, Icon, Marquee, useScreen, Wordmark } from './kit';

/* ——————————————————— Public site ——————————————————— */

const siteNav: [string, string][] = [
  ['public.story', 'Story'],
  ['public.principle', 'Principle'],
  ['public.listen', 'Listen'],
  ['public.library', 'Library'],
  ['public.tools', 'Tools'],
  ['public.together', 'Circles'],
  ['public.membership', 'Membership'],
];

export function SiteHeader({ active }: { active?: string }) {
  const { width, navigate, concept } = useScreen();
  const [open, setOpen] = useState(false);
  const compact = width < 1000;
  const go = (id: string) => {
    setOpen(false);
    navigate?.(id);
  };
  return (
    <>
      {concept.id === 'living-manifesto' ? <Marquee /> : null}
      <header className="ad-siteheader">
        <button type="button" className="ad-linklike" onClick={() => go('public.home')} aria-label="ADEQUATE home">
          <Wordmark />
        </button>
        {compact ? (
          <button type="button" className="ad-iconbtn" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        ) : (
          <nav className="ad-sitenav" aria-label="Site">
            {siteNav.map(([id, label], i) => (
              <button key={id} type="button" className={`ad-navlink ${active === id ? 'is-active' : ''}`} onClick={() => go(id)}>
                {concept.id === 'resonance-atlas' ? <span className="ad-mono ad-navidx">{String(i + 1).padStart(2, '0')}</span> : null}
                {label}
              </button>
            ))}
            <button type="button" className="ad-btn ad-btn-primary ad-btn-sm" onClick={() => go('member.onboarding')}>
              <span>Begin free</span>
            </button>
          </nav>
        )}
      </header>
      {compact && open ? (
        <nav className="ad-menu-overlay" aria-label="Site">
          {siteNav.map(([id, label]) => (
            <button key={id} type="button" className="ad-menu-link" onClick={() => go(id)}>
              {label}
            </button>
          ))}
          <button type="button" className="ad-btn ad-btn-primary" onClick={() => go('member.onboarding')}>
            <span>Begin free</span>
          </button>
        </nav>
      ) : null}
    </>
  );
}

export function SiteFooter() {
  const { navigate } = useScreen();
  return (
    <footer className="ad-sitefooter">
      <div className="ad-footer-brand">
        <Wordmark />
        <p>{brand.expansion}</p>
      </div>
      <nav className="ad-footer-links" aria-label="Footer">
        {[
          ['public.faq', 'Questions'],
          ['public.about', 'About & contact'],
          ['public.privacy', 'Privacy & accessibility'],
        ].map(([id, l]) => (
          <button key={id} type="button" className="ad-linklike" onClick={() => navigate?.(id)}>
            {l}
          </button>
        ))}
      </nav>
      <p className="ad-footer-note">{footerNote}</p>
    </footer>
  );
}

export function PublicPage({ active, children }: { active?: string; children: ReactNode }) {
  return (
    <div className="ad ad-public">
      <SiteHeader active={active} />
      <main className="ad-main">{children}</main>
      <SiteFooter />
    </div>
  );
}

/* ——————————————————— Member app ——————————————————— */

type IconName = Parameters<typeof Icon>[0]['name'];
const memberNav: { id: string; label: string; short: string; icon: IconName; tier: 'Free' | 'Plus' | 'Circle' }[] = [
  { id: 'member.today', label: 'Today', short: 'Today', icon: 'sun', tier: 'Free' },
  { id: 'member.mirror', label: 'Adequacy Mirror', short: 'Mirror', icon: 'mirror', tier: 'Free' },
  { id: 'member.pathways', label: 'Pathways', short: 'Paths', icon: 'path', tier: 'Free' },
  { id: 'member.voice', label: 'Voice to Purpose', short: 'Voice', icon: 'mic', tier: 'Plus' },
  { id: 'member.book', label: 'Living Book', short: 'Book', icon: 'book', tier: 'Free' },
  { id: 'member.convergence', label: 'Convergence', short: 'Patterns', icon: 'stars', tier: 'Plus' },
  { id: 'member.together', label: 'Adequate Together', short: 'Circles', icon: 'circle', tier: 'Circle' },
  { id: 'member.profile', label: 'Profile & history', short: 'You', icon: 'user', tier: 'Free' },
];
const phoneTabs = ['member.today', 'member.mirror', 'member.pathways', 'member.voice', 'member.profile'];

export function AppShell({ active, title, children, root = true }: { active: string; title: string; children: ReactNode; root?: boolean }) {
  const { width, navigate, platform } = useScreen();
  const device = deviceClass(width);
  if (device === 'phone') {
    return (
      <div className={`ad ad-app ad-app-phone ad-app-${platform}`}>
        <header className="ad-appbar">
          {!root ? (
            <button type="button" className="ad-iconbtn" aria-label="Back" onClick={() => navigate?.('member.today')}>
              <Icon name="back" />
            </button>
          ) : null}
          <h1 className="ad-appbar-title">{title}</h1>
          <button type="button" className="ad-iconbtn" aria-label="Notifications and preferences" onClick={() => navigate?.('member.preferences')}>
            <Icon name="bell" />
          </button>
        </header>
        <main className="ad-appmain">{children}</main>
        <nav className="ad-tabbar" aria-label="App">
          {phoneTabs.map((id) => {
            const item = memberNav.find((n) => n.id === id)!;
            const on = active === id;
            return (
              <button key={id} type="button" className={`ad-tab ${on ? 'is-active' : ''}`} aria-current={on ? 'page' : undefined} onClick={() => navigate?.(id)}>
                <span className="ad-tab-icon"><Icon name={item.icon} /></span>
                <span className="ad-tab-label">{item.short}</span>
              </button>
            );
          })}
        </nav>
      </div>
    );
  }
  return (
    <div className="ad ad-app ad-app-wide">
      <aside className="ad-sidebar" aria-label="App">
        <div className="ad-sidebar-brand">
          <Wordmark />
        </div>
        <nav>
          {memberNav.map((n) => (
            <button key={n.id} type="button" className={`ad-sidelink ${active === n.id ? 'is-active' : ''}`} aria-current={active === n.id ? 'page' : undefined} onClick={() => navigate?.(n.id)}>
              <Icon name={n.icon} />
              <span>{device === 'tablet' && width < 900 ? n.short : n.label}</span>
              {n.tier !== 'Free' ? <span className={`ad-tier ad-tier-${n.tier.toLowerCase()}`}>{n.tier}</span> : null}
            </button>
          ))}
        </nav>
        <div className="ad-sidebar-foot">
          <button type="button" className="ad-sidelink" onClick={() => navigate?.('member.preferences')}>
            <Icon name="bell" />
            <span>Preferences</span>
          </button>
          <p className="ad-note">Signed in as Jordan · synthetic demo member</p>
        </div>
      </aside>
      <main className="ad-appmain">
        <header className="ad-apptop">
          <h1 className="ad-apptop-title">{title}</h1>
        </header>
        {children}
      </main>
    </div>
  );
}

/* ——————————————————— Founder Studio & developer ——————————————————— */

const studioNav: [string, string][] = [
  ['founder.capture', 'Capture'],
  ['founder.transcript', 'Words & meaning'],
  ['founder.concepts', 'Clusters'],
  ['founder.proposals', 'Proposals'],
  ['founder.timeline', 'Provenance'],
];
const devNav: [string, string][] = [
  ['dev.intake', 'Intake'],
  ['dev.compare', 'Preview & impact'],
  ['dev.status', 'Status & export'],
];

export function StudioShell({ active, kind, children }: { active: string; kind: 'founder' | 'developer'; children: ReactNode }) {
  const { navigate, width } = useScreen();
  const nav = kind === 'founder' ? studioNav : devNav;
  return (
    <div className={`ad ad-studio ${width < 700 ? 'is-narrow' : ''}`}>
      <header className="ad-studiobar">
        <Wordmark />
        <span className="ad-studio-kind">{kind === 'founder' ? 'Founder Studio' : 'Developer review'}</span>
        <span className="ad-badge ad-badge-demo">Mockup · not connected</span>
      </header>
      <nav className="ad-studionav" aria-label={kind === 'founder' ? 'Founder Studio' : 'Developer review'}>
        {nav.map(([id, label]) => (
          <button key={id} type="button" className={`ad-studiolink ${active === id ? 'is-active' : ''}`} aria-current={active === id ? 'page' : undefined} onClick={() => navigate?.(id)}>
            {label}
          </button>
        ))}
      </nav>
      <main className="ad-studiomain">{children}</main>
    </div>
  );
}
