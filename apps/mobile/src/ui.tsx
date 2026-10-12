import { createContext, useContext, type ReactNode } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import { approvedTokens } from "@adequate/domain";
export type Palette = typeof approvedTokens.dark | typeof approvedTokens.light;
export const PaletteContext = createContext<Palette>(approvedTokens.dark);
export const usePalette = () => useContext(PaletteContext);
export function Txt({
  children,
  muted = false,
  mono = false,
  size = 16,
  bold = false,
  style,
}: {
  children: ReactNode;
  muted?: boolean;
  mono?: boolean;
  size?: number;
  bold?: boolean;
  style?: ViewStyle | object;
}) {
  const c = usePalette();
  return (
    <Text
      selectable
      style={[
        {
          fontFamily: mono
            ? "IBMPlexMono-Regular"
            : bold
              ? "SpaceGrotesk-Bold"
              : "SpaceGrotesk-Regular",
          fontSize: size,
          lineHeight: size * 1.5,
          color: muted ? c.inkMuted : c.ink,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Heading({
  children,
  size = 30,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: "SpaceGrotesk-Medium",
        fontSize: size,
        lineHeight: size * 1.15,
        color: usePalette().ink,
      }}
    >
      {children}
    </Text>
  );
}
export function Card({
  label,
  children,
  style,
}: {
  label: string;
  children: ReactNode;
  style?: ViewStyle;
}) {
  const c = usePalette();
  return (
    <View
      style={[
        {
          backgroundColor: c.surface,
          borderWidth: 2,
          borderColor: c.ink,
          padding: 20,
          gap: 16,
          borderRadius: 0,
        },
        style,
      ]}
    >
      <Txt
        mono
        size={12}
        style={{
          color: c.accentText,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </Txt>
      {children}
    </View>
  );
}
export function Action({
  label,
  onPress,
  secondary = false,
  disabled = false,
  destructive = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: destructive ? c.focus : secondary ? c.ink : c.accent,
        backgroundColor: secondary ? "transparent" : c.accent,
        opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          color: secondary ? c.ink : c.onAccent,
          fontFamily: "SpaceGrotesk-Bold",
          fontSize: 14,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const c = usePalette();
  return (
    <View style={{ gap: 8 }}>
      <Txt mono size={12}>
        {label}
      </Txt>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.inkMuted}
        {...props}
        style={[
          {
            fontFamily: "SpaceGrotesk-Regular",
            fontSize: 16,
            lineHeight: 25,
            color: c.ink,
            backgroundColor: c.surfaceAlt,
            borderWidth: 1,
            borderColor: c.line,
            padding: 12,
            minHeight: 48,
            textAlignVertical: "top",
          },
          props.style,
        ]}
      />
    </View>
  );
}
export function Row({ children }: { children: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
      {children}
    </View>
  );
}
export function Orbit({
  progress = 0,
  size = 180,
}: {
  progress?: number;
  size?: number;
}) {
  const c = usePalette();
  const circumference = 2 * Math.PI * 54;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      accessible
      accessibilityLabel="Recording playback position"
    >
      <Circle
        cx={100}
        cy={100}
        r={54}
        stroke={c.line}
        strokeWidth={1}
        fill="none"
      />
      <Circle
        cx={100}
        cy={100}
        r={54}
        stroke={c.accent}
        strokeWidth={2}
        fill="none"
        strokeDasharray={`${circumference * Math.max(0, Math.min(1, progress))} ${circumference}`}
        rotation={-90}
        origin="100, 100"
      />
      {Array.from({ length: 48 }, (_, i) => {
        const a = (i / 48) * Math.PI * 2;
        const r = 70 + (i % 6) * 3;
        return (
          <Line
            key={i}
            x1={100 + Math.cos(a) * 63}
            y1={100 + Math.sin(a) * 63}
            x2={100 + Math.cos(a) * r}
            y2={100 + Math.sin(a) * r}
            stroke={i % 3 === 0 ? c.accent2 : c.accent}
            strokeWidth={1.5}
          />
        );
      })}
      <Circle cx={100} cy={100} r={30} stroke={c.accent2} fill="none" />
    </Svg>
  );
}
export function Brand() {
  const c = usePalette();
  return (
    <Row>
      <Svg width={28} height={28} viewBox="0 0 32 32">
        <Circle
          cx={16}
          cy={16}
          r={13}
          stroke={c.accent}
          strokeWidth={1.2}
          fill="none"
        />
        <Circle
          cx={16}
          cy={16}
          r={8}
          stroke={c.accent2}
          strokeWidth={1.2}
          fill="none"
        />
        <Circle cx={16} cy={16} r={2.5} fill={c.accent} />
        <Circle cx={27.3} cy={9.5} r={2} fill={c.ink} />
      </Svg>
      <Txt bold size={19}>
        ADEQUATE
      </Txt>
    </Row>
  );
}
export const styles = StyleSheet.create({
  stack: { gap: 20 },
  page: { padding: 20, gap: 24, paddingBottom: 40 },
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
});
