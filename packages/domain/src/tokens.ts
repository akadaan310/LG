export const approvedTokens = {
  dark:{bg:'#0A0D16',surface:'#11172A',surfaceAlt:'#182036',ink:'#ECE8DF',inkMuted:'#A3A9BC',accent:'#F2A93B',onAccent:'#140D02',accentText:'#F5BA61',accent2:'#7CCFC4',line:'#28324D',focus:'#FFD08A'},
  light:{bg:'#EEF0F5',surface:'#FFFFFF',surfaceAlt:'#E2E6EF',ink:'#0E1322',inkMuted:'#47506A',accent:'#C27410',onAccent:'#140D02',accentText:'#94560A',accent2:'#1F7A70',line:'#C6CCDA',focus:'#8A4B00'},
  displayFont:'Space Grotesk',bodyFont:'Space Grotesk',accentFont:'IBM Plex Mono',
  scale:[12,14,16,19,23,30,40,56,76],
} as const;

export const approvalManifest = {
  source:'docs/source/ADEQUATE_CODEX_FULL_ENGINEERING_DIRECTIVE.md',
  exportProvenance:'pending',
  slots:{opening:'resonance-atlas',typography:'resonance-atlas',palette:'resonance-atlas',symbols:'resonance-atlas',today:'resonance-atlas',sound:'resonance-atlas',navigation:'living-manifesto',reflectionCards:'living-manifesto',studio:'living-manifesto'},
  variants:{'public.home':'v2','public.story':'v2','public.principle':'v1','public.listen':'v1','public.membership':'v1','member.today':'v2'},
  structureSource:'golden-human',
  open:['favorite','motion','terminology','additional-screens','community'],
} as const;
