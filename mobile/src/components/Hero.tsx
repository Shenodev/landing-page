import { View, Text, Pressable, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "../theme";

type TrustMetric = {
  value: string;
  label: string;
};

const METRICS: readonly TrustMetric[] = [
  { value: "99.9%", label: "Uptime Architecture" },
  { value: "<100ms", label: "Edge Latency" },
  { value: "100%", label: "Clean Code Delivery" },
] as const;

type HeroProps = {
  onNavigate?: (target: string) => void;
};

const Hero = ({ onNavigate }: HeroProps) => {
  return (
    <View style={styles.container}>
      {/* Pill */}
      <View style={styles.pill}>
        <View style={styles.pillDot} />
        <Text style={styles.pillCyan}>Think it, Sheno it</Text>
        <Text style={styles.pillSep}>|</Text>
        <Text style={styles.pillMuted}>Full-Stack Studio</Text>
      </View>

      <Text style={styles.heading}>
        Empowering Your Business with <Text style={styles.headingAccent}>High-Performance</Text> Web Solutions.
      </Text>

      <Text style={styles.sub}>
        We build fast, scalable, and intelligent web applications engineered for authoritative performance and seamless
        user experiences.
      </Text>

      <View style={styles.ctaRow}>
        <Pressable style={styles.primaryCta} onPress={() => onNavigate?.("discovery")}>
          <Text style={styles.primaryCtaText}>Start Your Project →</Text>
        </Pressable>
        <Pressable style={styles.secondaryCta} onPress={() => onNavigate?.("services")}>
          <Text style={styles.secondaryCtaText}>View Our Work</Text>
        </Pressable>
      </View>

      <View style={styles.metricsRow}>
        {METRICS.map((m: TrustMetric) => (
          <View key={m.label} style={styles.metric}>
            <Text style={styles.metricValue}>{m.value}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: "rgba(30,41,59,0.8)",
    borderWidth: 1,
    borderColor: "rgba(51,65,85,0.4)",
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  pillCyan: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  pillSep: {
    color: "#64748B",
    fontSize: 11,
  },
  pillMuted: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "600",
  },
  heading: {
    color: COLORS.text,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -1,
  },
  headingAccent: {
    color: COLORS.primary,
  },
  sub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 26,
  },
  ctaRow: {
    gap: 12,
    marginTop: 8,
  },
  primaryCta: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  primaryCtaText: {
    color: "#003640",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryCta: {
    backgroundColor: "rgba(30,41,59,0.6)",
    borderWidth: 1,
    borderColor: "rgba(51,65,85,0.5)",
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryCtaText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(51,65,85,0.3)",
    paddingTop: 20,
    marginTop: 8,
  },
  metric: {
    flex: 1,
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  metricLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  mediaCard: {
    height: 320,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.background, // #0F172A seamless
    borderWidth: 1,
    borderColor: "rgba(51,65,85,0.2)",
    overflow: "hidden",
    marginTop: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaInner: {
    alignItems: "center",
    gap: 8,
    padding: 24,
  },
  mediaIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "rgba(6,182,212,0.15)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  mediaIcon: {
    color: COLORS.primary,
    fontSize: 28,
  },
  mediaTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  mediaSub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  mediaBadge: {
    marginTop: 8,
    backgroundColor: "rgba(6,182,212,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.2)",
  },
  mediaBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
});

export default Hero;
