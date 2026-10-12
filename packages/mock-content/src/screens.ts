export type Surface = 'public' | 'member' | 'founder' | 'developer';

export interface ScreenVariant {
  /** Stable id: `<screenId>@<key>` */
  id: string;
  key: 'v1' | 'v2';
  name: string;
  /** Plain-language description of what is different — no design jargon */
  idea: string;
}

export interface ScreenDef {
  id: string;
  surface: Surface;
  name: string;
  purpose: string;
  /** Priority screens appear in presentation mode */
  priority: boolean;
  /** Screens rendered in phone frames by default */
  mobileFirst?: boolean;
  variants: ScreenVariant[];
  /** Gentle prompt for review mode */
  prompt: string;
}

function v(screenId: string, key: 'v1' | 'v2', name: string, idea: string): ScreenVariant {
  return { id: `${screenId}@${key}`, key, name, idea };
}

function screen(
  id: string,
  surface: Surface,
  name: string,
  purpose: string,
  prompt: string,
  variants: [string, string][],
  opts: { priority?: boolean; mobileFirst?: boolean } = {},
): ScreenDef {
  return {
    id,
    surface,
    name,
    purpose,
    prompt,
    priority: opts.priority ?? false,
    mobileFirst: opts.mobileFirst,
    variants: variants.map(([n, idea], i) => v(id, i === 0 ? 'v1' : 'v2', n, idea)),
  };
}

export const screens: ScreenDef[] = [
  // ——— Public website ———
  screen('public.home', 'public', 'Homepage', 'The first impression: what ADEQUATE is and who LG is.',
    'What would you want someone to feel in the first five seconds?',
    [
      ['Threshold', 'One big statement fills the screen, then the story unfolds as you scroll.'],
      ['Chapters', 'The founder and the message share the screen, with a clear menu of ways in (listen, read, try).'],
    ], { priority: true }),
  screen('public.story', 'public', 'Founder story', 'LG’s story and manifesto in his own words (once approved).',
    'Which one feels more like the way you tell your story?',
    [
      ['Long letter', 'A single, beautifully set long read — like a letter — with notes in the margins.'],
      ['Moments', 'The story told as a series of moments along a line, each with room for a recording.'],
    ], { priority: true }),
  screen('public.principle', 'public', 'The Adequacy Principle', 'The philosophy, explained simply.',
    'Which one explains the idea the way you would explain it to a friend?',
    [
      ['Geometry of Growth', 'An interactive picture of circles: tap each ring to read one idea.'],
      ['Plainly stated', 'Numbered ideas written as plain questions and answers.'],
    ], { priority: true }),
  screen('public.tools', 'public', 'Tool showcase', 'Preview of the member experiences.',
    'Which way makes the tools feel most inviting rather than like homework?',
    [
      ['Gallery', 'Pick a tool from a list and see it come to life on a phone.'],
      ['A day with ADEQUATE', 'Follow one gentle day from morning check-in to evening reflection.'],
    ]),
  screen('public.listen', 'public', 'Listening room', 'LG’s recordings and reflections (placeholders only).',
    'Which one feels closer to sitting in the room while you speak?',
    [
      ['One voice', 'A single focused player, nothing else on screen.'],
      ['The wall', 'A wall of recordings to browse, like an album collection.'],
    ], { priority: true }),
  screen('public.library', 'public', 'Library & book', 'A preview of LG’s first book and essays.',
    'Which one makes you want to keep reading?',
    [
      ['Open book', 'An open book you can turn the pages of.'],
      ['The shelf', 'A shelf of titles with a chapter list beside it.'],
    ]),
  screen('public.together', 'public', 'Workshops & circles', 'Preview of workshops and community.',
    'What would make someone feel safe joining?',
    [
      ['Calendar', 'Upcoming circles and workshops listed by date.'],
      ['How a circle works', 'Three simple steps showing what happens when you join.'],
    ]),
  screen('public.membership', 'public', 'Membership', 'Free / Plus / Circle — shown honestly. No purchasing.',
    'Does this feel honest and generous? Does anything feel like pressure?',
    [
      ['Side by side', 'Three plans in columns, compared line by line.'],
      ['Free first', 'What is free forever comes first; upgrades are offered as a gentle ladder below.'],
    ], { priority: true }),
  screen('public.faq', 'public', 'Questions', 'Frequently asked questions.',
    'Which one feels more like a conversation?',
    [
      ['Accordion', 'Questions you can open one at a time.'],
      ['Conversation', 'Questions and answers laid out like a printed interview.'],
    ]),
  screen('public.about', 'public', 'About & contact', 'About ADEQUATE and how to reach out.',
    'How personal should reaching out feel?',
    [
      ['Simple form', 'A short form beside the essentials.'],
      ['Write a letter', 'Reaching out framed as writing a letter.'],
    ]),
  screen('public.privacy', 'public', 'Privacy & accessibility', 'Placeholder for policies — to be written with legal review.',
    'Is this clear enough for anyone to understand?',
    [['Plain promises', 'Short, plain promises first; the full policy below (placeholder).']]),

  // ——— Member web + app ———
  screen('member.today', 'member', 'Today', 'The daily check-in and home base.',
    'What should someone feel when they open this every morning?',
    [
      ['One question', 'The whole screen asks one gentle question. Nothing else competes.'],
      ['Home base', 'A calm overview: today’s question, a recording, your path, your circle.'],
    ], { priority: true, mobileFirst: true }),
  screen('member.mirror', 'member', 'Adequacy Mirror', 'Reflect on strengths, assumptions and choices.',
    'Which one helps someone see themselves more kindly?',
    [
      ['Three panes', 'Strengths, assumptions, and choices side by side.'],
      ['Unfolding cards', 'One card at a time unfolds, like turning over a letter.'],
    ], { priority: true, mobileFirst: true }),
  screen('member.pathways', 'member', 'Pathways', 'Explore a decision without being told what to do.',
    'Which one makes a hard choice feel lighter?',
    [
      ['Branches', 'Options grow like branches from where you stand now.'],
      ['Side by side', 'Two or three options compared in honest columns.'],
    ], { priority: true, mobileFirst: true }),
  screen('member.voice', 'member', 'Voice to Purpose', 'Speak a reflection; turn it into a chosen action. (Demo only — no recording or AI.)',
    'Would you feel comfortable speaking here?',
    [
      ['Speak', 'One large button to speak, with sound rings as you talk (simulated).'],
      ['Prompted', 'A prompt to answer, by voice or typing, with a quiet place to write.'],
    ], { mobileFirst: true }),
  screen('member.book', 'member', 'Living Book', 'Read with notes and exercises woven in.',
    'Which one feels more like reading your book with you nearby?',
    [
      ['Margins', 'Reading with notes in the margins.'],
      ['Exercise inline', 'Short exercises appear inside the chapter at the right moment.'],
    ], { mobileFirst: true }),
  screen('member.convergence', 'member', 'Convergence', 'See patterns over time; keep what happened separate from what it might mean.',
    'Does this feel like discovery, or like being analysed?',
    [
      ['Timeline', 'Two lanes over time: what happened, and what you think it means.'],
      ['Constellation', 'Your reflections as stars, with repeating themes connected.'],
    ], { priority: true, mobileFirst: true }),
  screen('member.together', 'member', 'Adequate Together', 'Optional, moderated community. Demo only — no real messaging.',
    'What would make this feel kind and safe?',
    [
      ['Circles', 'A list of small circles you can choose to join.'],
      ['The room', 'Inside one small circle, with a host and today’s prompt.'],
    ], { mobileFirst: true }),
  screen('member.profile', 'member', 'Profile & history', 'Your journey so far and your data.',
    'Does this feel like your story or like a scoreboard?',
    [['Journal history', 'Your reflections as a calm journal, with clear controls for your data.']], { mobileFirst: true }),
  screen('member.preferences', 'member', 'Notifications & preferences', 'Gentle reminders you control.',
    'Do these choices feel respectful?',
    [['Gentle controls', 'Plain switches, quiet defaults, no streaks.']], { mobileFirst: true }),
  screen('member.onboarding', 'member', 'Welcome', 'First-time welcome.',
    'What is the first thing someone should hear from ADEQUATE?',
    [
      ['Three steps', 'Three short welcome pages.'],
      ['One conversation', 'A single unhurried question-and-answer welcome.'],
    ], { priority: true, mobileFirst: true }),

  // ——— Founder Studio ———
  screen('founder.capture', 'founder', 'Idea capture', 'Capture an idea by voice or writing (mockup).',
    'Which one feels easiest when an idea arrives?',
    [
      ['Microphone', 'A big, calm button to speak an idea.'],
      ['Notebook', 'An open notebook page, with voice as a secondary option.'],
    ], { priority: true }),
  screen('founder.transcript', 'founder', 'Words & meaning', 'Your exact words kept separate from any interpretation.',
    'Is it clear which words are yours and which are someone else’s reading of them?',
    [
      ['Side by side', 'Your exact words on the left; interpretation on the right.'],
      ['Highlights', 'Your words with highlighted phrases that open into interpretations.'],
    ], { priority: true }),
  screen('founder.concepts', 'founder', 'Idea clusters', 'Ideas grouped into themes with possible uses.',
    'Do these groupings feel true to what you meant?',
    [['Cluster board', 'Idea cards grouped into themes, each with possible places it could show up.']]),
  screen('founder.proposals', 'founder', 'Proposal board', 'Review proposals with gentle questions; approve explicitly.',
    'Do you feel free to say no here?',
    [
      ['Board', 'All proposals in columns: new, discussing, yes, not now.'],
      ['One at a time', 'One proposal at a time, with a gentle question and clear choices.'],
    ], { priority: true }),
  screen('founder.timeline', 'founder', 'Provenance timeline', 'Every idea’s journey from your voice to the product.',
    'Can you follow where every idea came from?',
    [['Timeline', 'A dated line from recording → words → proposal → approval.']]),

  // ——— Developer review ———
  screen('dev.intake', 'developer', 'Proposal intake', 'Structured proposals with provenance and acceptance criteria.',
    'Does the engineer have what they need without losing LG’s intent?',
    [['Structured list', 'Proposals with source, status, affected surfaces and criteria.']]),
  screen('dev.compare', 'developer', 'Preview & impact', 'Compare previews and see which surfaces a change touches.',
    'Is the impact of a decision clear?',
    [['Impact map', 'Before/after previews with a map of affected surfaces.']]),
  screen('dev.status', 'developer', 'Status & export', 'Approval status and handoff exports.',
    'Is it obvious what is approved and what is still open?',
    [['Status ledger', 'Every decision’s status with export buttons (mockup).']]),
];

export const screenById = Object.fromEntries(screens.map((s) => [s.id, s])) as Record<string, ScreenDef>;

export const surfaces: { id: Surface; name: string; description: string }[] = [
  { id: 'public', name: 'Public website', description: 'What visitors see.' },
  { id: 'member', name: 'Member app', description: 'Web and phone experience for members.' },
  { id: 'founder', name: 'Founder Studio', description: 'LG’s private space for ideas and approvals.' },
  { id: 'developer', name: 'Developer review', description: 'The engineer’s structured view.' },
];
