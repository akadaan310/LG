import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from './theme';

// react-native-web has no native animation module; use the JS driver there.
const NATIVE_DRIVER = Platform.OS !== 'web';

/* Shared design-mock primitives. Everything here is presentational; nothing saves or sends data. */

export function ScreenScroll({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.c.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 16 }} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  const t = useTheme();
  const manifesto = t.concept.id === 'living-manifesto';
  return (
    <Text
      accessibilityRole="text"
      style={{
        fontFamily: manifesto ? t.font.body : t.font.accent,
        fontSize: 12,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        fontWeight: manifesto ? '800' : '500',
        color: manifesto ? t.c.onAccent : t.c.accentText,
        backgroundColor: manifesto ? t.c.accent : 'transparent',
        alignSelf: 'flex-start',
        paddingHorizontal: manifesto ? 8 : 0,
        paddingVertical: manifesto ? 3 : 0,
      }}
    >
      {children}
    </Text>
  );
}

export function Display({ children, size = 32, style }: { children: ReactNode; size?: number; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  const manifesto = t.concept.id === 'living-manifesto';
  return (
    <Text
      accessibilityRole="header"
      maxFontSizeMultiplier={1.6}
      style={[
        {
          fontFamily: t.font.display,
          fontSize: manifesto ? size * 1.2 : size,
          lineHeight: (manifesto ? size * 1.2 : size) * (manifesto ? 1.0 : 1.18),
          color: t.c.ink,
          textTransform: t.upper ? 'uppercase' : 'none',
          fontWeight: t.concept.id === 'resonance-atlas' ? '300' : manifesto ? '900' : '400',
          fontStyle: t.concept.id === 'golden-human' ? 'italic' : 'normal',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[{ fontFamily: t.font.body, fontSize: 16, lineHeight: 24, color: muted ? t.c.inkMuted : t.c.ink }, style]}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={{ fontFamily: t.font.body, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: t.c.inkMuted }}>{children}</Text>;
}

export function Badge({ kind }: { kind: 'concept' | 'demo' | 'synthetic' | 'placeholder' }) {
  const t = useTheme();
  const text = { concept: 'Concept copy', demo: 'Demo only', synthetic: 'Synthetic data', placeholder: 'Placeholder' }[kind];
  return (
    <View style={{ alignSelf: 'flex-start', borderWidth: 1, borderStyle: 'dashed', borderColor: t.c.inkMuted, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.6, color: t.c.inkMuted, textTransform: 'uppercase' }}>{text}</Text>
    </View>
  );
}

export function Card({ children, label, index, style, highlight }: { children: ReactNode; label?: string; index?: string; style?: StyleProp<ViewStyle>; highlight?: boolean }) {
  const t = useTheme();
  const atlas = t.concept.id === 'resonance-atlas';
  return (
    <View
      style={[
        {
          backgroundColor: highlight && t.concept.id === 'living-manifesto' ? t.c.accent : t.c.surface,
          borderWidth: t.border,
          borderColor: highlight ? t.c.accent : t.concept.id === 'living-manifesto' ? t.c.ink : t.c.line,
          borderRadius: t.radius.md,
          padding: 18,
          gap: 10,
        },
        t.concept.id === 'golden-human' && styles.paperShadow,
        style,
      ]}
    >
      {atlas ? <View style={[styles.tick, { borderColor: t.c.accent, top: -1, left: -1, borderTopWidth: 1, borderLeftWidth: 1 }]} /> : null}
      {atlas ? <View style={[styles.tick, { borderColor: t.c.accent, bottom: -1, right: -1, borderBottomWidth: 1, borderRightWidth: 1 }]} /> : null}
      {label ? <Text style={{ fontFamily: t.font.accent, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: highlight && t.concept.id === 'living-manifesto' ? t.c.onAccent : t.c.accentText }}>{label}</Text> : null}
      {index ? <Text style={{ position: 'absolute', top: 10, right: 14, fontFamily: t.font.display, fontSize: t.concept.id === 'living-manifesto' ? 36 : 14, color: t.concept.id === 'living-manifesto' ? t.c.line : t.c.accentText, opacity: t.concept.id === 'living-manifesto' ? 0.18 : 1, fontStyle: t.concept.id === 'golden-human' ? 'italic' : 'normal' }}>{index}</Text> : null}
      {children}
    </View>
  );
}

/** Button with a tactile press response (scale), disabled under reduced motion. */
export function Button({ title, onPress, kind = 'primary', accessibilityHint }: { title: string; onPress?: () => void; kind?: 'primary' | 'secondary' | 'ghost'; accessibilityHint?: string }) {
  const t = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => !t.reducedMotion && Animated.spring(scale, { toValue: v, useNativeDriver: NATIVE_DRIVER, speed: 40, bounciness: 6 }).start();
  const manifesto = t.concept.id === 'living-manifesto';
  const atlas = t.concept.id === 'resonance-atlas';
  const bg = kind === 'primary' ? (atlas ? t.c.accent : t.c.ink) : 'transparent';
  const fg = kind === 'primary' ? (atlas ? t.c.onAccent : t.c.bg) : t.c.ink;
  return (
    <Pressable accessibilityRole="button" accessibilityHint={accessibilityHint} onPress={onPress} onPressIn={() => to(0.96)} onPressOut={() => to(1)} hitSlop={6}>
      <Animated.View
        style={{
          transform: [{ scale }],
          minHeight: 48,
          paddingHorizontal: kind === 'ghost' ? 6 : 22,
          borderRadius: t.radius.pill,
          backgroundColor: bg,
          borderWidth: kind === 'secondary' ? Math.max(1, t.border) : 0,
          borderColor: atlas ? t.c.line : t.c.ink,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          alignSelf: 'flex-start',
        }}
      >
        <Text style={{ color: fg, fontFamily: atlas ? t.font.accent : t.font.body, fontWeight: manifesto ? '800' : '600', fontSize: 15, textTransform: manifesto || atlas ? 'uppercase' : 'none', letterSpacing: atlas ? 1 : 0, textDecorationLine: kind === 'ghost' ? 'underline' : 'none' }}>
          {title}
          {manifesto && kind !== 'ghost' ? '  →' : ''}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function Pill({ children, active, onPress }: { children: ReactNode; active?: boolean; onPress?: () => void }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} accessibilityState={{ selected: !!active }} onPress={onPress} style={{ minHeight: 40, justifyContent: 'center', paddingHorizontal: 14, borderRadius: t.radius.pill, borderWidth: t.border, borderColor: active ? t.c.accent : t.concept.id === 'living-manifesto' ? t.c.ink : t.c.line, backgroundColor: active ? t.c.accent : t.c.surface }}>
      <Text style={{ color: active ? t.c.onAccent : t.c.ink, fontFamily: t.font.body, fontSize: 14, fontWeight: t.concept.id === 'living-manifesto' ? '800' : '400' }}>{children}</Text>
    </Pressable>
  );
}

/** Placeholder sound visual — never real or fabricated audio. */
export function Wave({ active = false, bars = 28 }: { active?: boolean; bars?: number }) {
  const t = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active || t.reducedMotion) {
      anim.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(anim, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [active, anim, t.reducedMotion]);
  const heights = Array.from({ length: bars }, (_, i) => 0.3 + 0.7 * Math.abs(Math.sin(i * 0.55) * 0.7 + Math.sin(i * 1.7) * 0.3));
  const manifesto = t.concept.id === 'living-manifesto';
  const atlas = t.concept.id === 'resonance-atlas';
  return (
    <View accessible accessibilityLabel="Sound visual placeholder — no audio" style={{ flexDirection: 'row', alignItems: 'center', height: 56, gap: manifesto ? 2 : 3 }}>
      {heights.map((h, i) => (
        <Animated.View
          key={i}
          style={{
            flex: 1,
            height: `${h * 100}%`,
            borderRadius: manifesto ? 0 : 99,
            backgroundColor: atlas ? (i % 3 === 0 ? t.c.accent2 : t.c.accent) : manifesto ? (i < bars * 0.35 ? t.c.accent : t.c.ink) : t.c.accent,
            opacity: t.concept.id === 'golden-human' ? 0.85 : 1,
            transform: [{ scaleY: anim.interpolate({ inputRange: [0, 1], outputRange: [1, i % 2 ? 0.5 : 1.15] }) }],
          }}
        />
      ))}
    </View>
  );
}

export function Rings({ size = 180, count = 4 }: { size?: number; count?: number }) {
  const t = useTheme();
  return (
    <View accessible accessibilityLabel="Geometry of Growth — a metaphor, not a scientific model" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
      {Array.from({ length: count }).map((_, i) => {
        const s = size * ((i + 1) / count);
        return <View key={i} style={{ position: 'absolute', width: s, height: s, borderRadius: s / 2, borderWidth: 1, borderColor: i === count - 2 ? t.c.accent : t.c.line }} />;
      })}
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: t.c.accent }} />
    </View>
  );
}

/** Fades & rises in on mount; instant under reduced motion. */
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const t = useTheme();
  const v = useRef(new Animated.Value(t.reducedMotion ? 1 : 0)).current;
  useEffect(() => {
    if (t.reducedMotion) return;
    Animated.timing(v, { toValue: 1, duration: t.concept.motion.durations.slow, delay, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER }).start();
  }, [v, delay, t.reducedMotion, t.concept.motion.durations.slow]);
  return <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>{children}</Animated.View>;
}

export function Row({ children, gap = 8, wrap = true }: { children: ReactNode; gap?: number; wrap?: boolean }) {
  return <View style={{ flexDirection: 'row', flexWrap: wrap ? 'wrap' : 'nowrap', gap, alignItems: 'center' }}>{children}</View>;
}

const styles = StyleSheet.create({
  paperShadow: { shadowColor: '#503209', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  tick: { position: 'absolute', width: 8, height: 8 },
});
