import { View, Text, Pressable, StyleSheet } from "react-native";
import { COLORS } from "../theme";

type FooterLink = {
  label: string;
};

const LINKS: readonly FooterLink[] = [
  { label: "Services" },
  { label: "Work" },
  { label: "Pricing" },
  { label: "Contact" },
] as const;

const Footer = () => {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <View style={styles.brandRow}>
          <Text style={styles.brandText}>ShenoDev</Text>
          <View style={styles.dot} />
        </View>
        <Text style={styles.copy}>© 2026 ShenoDev. All rights reserved. Think it, Sheno it.</Text>
      </View>
      <View style={styles.links}>
        {LINKS.map((link: FooterLink) => (
          <Pressable key={link.label}>
            <Text style={styles.linkText}>{link.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#020617",
    borderTopWidth: 1,
    borderTopColor: "rgba(51,65,85,0.3)",
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
    alignItems: "center",
  },
  brand: {
    alignItems: "center",
    gap: 6,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  copy: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    textAlign: "center",
  },
  links: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  linkText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "600",
  },
});

export default Footer;
