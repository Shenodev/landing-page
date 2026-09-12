import { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, View, LayoutChangeEvent } from "react-native";
import { COLORS } from "./src/theme";
import Navbar from "./src/components/Navbar";
import Hero from "./src/components/Hero";
import TechMarquee from "./src/components/TechMarquee";
import Services from "./src/components/Services";
import Work from "./src/components/Work";
import ContactForm from "./src/components/ContactForm";
import Footer from "./src/components/Footer";
import ErrorBoundary from "./src/components/ErrorBoundary";
import DiscoveryScreen from "./src/screens/Discovery";

const App = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});
  const [screen, setScreen] = useState<"home" | "discovery">("home");

  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent): void => {
      console.error("[mobile:unhandledRejection]", event.reason);
    };
    const g = globalThis as unknown as {
      ErrorUtils?: { getGlobalHandler: () => (e: Error, f?: boolean) => void; setGlobalHandler: (h: (e: Error, f?: boolean) => void) => void };
    };
    const prevHandler = g.ErrorUtils?.getGlobalHandler();
    const globalHandler = (error: Error, isFatal?: boolean): void => {
      console.error("[mobile:uncaughtException]", error.message, error.stack, `fatal:${isFatal}`);
      if (prevHandler) prevHandler(error, isFatal);
    };
    if (g.ErrorUtils?.setGlobalHandler) {
      g.ErrorUtils.setGlobalHandler(globalHandler);
    }
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("unhandledrejection", handleRejection as EventListener);
      return () => window.removeEventListener("unhandledrejection", handleRejection as EventListener);
    }
    return undefined;
  }, []);

  const handleLayout = (key: string) => (event: LayoutChangeEvent): void => {
    sectionOffsets.current[key] = event.nativeEvent.layout.y;
  };

  const handleNavigate = (target: string): void => {
    if (target === "discovery") {
      setScreen("discovery");
      return;
    }
    if (target === "top") {
      setScreen("home");
      setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: true }), 50);
      return;
    }
    // If on discovery, go home first then scroll
    if (screen === "discovery") {
      setScreen("home");
      setTimeout(() => {
        const offset: number | undefined = sectionOffsets.current[target];
        if (offset !== undefined) scrollViewRef.current?.scrollTo({ y: Math.max(0, offset - 8), animated: true });
      }, 100);
      return;
    }
    const offset: number | undefined = sectionOffsets.current[target];
    if (offset !== undefined) {
      scrollViewRef.current?.scrollTo({ y: Math.max(0, offset - 8), animated: true });
    } else {
      console.warn(`[App] Unknown section: ${target}`, sectionOffsets.current);
    }
  };

  return (
    <ErrorBoundary>
      <View style={styles.root}>
        <StatusBar style="light" />
        <Navbar onNavigate={handleNavigate} />
        {screen === "discovery" ? (
          <DiscoveryScreen onBack={() => setScreen("home")} />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View onLayout={handleLayout("top")}>
              <Hero onNavigate={handleNavigate} />
            </View>
            <View onLayout={handleLayout("tech")}>
              <TechMarquee />
            </View>
            <View onLayout={handleLayout("services")}>
              <Services />
            </View>
            <View onLayout={handleLayout("work")}>
              <Work />
            </View>
            <View onLayout={handleLayout("contact")}>
              <ContactForm />
            </View>
            <Footer />
          </ScrollView>
        )}
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 0,
  },
});

export default App;
