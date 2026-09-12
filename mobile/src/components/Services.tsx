import { View, Text, Pressable, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "../theme";

type PricingCard = {
  title: string;
  desc: string;
  price: string;
  features: readonly string[];
  cta: string;
  highlighted: boolean;
  badge?: string;
};

const CARDS: readonly PricingCard[] = [
  {
    title: "Smart Corporate Website",
    desc: "Engineered for brand eminence, customer trust, and speed.",
    price: "10,000 EGP",
    features: ["Fast, SEO-Optimized", "3-5 Tailored Pages", "CMS Ready", "Mobile-First UI", "Analytics Setup"],
    cta: "Choose Plan",
    highlighted: false,
  },
  {
    title: "Business Dashboard",
    desc: "Centralized intelligence, data control, and authenticated access.",
    price: "25,000 EGP",
    features: [
      "Secure Auth & Session Vault",
      "Dynamic CRUD Operations",
      "Data Management & Filters",
      "RBAC",
      "Third-Party API Integrations",
      "Real-time Telemetry & Charts",
    ],
    cta: "Get Started",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    title: "Full-Stack Platform",
    desc: "Bespoke distributed applications engineered for massive scale.",
    price: "45,000 EGP",
    features: [
      "Custom Architecture Design",
      "Scalable SQL/NoSQL",
      "Automation Pipelines",
      "High-Concurrency Support",
      "Microservices / Serverless",
      "Dedicated SLA & Care",
    ],
    cta: "Scale Up",
    highlighted: false,
  },
] as const;

const Services = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Flexible Engagements</Text>
        </View>
        <Text style={styles.h2}>Transparent Pricing & High-Impact Services</Text>
        <Text style={styles.sub}>Tailored engineering solutions to turn complex architectures into seamless platforms.</Text>
      </View>

      <View style={styles.grid}>
        {CARDS.map((card: PricingCard) => (
          <View
            key={card.title}
            style={card.highlighted ? [styles.card, styles.cardHighlighted] : styles.card}
          >
            {card.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{card.badge}</Text>
              </View>
            )}
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDesc}>{card.desc}</Text>
            <View style={styles.priceWrap}>
              <Text style={styles.priceLabel}>Starting at</Text>
              <Text style={styles.price}>{card.price}</Text>
            </View>
            <View style={styles.features}>
              {card.features.map((f: string) => (
                <View key={f} style={styles.featureRow}>
                  <Text style={styles.check}>✓</Text>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            <Pressable style={card.highlighted ? styles.ctaPrimary : styles.ctaSecondary}>
              <Text style={card.highlighted ? styles.ctaPrimaryText : styles.ctaSecondaryText}>{card.cta}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 24,
  },
  header: {
    alignItems: "center",
    gap: 12,
  },
  pill: {
    backgroundColor: "rgba(30,41,59,0.9)",
    borderWidth: 1,
    borderColor: "rgba(51,65,85,0.3)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  h2: {
    color: COLORS.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  sub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  grid: {
    gap: 16,
  },
  card: {
    backgroundColor: "rgba(30,41,59,0.7)",
    borderWidth: 1,
    borderColor: "rgba(51,65,85,0.4)",
    borderRadius: RADIUS.xl,
    padding: 20,
    gap: 12,
  },
  cardHighlighted: {
    backgroundColor: "rgba(30,41,59,0.95)",
    borderColor: "rgba(6,182,212,0.5)",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  badge: {
    position: "absolute",
    top: -10,
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 1,
  },
  badgeText: {
    color: "#003640",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  cardDesc: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
  },
  priceWrap: {
    marginVertical: 8,
  },
  priceLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "600",
  },
  price: {
    color: COLORS.primary,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 2,
  },
  features: {
    gap: 10,
    marginBottom: 8,
  },
  featureRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  check: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  featureText: {
    color: COLORS.text,
    fontSize: 13,
    flex: 1,
  },
  ctaPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
  ctaPrimaryText: {
    color: "#003640",
    fontSize: 14,
    fontWeight: "800",
  },
  ctaSecondary: {
    backgroundColor: "rgba(51,65,85,0.8)",
    borderWidth: 1,
    borderColor: "rgba(51,65,85,0.6)",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
  },
  ctaSecondaryText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default Services;
