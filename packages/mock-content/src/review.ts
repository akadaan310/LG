/** Review vocabulary — written for LG, not for designers. */

export type DecisionStatus = 'love' | 'maybe' | 'not-for-me' | 'approved' | 'rejected' | 'deferred';

export const statusLabels: Record<DecisionStatus, { label: string; short: string; tone: 'yes' | 'soft' | 'no' | 'later' }> = {
  love: { label: 'I love this', short: 'Love', tone: 'yes' },
  maybe: { label: 'Maybe', short: 'Maybe', tone: 'soft' },
  'not-for-me': { label: 'Not for me', short: 'Not for me', tone: 'no' },
  approved: { label: 'Yes, this one', short: 'Approved', tone: 'yes' },
  rejected: { label: 'No', short: 'Rejected', tone: 'no' },
  deferred: { label: 'Decide later', short: 'Later', tone: 'later' },
};

export const quickReactions: DecisionStatus[] = ['love', 'maybe', 'not-for-me'];
export const decisionChoices: DecisionStatus[] = ['approved', 'deferred', 'rejected'];

export const emotionTags: string[] = [
  'Feels like me',
  'Powerful',
  'Warmer',
  'Calmer',
  'Clearer',
  'Too formal',
  'Too complicated',
  'Too loud',
  'Too quiet',
  'Too dark',
  'Not hopeful enough',
  'Beautiful',
  'Feels honest',
  'Feels like a sales pitch',
  'Want to see more',
];

/** Gentle, non-leading prompts. None of them presumes an answer. */
export const gentlePrompts: string[] = [
  'Which one feels more like your voice?',
  'What would you want someone to feel here?',
  'Is there anything here you would never say?',
  'If a friend saw this, what would they think ADEQUATE is about?',
  'What is missing?',
  'Where does your eye go first? Is that the right place?',
  'Does anything here feel like pressure?',
  'It is completely fine to say none of these.',
];

export type Author = 'LG' | 'Engineer';
export const authors: Author[] = ['LG', 'Engineer'];

/**
 * Hybrid "mix and match" slots. LG can favour one concept overall while taking specific
 * parts from the others.
 */
export interface HybridSlot {
  id: string;
  name: string;
  question: string;
}

export const hybridSlots: HybridSlot[] = [
  { id: 'slot.hero', name: 'Homepage opening', question: 'Which opening moment should greet people?' },
  { id: 'slot.typography', name: 'Lettering (type)', question: 'Whose letters feel like your voice on the page?' },
  { id: 'slot.palette', name: 'Colours & light', question: 'Which light and colour feels right?' },
  { id: 'slot.symbols', name: 'Symbols & drawings', question: 'Which symbols and drawings feel meaningful?' },
  { id: 'slot.motion', name: 'Movement', question: 'How should things move?' },
  { id: 'slot.dashboard', name: 'Member home (Today)', question: 'Which daily home feels best to come back to?' },
  { id: 'slot.audio', name: 'Sound & voice visuals', question: 'How should your voice be shown?' },
  { id: 'slot.navigation', name: 'Finding your way (menus)', question: 'Which menus feel easiest?' },
  { id: 'slot.cards', name: 'Reflection cards', question: 'Which reflection cards feel kindest?' },
  { id: 'slot.founder', name: 'Founder Studio feel', question: 'Which studio would you enjoy working in?' },
];

export const impactOptions: string[] = [
  'Feel seen',
  'Feel calm',
  'Feel courage',
  'Understand the idea',
  'Take one small action',
  'Feel they belong',
  'Feel hope',
  'Other (described below)',
];
