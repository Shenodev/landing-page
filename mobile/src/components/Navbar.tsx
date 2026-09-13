import { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { COLORS, RADIUS } from "../theme";
import Logo from "./Logo";

type NavLink = {
  label: string;
  target: string;
};

const NAV_LINKS: readonly NavLink[] = [
  { label: "Services", target: "services" },
  { label: "Work", target: "work" },
  { label: "Tech Stack", target: "tech" },
  { label: "Contact", target: "contact" },
] as const;

type NavbarProps = {
  onNavigate?: (target: string) => void;
};

const DRAWER_WIDTH = Math.min(320, Dimensions.get("window").width * 0.82);
const WINDOW_HEIGHT = Dimensions.get("window").height;
const ANIM_DURATION = 280;

const Navbar = ({ onNavigate }: NavbarProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const translateX = useRef<Animated.Value>(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropOpacity = useRef<Animated.Value>(new Animated.Value(0)).current;

  const animateOpen = (): void => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: ANIM_DURATION,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: ANIM_DURATION,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateClose = (callback?: () => void): void => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: DRAWER_WIDTH,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      if (callback) callback();
    });
  };

  const toggle = (): void => {
    if (open) {
      setOpen(false);
      animateClose();
    } else {
      setOpen(true);
      animateOpen();
    }
  };

  const handleNavPress = (target: string): void => {
    animateClose(() => {
      setOpen(false);
      if (onNavigate) {
        // Small delay to let drawer settle before scroll
        setTimeout(() => onNavigate(target), 50);
      } else {
        console.log(`[Navbar] navigate to ${target}`);
      }
    });
  };

  const handleBackdropPress = (): void => {
    setOpen(false);
    animateClose();
  };

  const backdropStyle = {
    opacity: backdropOpacity,
  };

  const drawerStyle = {
    transform: [{ translateX }],
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => onNavigate?.("top")} style={styles.brand} accessibilityLabel="ShenoDev - Back to top">
          <Logo width={112} />
        </Pressable>

        <Pressable
          accessibilityLabel="Toggle Menu"
          accessibilityRole="button"
          onPress={toggle}
          style={styles.menuBtn}
        >
          <Text style={styles.menuIcon}>{open ? "✕" : "☰"}</Text>
        </Pressable>
      </View>

      {visible && (
        <View style={styles.overlayContainer} pointerEvents={open ? "auto" : "none"}>
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} />
          </Animated.View>
          <Animated.View style={[styles.drawer, drawerStyle]}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Menu</Text>
              <Pressable onPress={handleBackdropPress} style={styles.closeBtn}>
                <Text style={styles.closeIcon}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.drawerContent}>
              {NAV_LINKS.map((link: NavLink) => (
                <Pressable
                  key={link.label}
                  onPress={() => handleNavPress(link.target)}
                  style={styles.drawerLink}
                >
                  <Text style={styles.drawerText}>{link.label}</Text>
                </Pressable>
              ))}
              <View style={styles.divider} />
              <Pressable onPress={() => handleNavPress("contact")} style={styles.cta}>
                <Text style={styles.ctaText}>Get a Quote</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(15,23,42,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(51,65,85,0.3)",
    paddingTop: 48,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 56,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuBtn: {
    padding: 8,
  },
  menuIcon: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "600",
  },
  overlayContainer: {
    position: "absolute",
    top: -48,
    left: 0,
    right: 0,
    height: WINDOW_HEIGHT,
    zIndex: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: COLORS.surface,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(51,65,85,0.4)",
    paddingTop: 48,
    shadowColor: "#000",
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(51,65,85,0.3)",
  },
  drawerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 6,
  },
  closeIcon: {
    color: COLORS.onSurfaceVariant,
    fontSize: 18,
    fontWeight: "600",
  },
  drawerContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 4,
  },
  drawerLink: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(51,65,85,0.2)",
  },
  drawerText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(51,65,85,0.3)",
    marginVertical: 12,
  },
  cta: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
  ctaText: {
    color: "#003640",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default Navbar;
