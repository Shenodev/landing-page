import { useEffect, useState, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated, Easing, Image, Linking, ActivityIndicator } from "react-native";
import { COLORS, RADIUS } from "../theme";

type Project = {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  techStack: string[];
  demoUrl?: string;
  githubUrl?: string;
};

const Work = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Animated values for empty state
  const fadeAnim = useRef<Animated.Value>(new Animated.Value(0)).current;
  const scaleAnim = useRef<Animated.Value>(new Animated.Value(0.9)).current;
  const pulseAnim = useRef<Animated.Value>(new Animated.Value(1)).current;

  useEffect(() => {
    const fetchProjects = async (): Promise<void> => {
      try {
        const backendUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL;
        if (!backendUrl) throw new Error("EXPO_PUBLIC_API_URL not configured");
        const res: Response = await fetch(`${backendUrl}/api/projects`);
        const data = (await res.json()) as { data: Project[] } | Project[];
        const list: Project[] = Array.isArray(data) ? data : (data as { data: Project[] }).data ?? [];
        setProjects(list);
      } catch (err: unknown) {
        const msg: string = err instanceof Error ? err.message : String(err);
        console.error("[Work] fetch failed:", msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    void fetchProjects();
  }, []);

  useEffect(() => {
    if (!loading && projects.length === 0 && !error) {
      // Animate empty state gracefully
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
      // Pulse dot
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [loading, projects.length, error, fadeAnim, scaleAnim, pulseAnim]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Our Work</Text>
          </View>
          <Text style={styles.h2}>My Works</Text>
        </View>
        <View style={styles.loadingGrid}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error && projects.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.h2}>My Works</Text>
          <Text style={styles.errorText}>Unable to load: {error}</Text>
        </View>
      </View>
    );
  }

  if (projects.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Our Work</Text>
          </View>
          <Text style={styles.h2}>My Works</Text>
          <Text style={styles.sub}>A curated collection of our recent builds.</Text>
        </View>
        <Animated.View style={[styles.emptyCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.emptyGlow} />
          <View style={styles.emptyTopLine} />
          <View style={styles.emptyIconWrap}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Text style={styles.emptyIcon}>✦</Text>
            </Animated.View>
          </View>
          <Text style={styles.emptyTitle}>Crafting new digital experiences... Coming Soon</Text>
          <Text style={styles.emptySub}>We’re currently curating our finest work. Soon you’ll explore elegant, high-performance projects engineered with Next.js, TypeScript, and MongoDB.</Text>
          <View style={styles.emptyBadge}>
            <Animated.View style={[styles.emptyDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.emptyBadgeText}>Portfolio curation in progress</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Our Work</Text>
        </View>
        <Text style={styles.h2}>My Works</Text>
        <Text style={styles.sub}>A curated collection of high-performance builds.</Text>
      </View>
      <View style={styles.grid}>
        {projects.map((project: Project) => (
          <View key={project._id} style={styles.card}>
            <View style={styles.cardGlow} />
            <View style={styles.imageWrap}>
              <Image source={{ uri: project.imageUrl }} style={styles.image} resizeMode="cover" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{project.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={3}>
                {project.description}
              </Text>
              <View style={styles.techRow}>
                {project.techStack.map((tech: string) => (
                  <View key={tech} style={styles.techBadge}>
                    <Text style={styles.techText}>{tech}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.cardActions}>
                {project.demoUrl ? (
                  <Pressable style={styles.demoBtn} onPress={() => project.demoUrl && Linking.openURL(project.demoUrl)}>
                    <Text style={styles.demoText}>Live Demo ↗</Text>
                  </Pressable>
                ) : null}
                {project.githubUrl ? (
                  <Pressable style={styles.ghostBtn} onPress={() => project.githubUrl && Linking.openURL(project.githubUrl)}>
                    <Text style={styles.ghostText}>Code</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
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
    gap: 20,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: "center",
    gap: 10,
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
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  h2: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  sub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    textAlign: "center",
  },
  loadingGrid: {
    gap: 12,
  },
  skeletonCard: {
    height: 180,
    backgroundColor: "rgba(30,41,59,0.5)",
    borderWidth: 1,
    borderColor: "rgba(51,65,85,0.2)",
    borderRadius: RADIUS.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#F87171",
    fontSize: 12,
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: "rgba(30,41,59,0.5)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.2)",
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  emptyGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(6,182,212,0.04)",
  },
  emptyTopLine: {
    position: "absolute",
    top: 0,
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: "rgba(6,182,212,0.3)",
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "rgba(30,41,59,0.8)",
    borderWidth: 1,
    borderColor: "rgba(51,65,85,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIcon: {
    color: COLORS.primary,
    fontSize: 28,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  emptyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(30,41,59,0.9)",
    borderWidth: 1,
    borderColor: "rgba(51,65,85,0.3)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  emptyBadgeText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "600",
  },
  grid: {
    gap: 16,
  },
  card: {
    backgroundColor: "rgba(30,41,59,0.7)",
    borderWidth: 1,
    borderColor: "rgba(51,65,85,0.3)",
    borderRadius: RADIUS.xl,
    overflow: "hidden",
  },
  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(6,182,212,0.03)",
  },
  imageWrap: {
    height: 180,
    backgroundColor: "#020617",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  cardContent: {
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  cardDesc: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
  },
  techRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  techBadge: {
    backgroundColor: "rgba(51,65,85,0.5)",
    borderWidth: 1,
    borderColor: "rgba(51,65,85,0.3)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  techText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "500",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  demoText: {
    color: "#003640",
    fontSize: 13,
    fontWeight: "700",
  },
  ghostBtn: {
    backgroundColor: "rgba(51,65,85,0.5)",
    borderWidth: 1,
    borderColor: "rgba(51,65,85,0.4)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
  },
  ghostText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
});

export default Work;
