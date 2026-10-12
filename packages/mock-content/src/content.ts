/**
 * ALL copy in this file is CONCEPT COPY written for design review.
 * None of it is a quotation from LG. Nothing here may be published without LG's approval.
 */

export type Provenance =
  | 'concept-copy' // written for the mockup, not LG's words
  | 'placeholder' // stands in for content LG must supply
  | 'lg-verified' // exact words supplied by LG (none exist yet in this prototype)
  | 'synthetic-data'; // invented member data for demonstration

export const provenanceLabels: Record<Provenance, string> = {
  'concept-copy': 'Concept copy — not LG’s words',
  placeholder: 'Placeholder — LG to supply',
  'lg-verified': 'LG’s exact words (verified)',
  'synthetic-data': 'Synthetic demo data',
};

export const brand = {
  name: 'ADEQUATE',
  expansion: 'Always Remember, Everyone Is Adequate',
  expansionWords: ['Always', 'Remember', 'Everyone', 'Is', 'Adequate'],
  founder: 'LG',
  founderNameNote: 'Placeholder: LG’s legal/brand name and public biography are pending confirmation.',
};

export interface NomenclatureTerm {
  id: string;
  term: string;
  meaning: string;
}

/** Editable in the review board. These are metaphors, not proven mathematics. */
export const nomenclature: NomenclatureTerm[] = [
  { id: 'term.principle', term: 'The Adequacy Principle', meaning: 'Your worth comes first; growth is something you choose, not something you owe.' },
  { id: 'term.geometry', term: 'Geometry of Growth', meaning: 'A picture of growth as widening circles from a steady centre.' },
  { id: 'term.fields', term: 'Possibility Fields', meaning: 'The space of choices open to you right now.' },
  { id: 'term.architecture', term: 'Architecture of Becoming', meaning: 'How small chosen actions build a life over time.' },
  { id: 'term.present', term: 'Present Moment', meaning: 'The only place where choosing happens.' },
  { id: 'term.resonance', term: 'Resonance', meaning: 'When an idea or a voice rings true for you.' },
  { id: 'term.paths', term: 'Paths', meaning: 'Options you explore without being told which is right.' },
  { id: 'term.reflections', term: 'Reflections', meaning: 'What you notice when you pause.' },
  { id: 'term.circles', term: 'Circles', meaning: 'Small, hosted groups that meet with care.' },
];

export const copy = {
  heroLines: ['You are already', 'enough.', 'Now, choose', 'what’s next.'],
  heroLead:
    'ADEQUATE is a place to remember your worth — and to grow from it, not toward it. Reflections, recordings and gentle tools for the present moment.',
  manifesto: [
    'You do not have to earn your place here.',
    'Accepting yourself is not the end of change.',
    'It is where change can begin.',
    'The past is a teacher. The future is a question.',
    'The present is where you get to choose.',
  ],
  principles: [
    { n: '01', title: 'Worth comes first', body: 'Nothing you do adds to or takes away from your worth. It is the ground you stand on.' },
    { n: '02', title: 'Acceptance allows change', body: 'Seeing yourself clearly and kindly makes honest change possible.' },
    { n: '03', title: 'The present is where you act', body: 'The past gives context, the future gives direction, but choosing happens now.' },
    { n: '04', title: 'Responsibility without shame', body: 'You can own your choices without measuring your value by them.' },
    { n: '05', title: 'Growth is yours to define', body: 'No streaks, no scores. You decide what a good next step looks like.' },
  ],
  storyMoments: [
    { year: '—', title: 'Placeholder: an early memory', body: 'LG to supply. This is where a formative moment from his own story would live, in his own words.' },
    { year: '—', title: 'Placeholder: finding his voice', body: 'LG to supply. Spoken word, music, and the first time words changed a room.' },
    { year: '—', title: 'Placeholder: faith and meaning', body: 'LG to supply, if he chooses. His personal faith may be part of his story; member tools stay open to every belief.' },
    { year: '—', title: 'Placeholder: why ADEQUATE', body: 'LG to supply. The moment the idea of adequacy became a mission.' },
  ],
  tools: [
    { id: 'today', name: 'Today', line: 'One gentle question to start the day.' },
    { id: 'mirror', name: 'Adequacy Mirror', line: 'See your strengths, assumptions and choices kindly.' },
    { id: 'pathways', name: 'Pathways', line: 'Explore a decision without being told what to do.' },
    { id: 'voice', name: 'Voice to Purpose', line: 'Speak it out loud. Choose one thing to do.' },
    { id: 'book', name: 'Living Book', line: 'Read with notes and exercises woven in.' },
    { id: 'convergence', name: 'Convergence', line: 'Notice patterns — keep facts and meanings separate.' },
    { id: 'together', name: 'Adequate Together', line: 'Small hosted circles, if and when you want them.' },
  ],
  recordings: [
    { id: 'rec-1', title: 'Placeholder recording · On being enough', length: '6:12' },
    { id: 'rec-2', title: 'Placeholder recording · The present tense', length: '4:48' },
    { id: 'rec-3', title: 'Placeholder recording · Choosing again', length: '8:03' },
    { id: 'rec-4', title: 'Placeholder recording · Room to grow', length: '5:21' },
    { id: 'rec-5', title: 'Placeholder recording · Threshold', length: '3:57' },
    { id: 'rec-6', title: 'Placeholder recording · Resonance', length: '7:30' },
  ],
  book: {
    title: 'Placeholder: LG’s first book',
    subtitle: 'Working title to be chosen by LG',
    chapters: ['Before anything else', 'The ground you stand on', 'What acceptance is not', 'The present tense', 'Paths, not verdicts', 'Becoming, together'],
    excerpt:
      'Concept excerpt for layout only. Imagine a sentence that stops you for a moment — not because it tells you what to do, but because it reminds you of something you already knew. This page will hold LG’s words once they are written and approved.',
  },
  tiers: [
    {
      id: 'free', name: 'Free', price: '$0', cadence: 'forever',
      line: 'The heart of ADEQUATE, always free.',
      features: ['Daily reflection', 'Selected recordings', 'Basic journal', 'Adequacy Mirror (core)'],
    },
    {
      id: 'plus', name: 'Plus', price: '$8', cadence: 'per month · proposed',
      line: 'Deeper tools and your full history.',
      features: ['Everything in Free', 'Saved history & Convergence', 'Voice to Purpose', 'Premium programs'],
    },
    {
      id: 'circle', name: 'Circle', price: '$19', cadence: 'per month · proposed',
      line: 'Grow alongside others.',
      features: ['Everything in Plus', 'Hosted circles', 'Live workshops', 'Community programming'],
    },
  ],
  hardship: 'Hardship access available — no one is turned away from the basics. (Concept; policy to be defined.)',
  faqs: [
    { q: 'Is ADEQUATE therapy?', a: 'No. ADEQUATE offers reflection and personal-development tools. It is not a substitute for professional care. If you are struggling, please reach out to a qualified professional or local support line.' },
    { q: 'Do I need to share LG’s beliefs?', a: 'No. LG’s own story may include his faith, but every member tool is designed to welcome people of any belief or none.' },
    { q: 'Is my worth measured anywhere?', a: 'Never. There are no scores, streaks or rankings of people.' },
    { q: 'What is free?', a: 'Daily reflection, selected recordings, a basic journal and the core Adequacy Mirror. Basic affirmation of worth is never behind a paywall.' },
    { q: 'Does ADEQUATE use AI?', a: 'Not in this prototype. Any future use would be clearly labelled, optional, and never pretend to be LG.' },
    { q: 'Is ADEQUATE a nonprofit?', a: 'Legal status is still being confirmed. We will not describe it as a nonprofit until that is verified.' },
  ],
  members: {
    name: 'Jordan',
    note: 'Synthetic member — not a real person.',
    todayQuestion: 'What is one thing that is already true about you today, before you do anything at all?',
    strengths: ['Patient with others', 'Keeps showing up', 'Notices small things'],
    assumptions: ['I have to finish everything to rest', 'Asking for help is a burden'],
    choices: ['Ask one person for help this week', 'Rest before the list is done'],
    pathOptions: [
      { title: 'Stay and reshape', notes: ['Keeps what works', 'Needs one hard conversation'] },
      { title: 'Step into something new', notes: ['Exciting and uncertain', 'Asks for courage now'] },
      { title: 'Pause and gather', notes: ['Gives time to listen', 'Not a failure — a choice'] },
    ],
    reflections: [
      { date: 'Mon', fact: 'Spoke up in the team meeting.', meaning: 'Maybe my voice matters more than I think.' },
      { date: 'Wed', fact: 'Took a walk instead of working late.', meaning: 'Rest might be part of the work.' },
      { date: 'Thu', fact: 'Called my sister back.', meaning: 'I want to be someone who stays close.' },
      { date: 'Sat', fact: 'Started the book again.', meaning: 'I can begin again without starting over.' },
    ],
    themes: ['Voice', 'Rest', 'Closeness', 'Beginning again'],
    circles: [
      { name: 'Morning Circle', host: 'Host (placeholder)', size: '8 of 12', time: 'Tue · 7:30am' },
      { name: 'Beginning Again', host: 'Host (placeholder)', size: '5 of 10', time: 'Thu · 6:00pm' },
      { name: 'Quiet Strength', host: 'Host (placeholder)', size: '10 of 12', time: 'Sun · 4:00pm' },
    ],
    circleNotes: [
      { who: 'A member', text: 'I rested today without earning it first. Strange and good.' },
      { who: 'A member', text: 'Asked for help at work. Nobody thought less of me.' },
    ],
  },
  founderStudio: {
    capturedIdea:
      'Placeholder transcript. In the real Studio, this would be LG’s exact recorded words, transcribed and kept unchanged. No transcript of LG exists in this prototype.',
    interpretations: [
      { id: 'int-1', text: 'Possible reading: worth is the starting point, not the reward.', status: 'needs LG review' },
      { id: 'int-2', text: 'Possible reading: the present moment as the only place choice happens.', status: 'needs LG review' },
    ],
    clusters: [
      { theme: 'Worth before work', ideas: ['Starting point, not reward', 'No scores of people'], uses: ['Homepage line', 'Onboarding'] },
      { theme: 'The present tense', ideas: ['Choice lives now', 'Past as teacher'], uses: ['Today screen', 'Recording series'] },
      { theme: 'Growing together', ideas: ['Circles with care', 'Hosts, not gurus'], uses: ['Community', 'Workshops'] },
    ],
    proposals: [
      { id: 'prop-001', title: 'Open the app with one question, not a dashboard', column: 'new' },
      { id: 'prop-002', title: 'Show voice as rings, never as fake speech', column: 'discussing' },
      { id: 'prop-003', title: 'Keep basic reflection free forever', column: 'yes' },
      { id: 'prop-004', title: 'Weekly recap email', column: 'not-now' },
    ],
  },
};

export const footerNote = 'Design prototype · concept copy and synthetic data only · nothing here is live';
