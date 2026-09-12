import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { COLORS, RADIUS } from "../theme";

type StackItem = {
  label: string;
  dot: string;
};

const STACK: readonly StackItem[] = [
  { label: "Next.js", dot: COLORS.primary },
  { label: "React", dot: "#4CD7F6" },
  { label: "Node.js", dot: "#4ADEA3" },
  { label: "Express", dot: "#ADC6FF" },
  { label: "MongoDB", dot: "#1BBD85" },
  { label: "Tailwind", dot: "#4CD7F6" },
  { label: "Zod", dot: "#ADC6FF" },
] as const;

const TechMarquee = () => {
  // 4x duplication ensures no blank gap on ultrawide; we animate one set width
  const loopItems = [...STACK, ...STACK, ...STACK, ...STACK] as const;
  const translateX = useRef<Animated.Value>(new Animated.Value(0)).current;
  const [contentWidth, setContentWidth] = useState<number>(0);

  useEffect(() => {
    if (contentWidth === 0) return;
    const oneSetWidth = contentWidth / 4;
    // Continuous seamless loop without frame drops: linear easing, native driver
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -oneSetWidth,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [translateX, contentWidth]);

  return (
    <View style={styles.container}>
      <View style={styles.viewport}>
        <Animated.View
          onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
          style={[
            styles.track,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          {loopItems.map((item: StackItem, idx: number) => (
            <View key={`${item.label}-${idx}`} style={styles.badge}>
              <View style={[styles.dot, { backgroundColor: item.dot }]} />
              <Text style={styles.label}>{item.label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(51,65,85,0.3)",
    backgroundColor: "rgba(2,6,23,0.4)",
    paddingVertical: 16,
    overflow: "hidden",
  },
  viewport: {
    overflow: "hidden",
  },
  track: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    // width max-content via flex, no wrap
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(30,41,59,0.6)",
    borderWidth: 1,
    borderColor: "rgba(51,65,85,0.4)",
    borderRadius: RADIUS.xl,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});

export default TechMarquee;
