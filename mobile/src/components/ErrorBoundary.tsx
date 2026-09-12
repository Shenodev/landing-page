import React, { Component, ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "../theme";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Senior-level: log to monitoring service, not just console
    console.error("[mobile:error-boundary]", error.message, error.stack, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>⚠️</Text>
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.sub}>A critical error occurred. Please restart the app. If it persists, contact support.</Text>
          <Text style={styles.errorMsg}>{this.state.error?.message}</Text>
          <Pressable onPress={this.handleReset} style={styles.button}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "rgba(248,113,113,0.15)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 28,
    color: "#F87171",
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
  sub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  errorMsg: {
    color: "#F87171",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
  button: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#003640",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default ErrorBoundary;
