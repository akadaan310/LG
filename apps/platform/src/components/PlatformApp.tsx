'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { approvedTokens } from '@adequate/domain';
import { api, useResource, type Session } from './api';
import { AuthView } from './AuthView';
import { MemberViews } from './MemberViews';
import { PublicViews } from './PublicViews';
import { StudioView } from './StudioView';
import { ErrorNotice, Loading } from './ui';

const publicLinks = [['Home', '/'], ['Story', '/story'], ['Principle', '/principle'], ['Listen', '/listen'], ['Membership', '/membership'], ['Library', '/library']];
const memberLinks = [['Today', '/today'], ['Reflections', '/reflections'], ['Saved', '/saved'], ['Pathways', '/pathways'], ['Preferences', '/preferences']];
const memberRoutes = ['today', 'reflections', 'saved', 'pathways', 'preferences'];
export function PlatformApp({ route, slug, recovery = false }: { route: string; slug?: string; recovery?: boolean }) {
  const router = useRouter();
  const interactive = useSyncExternalStore(() => () => {}, () => true, () => false);
  const session = useResource<Session>('/api/session');
  const [menuOpen, setMenuOpen] = useState(false); const [logoutError, setLogoutError] = useState<Error | null>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null); const menu = useRef<HTMLDivElement>(null);
  const account = session.data ?? { user: null, role: null, configured: false, signup_enabled: false };
  const appearance = useResource<{theme:'system'|'dark'|'light'}>(account.user ? '/api/preferences' : null);
  useEffect(() => {
    const theme = appearance.data?.theme ?? localStorage.getItem('adequate-theme') ?? 'dark';
    if (['system', 'dark', 'light'].includes(theme)) document.documentElement.dataset.theme = theme;
  }, [appearance.data?.theme]);
  useEffect(() => {
    if (!menuOpen) return;
    menu.current?.querySelector<HTMLElement>('button, a')?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setMenuOpen(false); menuTrigger.current?.focus(); }
      if (event.key === 'Tab') {
        const entries = menu.current?.querySelectorAll<HTMLElement>('a, button:not([disabled])'); if (!entries?.length) return;
        const first = entries[0]; const last = entries[entries.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keyboard); return () => document.removeEventListener('keydown', keyboard);
  }, [menuOpen]);
  const href = route === 'home' ? '/' : `/${route}`;
  const navigation = (links: string[][]) => links.map(([title, url], index) => <Link href={url} key={url} className="nav-link" aria-current={href === url ? 'page' : undefined} onClick={() => setMenuOpen(false)}><span className="nav-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{title}</Link>);
  return <div className="platform" style={Object.fromEntries(Object.entries(approvedTokens.dark).map(([key, value]) => [`--approved-dark-${key}`, value]))} data-palette="resonance-atlas" data-navigation="living-manifesto" data-motion="open-static" data-terminology="review">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="site-header"><Link href="/" className="wordmark" aria-label="ADEQUATE home"><span className="wordmark-dot" aria-hidden="true">◎</span>ADEQUATE</Link><nav className="desktop-nav" aria-label="Public navigation">{navigation(publicLinks)}</nav><div className="header-actions">{account.user ? <Link href="/today" className="account-link">Today</Link> : <Link href="/auth" className="account-link">Sign in</Link>}<button type="button" className="menu-trigger button secondary" ref={menuTrigger} disabled={!interactive} aria-expanded={menuOpen} aria-controls="site-menu" onClick={() => setMenuOpen(!menuOpen)}>Menu</button></div></header>
    {menuOpen ? <div className="menu-backdrop"><div id="site-menu" ref={menu} className="mobile-menu" role="dialog" aria-modal="true" aria-label="Site navigation"><button className="button secondary" type="button" onClick={() => { setMenuOpen(false); menuTrigger.current?.focus(); }}>Close menu</button><nav aria-label="Menu public navigation">{navigation(publicLinks)}</nav>{account.user ? <nav aria-label="Menu member navigation">{navigation(memberLinks)}</nav> : null}{account.role === 'founder' || account.role === 'editor' ? <Link className="nav-link" href="/studio">Founder Studio</Link> : null}<Link href="/privacy" className="nav-link">Privacy</Link></div></div> : null}
    {account.user ? <div className="member-bar"><nav aria-label="Member navigation">{navigation(memberLinks)}{account.role === 'founder' || account.role === 'editor' ? <Link href="/studio" className="nav-link" aria-current={route === 'studio' ? 'page' : undefined}>Studio</Link> : null}</nav><button type="button" className="text-button" onClick={async () => { setLogoutError(null); try { await api('/api/auth/logout', { method: 'POST' }); session.reload(); router.push('/auth'); router.refresh(); } catch (reason) { setLogoutError(reason as Error); } }}>Sign out</button></div> : null}
    <ErrorNotice error={logoutError} />
    <main id="main-content" tabIndex={-1}>{session.error ? <div className="section"><ErrorNotice error={session.error} retry={session.reload} /></div> : null}{memberRoutes.includes(route) || route === 'studio' || route === 'auth' ? session.loading ? <section className="section"><Loading /></section> : route === 'auth' ? <AuthView session={account} refreshSession={session.reload} recovery={recovery} /> : route === 'studio' ? <StudioView session={account} /> : <MemberViews route={route} session={account} refreshSession={session.reload} /> : <PublicViews route={route} slug={slug} />}</main>
    <footer className="site-footer"><Link href="/">ADEQUATE</Link><p>Content and launch require owner approval.</p><nav aria-label="Footer navigation"><Link href="/privacy">Privacy</Link><Link href="/membership">Membership status</Link><Link href="/auth">Account access</Link></nav></footer>
  </div>;
}
