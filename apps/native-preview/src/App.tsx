import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, BackHandler, Platform, Pressable, StyleSheet, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { concepts, type ColorMode, type ConceptId } from '@adequate/design-tokens';
import { makeTheme, ThemeProvider, useTheme } from './theme';
import * as S from './screens';
import type { ScreenId } from './screens';

const titles: Record<ScreenId, string> = {
  today: 'Today', mirror: 'Adequacy Mirror', pathways: 'Pathways', voice: 'Voice to Purpose', book: 'Living Book',
  convergence: 'Convergence', together: 'Adequate Together', profile: 'Your journal', preferences: 'Preferences', onboarding: 'Welcome',
};
const tabs: { id: ScreenId; label: string; glyph: string }[] = [
  { id: 'today', label: 'Today', glyph: '☼' },
  { id: 'mirror', label: 'Mirror', glyph: '◐' },
  { id: 'pathways', label: 'Paths', glyph: '⑂' },
  { id: 'voice', label: 'Voice', glyph: '◉' },
  { id: 'profile', label: 'You', glyph: '◯' },
];
const more: ScreenId[] = ['book', 'convergence', 'together', 'preferences', 'onboarding'];

function Body({ screen, variant, nav }: { screen: ScreenId; variant: 'v1' | 'v2'; nav: (s: ScreenId) => void }) {
  switch (screen) {
    case 'today': return <S.Today variant={variant} nav={nav} />;
    case 'mirror': return <S.Mirror variant={variant} />;
    case 'pathways': return <S.Pathways variant={variant} />;
    case 'voice': return <S.Voice variant={variant} />;
    case 'book': return <S.Book variant={variant} />;
    case 'convergence': return <S.Convergence variant={variant} />;
    case 'together': return <S.Together variant={variant} />;
    case 'profile': return <S.Profile />;
    case 'preferences': return <S.Preferences />;
    case 'onboarding': return <S.Onboarding variant={variant} nav={nav} />;
  }
}

/** Design-review toolbar — clearly not part of the product. */
function DesignBar({ concept, setConcept, mode, setMode, variant, setVariant }: {
  concept: ConceptId; setConcept: (c: ConceptId) => void; mode: ColorMode; setMode: (m: ColorMode) => void; variant: 'v1' | 'v2'; setVariant: (v: 'v1' | 'v2') => void;
}) {
  const chip = (label: string, on: boolean, onPress: () => void) => (
    <Pressable key={label} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={styles.designBar} accessibilityLabel="Design preview controls (not part of the app)">
      <Text style={styles.designLabel}>DESIGN PREVIEW</Text>
      {concepts.map((c) => chip(c.letter, concept === c.id, () => setConcept(c.id)))}
      <View style={styles.sep} />
      {chip('Light', mode === 'light', () => setMode('light'))}
      {chip('Dark', mode === 'dark', () => setMode('dark'))}
      <View style={styles.sep} />
      {chip('Way 1', variant === 'v1', () => setVariant('v1'))}
      {chip('Way 2', variant === 'v2', () => setVariant('v2'))}
    </View>
  );
}

function Shell({ stack, nav, back, variant }: { stack: ScreenId[]; nav: (s: ScreenId) => void; back: () => void; variant: 'v1' | 'v2' }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const screen = stack[stack.length - 1];
  const wide = width >= 768; // iPad / tablet: purpose-built sidebar layout
  const ios = Platform.OS === 'ios';
  const manifesto = t.concept.id === 'living-manifesto';
  const titleStyle = { fontFamily: ios ? t.font.body : t.font.display, color: t.c.ink, fontSize: ios ? 17 : 22, fontWeight: (ios ? '600' : '500') as '600' | '500', textTransform: (manifesto && !ios ? 'uppercase' : 'none') as 'uppercase' | 'none' };

  if (screen === 'onboarding') return <Body screen={screen} variant={variant} nav={nav} />;

  const header = (
    <View style={[styles.header, { borderBottomColor: manifesto ? t.c.ink : t.c.line, borderBottomWidth: manifesto ? 2 : StyleSheet.hairlineWidth, justifyContent: ios ? 'center' : 'flex-start' }]}>
      {stack.length > 1 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} hitSlop={12} style={[styles.headerSide, ios ? { position: 'absolute', left: 8 } : null]}>
          <Text style={{ color: ios ? t.c.accentText : t.c.ink, fontSize: ios ? 17 : 22 }}>{ios ? '‹ Back' : '←'}</Text>
        </Pressable>
      ) : null}
      <Text accessibilityRole="header" style={titleStyle}>{titles[screen]}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Preferences" onPress={() => nav('preferences')} hitSlop={12} style={[styles.headerSide, { position: 'absolute', right: 8 }]}>
        <Text style={{ color: t.c.ink, fontSize: 18 }}>⚙︎</Text>
      </Pressable>
    </View>
  );

  if (wide) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: t.c.bg }}>
        <View style={{ width: 240, borderRightWidth: manifesto ? 2 : StyleSheet.hairlineWidth, borderRightColor: manifesto ? t.c.ink : t.c.line, backgroundColor: t.c.surfaceAlt, paddingTop: 20, paddingHorizontal: 10, gap: 4 }}>
          <Text style={{ fontFamily: t.font.display, color: t.c.ink, fontSize: 20, letterSpacing: 3, padding: 10 }}>ADEQUATE</Text>
          {[...tabs.map((x) => x.id), ...more].map((id) => (
            <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: screen === id }} onPress={() => nav(id)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: t.radius.md, backgroundColor: screen === id ? t.c.surface : 'transparent', borderLeftWidth: screen === id ? 3 : 0, borderLeftColor: t.c.accent }}>
              <Text style={{ color: screen === id ? t.c.ink : t.c.inkMuted, fontFamily: t.font.body, fontSize: 15, fontWeight: manifesto ? '800' : '400' }}>{titles[id]}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flex: 1 }}>{header}<Body screen={screen} variant={variant} nav={nav} /></View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      {header}
      <View style={{ flex: 1 }}><Body screen={screen} variant={variant} nav={nav} /></View>
      {screen === 'profile' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.c.line, backgroundColor: t.c.surface }}>
          {more.map((id) => (
            <Pressable key={id} onPress={() => nav(id)} accessibilityRole="button" style={{ minHeight: 40, paddingHorizontal: 12, justifyContent: 'center', borderRadius: t.radius.pill, borderWidth: 1, borderColor: t.c.line }}>
              <Text style={{ color: t.c.ink, fontSize: 13 }}>{titles[id]}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={[styles.tabbar, { backgroundColor: t.c.surface, borderTopColor: manifesto ? t.c.ink : t.c.line, borderTopWidth: manifesto ? 2 : StyleSheet.hairlineWidth }]} accessibilityRole="tablist">
        {tabs.map((tab) => {
          const on = screen === tab.id;
          return (
            <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={tab.label} onPress={() => nav(tab.id)} style={styles.tab}>
              <View style={[styles.tabIcon, !ios && on ? { backgroundColor: manifesto ? t.c.ink : `${t.c.accent}55`, borderRadius: manifesto ? 0 : 99 } : null]}>
                <Text style={{ fontSize: 18, color: on ? (ios ? t.c.accentText : manifesto ? t.c.bg : t.c.ink) : t.c.inkMuted }}>{tab.glyph}</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: !ios || manifesto ? '700' : '500', color: on ? (ios ? t.c.accentText : t.c.ink) : t.c.inkMuted, textTransform: manifesto ? 'uppercase' : 'none' }}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  const scheme = useColorScheme();
  const [concept, setConcept] = useState<ConceptId>('golden-human');
  const [modeOverride, setModeOverride] = useState<ColorMode | null>(null);
  const [variant, setVariant] = useState<'v1' | 'v2'>('v1');
  const [stack, setStack] = useState<ScreenId[]>(['onboarding']);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => sub.remove();
  }, []);

  const mode: ColorMode = modeOverride ?? (concept === 'resonance-atlas' ? 'dark' : scheme === 'dark' ? 'dark' : 'light');
  const theme = useMemo(() => makeTheme(concept, mode, reducedMotion), [concept, mode, reducedMotion]);

  // Tabs reset the stack to Today (+ tab); other screens push, so Back returns where you came from.
  const nav = useCallback((s: ScreenId) => setStack((st) => {
    if (tabs.some((x) => x.id === s)) return s === 'today' ? ['today'] : ['today', s];
    return st[st.length - 1] === s ? st : [...st, s];
  }), []);
  const back = useCallback(() => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)), []);

  // Android hardware/gesture Back pops the in-app stack; at the root it falls through and exits.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) {
        back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack, back]);

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.c.bg }} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
          <DesignBar concept={concept} setConcept={(c) => (setConcept(c), setModeOverride(null))} mode={mode} setMode={setModeOverride} variant={variant} setVariant={setVariant} />
          <Shell stack={stack} nav={nav} back={back} variant={variant} />
        </SafeAreaView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  designBar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#1c1b19' },
  designLabel: { color: '#aaa', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginRight: 4 },
  chip: { minHeight: 30, minWidth: 30, paddingHorizontal: 10, borderRadius: 99, justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' },
  chipOn: { backgroundColor: '#f2f0ec' },
  chipText: { color: '#ddd', fontSize: 12, fontWeight: '600' },
  chipTextOn: { color: '#1c1b19' },
  sep: { width: 1, height: 18, backgroundColor: '#555', marginHorizontal: 4 },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  headerSide: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  tabbar: { flexDirection: 'row', paddingTop: 6, paddingBottom: Platform.OS === 'android' ? 10 : 4 },
  tab: { flex: 1, alignItems: 'center', gap: 2, minHeight: 52, justifyContent: 'center' },
  tabIcon: { width: 56, height: 30, alignItems: 'center', justifyContent: 'center' },
});
