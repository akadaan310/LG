'use client';

import type { ComponentType } from 'react';
import { screenById } from '@adequate/mock-content';
import * as P from './public';
import * as M from './member';
import * as F from './founder';

type ScreenComponent = ComponentType<{ v: 'v1' | 'v2' }>;

export const screenComponents: Record<string, ScreenComponent> = {
  'public.home': P.PublicHome,
  'public.story': P.PublicStory,
  'public.principle': P.PublicPrinciple,
  'public.tools': P.PublicTools,
  'public.listen': P.PublicListen,
  'public.library': P.PublicLibrary,
  'public.together': P.PublicTogether,
  'public.membership': P.PublicMembership,
  'public.faq': P.PublicFaq,
  'public.about': P.PublicAbout,
  'public.privacy': P.PublicPrivacy,
  'member.today': M.MemberToday,
  'member.mirror': M.MemberMirror,
  'member.pathways': M.MemberPathways,
  'member.voice': M.MemberVoice,
  'member.book': M.MemberBook,
  'member.convergence': M.MemberConvergence,
  'member.together': M.MemberTogether,
  'member.profile': M.MemberProfile,
  'member.preferences': M.MemberPreferences,
  'member.onboarding': M.MemberOnboarding,
  'founder.capture': F.FounderCapture,
  'founder.transcript': F.FounderTranscript,
  'founder.concepts': F.FounderConcepts,
  'founder.proposals': F.FounderProposals,
  'founder.timeline': F.FounderTimeline,
  'dev.intake': F.DevIntake,
  'dev.compare': F.DevCompare,
  'dev.status': F.DevStatus,
};

export function RenderScreen({ screenId, variant }: { screenId: string; variant: 'v1' | 'v2' }) {
  const C = screenComponents[screenId];
  const def = screenById[screenId];
  if (!C || !def) return <div className="ad">Unknown screen {screenId}</div>;
  const v = def.variants.some((x) => x.key === variant) ? variant : 'v1';
  return <C v={v} />;
}
