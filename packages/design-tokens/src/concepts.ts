import type { ConceptSystem } from './types';

/**
 * Three genuinely distinct design directions for ADEQUATE.
 * All copy here describes design intent; it is not LG's voice and not public marketing copy.
 */

export const goldenHuman: ConceptSystem = {
  id: 'golden-human',
  letter: 'A',
  name: 'The Golden Human',
  tagline: 'Warm paper, honest ink, a little sunlight.',
  positioning:
    'An intimate, editorial home for a human voice. ADEQUATE as a beautifully made book you can live inside — tactile, unhurried, personal.',
  emotionalPromise: 'You are seen as a whole person, already enough, and gently invited to grow.',
  descriptors: ['Warm', 'Intimate', 'Tactile', 'Journal-like', 'Sunlit'],
  defaultMode: 'light',
  color: {
    light: {
      bg: '#F5EEDF',
      surface: '#FBF7EE',
      surfaceAlt: '#EEE3CD',
      ink: '#2A211B',
      inkMuted: '#5E4F41',
      accent: '#A97A27',
      onAccent: '#1E160F',
      accentText: '#80591A',
      accent2: '#8C3B2A',
      line: '#D6C6A8',
      focus: '#6E4410',
    },
    dark: {
      bg: '#1B1612',
      surface: '#241E18',
      surfaceAlt: '#2E261F',
      ink: '#F3EADB',
      inkMuted: '#C2B29C',
      accent: '#E0B45A',
      onAccent: '#1B1612',
      accentText: '#E8C27A',
      accent2: '#E79A82',
      line: '#41372C',
      focus: '#F2CF83',
    },
  },
  typography: {
    display: {
      family: 'Fraunces',
      fallback: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
      native: { ios: 'Georgia', android: 'serif' },
      weights: [300, 400, 600],
      usage: 'Headlines, pull lines, chapter numerals. Optical softness; italics for emphasis.',
    },
    body: {
      family: 'Source Serif 4',
      fallback: 'Georgia, "Times New Roman", serif',
      native: { ios: 'Georgia', android: 'serif' },
      weights: [400, 600],
      usage: 'Long-form reading, interface text, journal entries.',
    },
    accent: {
      family: 'Caveat',
      fallback: '"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive',
      native: { ios: 'Snell Roundhand', android: 'casual' },
      weights: [400, 600],
      usage: 'Handwritten marginalia, member annotations. Never for essential information.',
    },
    scale: [13, 15, 17, 20, 25, 32, 44, 60, 84],
    lineHeight: { tight: 1.08, body: 1.6, loose: 1.8 },
    displayTracking: '-0.015em',
    displayCase: 'none',
    pairingRationale:
      'A soft, high-contrast display serif over a sturdy reading serif feels like a well-set book; handwritten marginalia makes the page feel lived-in.',
  },
  spacing: [4, 8, 12, 20, 32, 52, 84, 136],
  grid: {
    maxWidth: 1200,
    columns: { desktop: 12, tablet: 8, mobile: 4 },
    gutter: { desktop: 32, tablet: 24, mobile: 16 },
    margin: { desktop: 84, tablet: 52, mobile: 20 },
    note: 'Asymmetric book grid: a reading column of 7/12 with a 3/12 margin column for notes and images.',
  },
  radii: { sm: 6, md: 14, lg: 28, pill: 999 },
  borderWidth: 1,
  iconography:
    'Fine 1.25px line icons with rounded terminals, drawn like pen strokes; a small sun/halo glyph as the brand mark.',
  imagery:
    'Natural-light portraiture with warm shadows, hands, paper, windows. Until LG approves real imagery: a deliberate framed portrait placeholder with soft light, never a fabricated likeness.',
  motion: {
    language: 'Unhurried and paper-like: fades with a slight rise, pages that turn, ink that writes itself on.',
    easing: {
      standard: 'cubic-bezier(.25,.1,.25,1)',
      enter: 'cubic-bezier(.16,1,.3,1)',
      exit: 'cubic-bezier(.7,0,.84,0)',
      expressive: 'cubic-bezier(.34,1.3,.64,1)',
    },
    durations: { instant: 80, quick: 180, base: 320, slow: 600, cinematic: 1200 },
    reducedMotion: 'Replace rises and page turns with plain opacity crossfades under 200ms.',
  },
  soundVisualization:
    'A warm, soft-edged waveform drawn like a pencil line across paper; playback progress fills in gold ink.',
  components: [
    { id: 'card', name: 'Journal card', anatomy: 'Paper surface · 14px radius · hairline border · date set in small caps · handwritten note slot in the margin.' },
    { id: 'button', name: 'Button', anatomy: 'Pill, ink fill with ivory text; secondary is an underlined text link with a gold rule.' },
    { id: 'nav', name: 'Navigation', anatomy: 'Web: centered wordmark with quiet text links. Mobile: bottom bar with 4 pen-line icons and labels.' },
    { id: 'player', name: 'Audio player', anatomy: 'Round play button with gold ring, pencil waveform, time in old-style numerals.' },
  ],
  copyTone: 'Warm, plain, second-person, short sentences. Sounds like a kind letter, never a coach shouting.',
  signatureMoments: [
    { id: 'sunrise', title: 'Sunrise reveal', description: 'The homepage opens on a warm light that slowly blooms behind the headline as the words set themselves.' },
    { id: 'marginalia', title: 'Living marginalia', description: 'Members can leave handwritten-style notes in the margins of the Living Book and their own reflections.' },
    { id: 'page-turn', title: 'Page turn', description: 'Moving between days, chapters, or reflections turns a page instead of sliding a screen.' },
  ],
  risks: ['Could feel too quiet or traditional for younger audiences.', 'Serif-heavy UI needs care at small sizes on Android.'],
};

export const resonanceAtlas: ConceptSystem = {
  id: 'resonance-atlas',
  letter: 'B',
  name: 'The Resonance Atlas',
  tagline: 'Every voice is a constellation.',
  positioning:
    'A night-sky instrument for meaning. ADEQUATE as an atlas of resonance — precise, musical, mysterious, revealing patterns in a life.',
  emotionalPromise: 'There is a pattern in you worth discovering, and you can navigate by it.',
  descriptors: ['Nocturnal', 'Precise', 'Musical', 'Revelatory', 'Spacious'],
  defaultMode: 'dark',
  color: {
    dark: {
      bg: '#0A0D16',
      surface: '#11172A',
      surfaceAlt: '#182036',
      ink: '#ECE8DF',
      inkMuted: '#A3A9BC',
      accent: '#F2A93B',
      onAccent: '#140D02',
      accentText: '#F5BA61',
      accent2: '#7CCFC4',
      line: '#28324D',
      focus: '#FFD08A',
    },
    light: {
      bg: '#EEF0F5',
      surface: '#FFFFFF',
      surfaceAlt: '#E2E6EF',
      ink: '#0E1322',
      inkMuted: '#47506A',
      accent: '#C27410',
      onAccent: '#140D02',
      accentText: '#94560A',
      accent2: '#1F7A70',
      line: '#C6CCDA',
      focus: '#8A4B00',
    },
  },
  typography: {
    display: {
      family: 'Space Grotesk',
      fallback: '"Avenir Next", Futura, "Segoe UI", system-ui, sans-serif',
      native: { ios: 'Avenir Next', android: 'sans-serif-medium' },
      weights: [300, 500, 700],
      usage: 'Headlines and numerals. Light weight at large sizes, medium for UI headings.',
    },
    body: {
      family: 'Space Grotesk',
      fallback: '"Avenir Next", "Segoe UI", system-ui, sans-serif',
      native: { ios: 'Avenir Next', android: 'sans-serif' },
      weights: [400, 500],
      usage: 'Interface and reading text.',
    },
    accent: {
      family: 'IBM Plex Mono',
      fallback: '"SF Mono", Menlo, Consolas, ui-monospace, monospace',
      native: { ios: 'Menlo', android: 'monospace' },
      weights: [400, 500],
      usage: 'Coordinates, labels, timestamps, diagram annotations — the "instrument readout" voice.',
    },
    scale: [12, 14, 16, 19, 23, 30, 40, 56, 76],
    lineHeight: { tight: 1.05, body: 1.55, loose: 1.75 },
    displayTracking: '-0.02em',
    displayCase: 'none',
    pairingRationale:
      'A geometric grotesk with quirky details reads as precise but human; monospace annotations make every screen feel like a well-labelled star chart.',
  },
  spacing: [4, 8, 16, 24, 32, 48, 64, 96],
  grid: {
    maxWidth: 1280,
    columns: { desktop: 12, tablet: 8, mobile: 4 },
    gutter: { desktop: 24, tablet: 20, mobile: 16 },
    margin: { desktop: 64, tablet: 40, mobile: 16 },
    note: 'Strict 8pt grid with a visible hairline coordinate system on hero and diagram surfaces.',
  },
  radii: { sm: 2, md: 4, lg: 10, pill: 999 },
  borderWidth: 1,
  iconography:
    'Geometric 1.5px icons built from circles, arcs and nodes; a ring-and-node mark suggesting orbit and resonance.',
  imagery:
    'Low-light portraiture rim-lit in amber, long exposures, star fields, oscilloscopes. Diagrams are first-class imagery. Portrait slot is a ringed placeholder until real imagery is approved.',
  motion: {
    language: 'Orbital and rhythmic: elements settle into place on gentle arcs, rings pulse on the beat, lines draw themselves.',
    easing: {
      standard: 'cubic-bezier(.4,0,.2,1)',
      enter: 'cubic-bezier(.05,.7,.1,1)',
      exit: 'cubic-bezier(.3,0,.8,.15)',
      expressive: 'cubic-bezier(.2,.9,.25,1.15)',
    },
    durations: { instant: 60, quick: 160, base: 280, slow: 520, cinematic: 1600 },
    reducedMotion: 'Freeze orbits and pulses; keep only instant state changes and static diagrams.',
  },
  soundVisualization:
    'Concentric resonance rings and a spectral line that splits into amber and teal harmonics; time is shown as an orbit, not a bar.',
  components: [
    { id: 'card', name: 'Instrument panel', anatomy: 'Midnight surface · 4px radius · hairline border · mono label top-left with coordinate, corner tick marks.' },
    { id: 'button', name: 'Button', anatomy: 'Amber fill with dark text and a subtle glow; secondary is an outlined pill with mono label.' },
    { id: 'nav', name: 'Navigation', anatomy: 'Web: left-aligned ring mark, mono section indices (01–06). Mobile: bottom bar with orbit indicator above the active tab.' },
    { id: 'player', name: 'Audio player', anatomy: 'Circular orbit scrubber around a ring of spectral bars; timestamps in mono.' },
  ],
  copyTone: 'Clear, curious, slightly poetic; short declaratives with precise nouns. Labels speak like an instrument.',
  signatureMoments: [
    { id: 'constellation', title: 'Your constellation', description: 'Reflections become stars; recurring themes connect into a personal constellation in Convergence.' },
    { id: 'resonance-rings', title: 'Resonance rings', description: 'Voice and audio are shown as rings that expand and harmonize, never as fabricated speech.' },
    { id: 'coordinates', title: 'Present-moment coordinate', description: 'Today opens on a coordinate readout — "You are here" — anchoring agency in the present.' },
  ],
  risks: ['Dark-first can feel cold if diagrams dominate the human story.', 'Diagrams must never read as scientific proof.'],
};

export const livingManifesto: ConceptSystem = {
  id: 'living-manifesto',
  letter: 'C',
  name: 'The Living Manifesto',
  tagline: 'Say it loud. Mean it gently.',
  positioning:
    'A bold, spoken-word poster come alive. ADEQUATE as a movement of words — raw, rhythmic, high-contrast, impossible to ignore, still humane.',
  emotionalPromise: 'Your worth is not up for debate. Now — what will you do with today?',
  descriptors: ['Bold', 'Rhythmic', 'Raw', 'Urgent', 'Humane'],
  defaultMode: 'light',
  color: {
    light: {
      bg: '#F3F1EC',
      surface: '#FFFFFF',
      surfaceAlt: '#E6E3DC',
      ink: '#0B0B0B',
      inkMuted: '#3F3F3F',
      accent: '#2B3BFF',
      onAccent: '#FFFFFF',
      accentText: '#2433E0',
      accent2: '#0B0B0B',
      line: '#0B0B0B',
      focus: '#2B3BFF',
    },
    dark: {
      bg: '#0B0B0B',
      surface: '#151515',
      surfaceAlt: '#202020',
      ink: '#F3F1EC',
      inkMuted: '#BDBAB3',
      accent: '#6F7BFF',
      onAccent: '#0B0B0B',
      accentText: '#8F98FF',
      accent2: '#F3F1EC',
      line: '#F3F1EC',
      focus: '#8F98FF',
    },
  },
  typography: {
    display: {
      family: 'Anton',
      fallback: 'Impact, Haettenschweiler, "Arial Narrow Bold", "Franklin Gothic Condensed", sans-serif',
      native: { ios: 'Futura-CondensedExtraBold', android: 'sans-serif-condensed' },
      weights: [400],
      usage: 'Massive uppercase statements, line-by-line like spoken word. Never for body text.',
    },
    body: {
      family: 'Archivo',
      fallback: '"Helvetica Neue", Arial, system-ui, sans-serif',
      native: { ios: 'Helvetica Neue', android: 'sans-serif' },
      weights: [400, 600, 800],
      usage: 'Interface, reading, and labels; heavy weight for stamps and tags.',
    },
    accent: {
      family: 'Archivo',
      fallback: '"Helvetica Neue", Arial, system-ui, sans-serif',
      native: { ios: 'Helvetica Neue', android: 'sans-serif' },
      weights: [800],
      usage: 'All-caps stamps, counters, marquee ribbons.',
    },
    scale: [12, 14, 16, 20, 28, 40, 64, 96, 144],
    lineHeight: { tight: 0.92, body: 1.5, loose: 1.7 },
    displayTracking: '0',
    displayCase: 'uppercase',
    pairingRationale:
      'A tall condensed poster face delivers lines the way a performer delivers a stanza; a sturdy grotesk keeps everything else legible and calm.',
  },
  spacing: [6, 12, 18, 24, 48, 72, 96, 192],
  grid: {
    maxWidth: 1440,
    columns: { desktop: 12, tablet: 6, mobile: 2 },
    gutter: { desktop: 12, tablet: 12, mobile: 12 },
    margin: { desktop: 24, tablet: 24, mobile: 12 },
    note: 'Full-bleed poster grid with tight gutters; type is allowed to touch the edges, content blocks snap hard to columns.',
  },
  radii: { sm: 0, md: 0, lg: 0, pill: 0 },
  borderWidth: 2,
  iconography: 'Heavy 2.5px square-cap icons and typographic glyphs (→ ✕ ○ ■); arrows do a lot of work.',
  imagery:
    'High-contrast black-and-white documentary photography, grain, performance stills, hand-lettered signs. Portrait slot is a stark halftone placeholder until real imagery is approved.',
  motion: {
    language: 'Kinetic but controlled: words slam in line by line on the beat, marquees drift, hard cuts instead of soft fades.',
    easing: {
      standard: 'cubic-bezier(.2,0,0,1)',
      enter: 'cubic-bezier(.8,0,.2,1)',
      exit: 'cubic-bezier(.8,0,1,1)',
      expressive: 'steps(6, end)',
    },
    durations: { instant: 40, quick: 120, base: 220, slow: 420, cinematic: 900 },
    reducedMotion: 'Stop marquees and line-slams; show complete statements immediately with a static accent underline.',
  },
  soundVisualization:
    'Hard-edged vertical bars like a VU meter printed in ink; the electric accent sweeps across as the line is "spoken".',
  components: [
    { id: 'card', name: 'Poster block', anatomy: 'No radius · 2px ink border · oversized index number · stamp-style tag in the corner.' },
    { id: 'button', name: 'Button', anatomy: 'Square, ink fill, uppercase heavy label with → arrow; hover shifts the block 4px with an offset accent shadow.' },
    { id: 'nav', name: 'Navigation', anatomy: 'Web: oversized wordmark bar with a scrolling marquee strip. Mobile: full-screen menu overlay with giant links.' },
    { id: 'player', name: 'Audio player', anatomy: 'Wide rectangular block with VU bars, giant timestamp, square play control.' },
  ],
  copyTone: 'Direct, rhythmic, spoken-word cadence. Short lines, repetition, imperatives aimed at choice — never at shame.',
  signatureMoments: [
    { id: 'line-slam', title: 'Line by line', description: 'The manifesto arrives one line at a time like a live performance, timed to a silent beat.' },
    { id: 'marquee', title: 'Living marquee', description: 'A ribbon of the ADEQUATE expansion drifts across the site — Always Remember, Everyone Is Adequate.' },
    { id: 'stamp', title: 'The stamp', description: 'Choosing a path or finishing a reflection stamps "CHOSEN" — a celebration of agency, not a score.' },
  ],
  risks: ['Volume can tip into aggression if copy is not humane.', 'Condensed caps reduce readability; restrict to short statements.'],
};

export const concepts: ConceptSystem[] = [goldenHuman, resonanceAtlas, livingManifesto];

export const conceptById = Object.fromEntries(concepts.map((c) => [c.id, c])) as Record<
  ConceptSystem['id'],
  ConceptSystem
>;
