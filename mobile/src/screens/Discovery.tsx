import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { COLORS, RADIUS } from "../theme";
import { discoverySchema } from "../schemas/discovery";

type Props = {
  onBack?: () => void;
};

const DiscoveryScreen = ({ onBack }: Props) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [form, setForm] = useState<Record<string, string>>({
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    businessDesc: "",
    targetAudience: "",
    competitors: "",
    brandStatus: "ready",
    references: "",
    dislikes: "",
    targetPackage: "dashboard",
    requiredFeatures: "",
    integrations: "",
    launchDate: "",
    extraDetails: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: string): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleContinue = (): void => {
    const parsed = discoverySchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const k = String(issue.path[0]);
        fieldErrors[k] = issue.message;
      });
      setErrors(fieldErrors);
      Alert.alert("Validation", "Please fix highlighted fields");
      return;
    }
    setStep(2);
  };

  const handleCalendlyMessage = async (event: { nativeEvent: { data: string } }): Promise<void> => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      // Calendly sends {event: "calendly.event_scheduled", payload: {event: {uri}, invitee: {uri}}}
      if (data.event === "calendly.event_scheduled" || data.payload) {
        const payload = data.payload || data;
        const eventUri: string = payload.event?.uri || payload.uri || "";
        const inviteeUri: string = payload.invitee?.uri || "";
        const now = new Date();
        const meetingDate: string = now.toISOString().split("T")[0];
        const meetingTime: string = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const meetingUrl: string = eventUri || "https://calendly.com/shenodev/discovery";

        await submitDiscovery({ meetingDate, meetingTime, meetingUrl, calendlyEventUri: eventUri, calendlyEventUrl: inviteeUri });
      }
    } catch (err) {
      console.error("[discovery] WebView message parse failed", err);
    }
  };

  const handleNavStateChange = (navState: { url: string }): void => {
    // Intercept Calendly confirmation URL
    if (navState.url.includes("is_scheduled") || navState.url.includes("confirmed") || navState.url.includes("thank_you")) {
      const now = new Date();
      submitDiscovery({
        meetingDate: now.toISOString().split("T")[0],
        meetingTime: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        meetingUrl: navState.url,
        calendlyEventUri: navState.url,
      });
    }
  };

  const submitDiscovery = async (meeting: { meetingDate: string; meetingTime: string; meetingUrl: string; calendlyEventUri?: string; calendlyEventUrl?: string }): Promise<void> => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = { ...form, ...meeting, calendlyEventUrl: meeting.calendlyEventUrl || meeting.meetingUrl };
      const backendUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL;
      if (!backendUrl) throw new Error("EXPO_PUBLIC_API_URL not configured");
      const res: Response = await fetch(`${backendUrl}/api/discovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = ((await res.json().catch(() => ({ message: "Failed" }))) as { message: string }).message;
        throw new Error(d);
      }
      Alert.alert("Success", "Discovery submitted! We will review within 24-48 hours and your meeting is confirmed.", [{ text: "OK", onPress: () => onBack?.() }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const calendlyUrl: string = process.env.EXPO_PUBLIC_CALENDLY_URL || "https://calendly.com/shenodev/discovery";

  const injectedJS = `
    window.addEventListener('message', function(e) {
      if (e.data.event && e.data.event.indexOf('calendly') !== -1) {
        window.ReactNativeWebView.postMessage(JSON.stringify(e.data));
      }
    });
    true;
  `;

  if (step === 2) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setStep(1)} style={styles.backBtn}>
            <Text style={styles.backText}>← Back to Form</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Schedule Your Call</Text>
          <Text style={styles.headerSub}>Pick a time — we&apos;ll auto-submit your discovery + meeting.</Text>
        </View>
        <WebView
          source={{ uri: calendlyUrl }}
          injectedJavaScript={injectedJS}
          onMessage={handleCalendlyMessage}
          onNavigationStateChange={handleNavStateChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading Calendly...</Text>
            </View>
          )}
          style={styles.webview}
        />
        {submitting && (
          <View style={styles.submittingOverlay}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.submittingText}>Submitting discovery + meeting...</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>SHENODEV ONBOARDING | Project Discovery</Text>
          </View>
          <Text style={styles.heading}>Tell Us About Your Vision</Text>
          <Text style={styles.sub}>Help us engineer the ideal digital architecture. Fill out this 5-step questionnaire.</Text>
        </View>

        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>01 — Basic Information</Text>
          {[
            { key: "fullName", label: "Full Name *", placeholder: "Alex Vance" },
            { key: "companyName", label: "Company / Project Name *", placeholder: "Vance Dynamics Corp" },
            { key: "email", label: "Work Email *", placeholder: "alex@vancedynamics.io", keyboard: "email-address" },
            { key: "phone", label: "Phone / WhatsApp", placeholder: "+20 100 000 0000" },
          ].map((f) => (
            <View key={f.key} style={styles.field}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={[styles.input, errors[f.key] && styles.inputError]}
                placeholder={f.placeholder}
                placeholderTextColor="#475569"
                value={form[f.key]}
                onChangeText={(v) => handleChange(f.key, v)}
                keyboardType={(f.keyboard as never) || "default"}
                autoCapitalize="none"
              />
              {errors[f.key] && <Text style={styles.errorText}>{errors[f.key]}</Text>}
            </View>
          ))}
        </View>

        {/* Business & Audience */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>02 — Business & Audience</Text>
          {[
            { key: "businessDesc", label: "Core Product / Service Description *", placeholder: "What does your org do?", multiline: true },
            { key: "targetAudience", label: "Target Audience & ICP", placeholder: "B2B enterprise leads..." },
            { key: "competitors", label: "Top 2-3 Competitors", placeholder: "https://competitor-one.com" },
          ].map((f) => (
            <View key={f.key} style={styles.field}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={[styles.input, f.multiline && styles.textArea, errors[f.key] && styles.inputError]}
                placeholder={f.placeholder}
                placeholderTextColor="#475569"
                value={form[f.key]}
                onChangeText={(v) => handleChange(f.key, v)}
                multiline={!!f.multiline}
                numberOfLines={f.multiline ? 3 : 1}
              />
              {errors[f.key] && <Text style={styles.errorText}>{errors[f.key]}</Text>}
            </View>
          ))}
        </View>

        {/* Design & Branding */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>03 — Design & Branding</Text>
          <Text style={styles.label}>Brand Status *</Text>
          <View style={styles.radioRow}>
            {[
              { v: "ready", label: "Ready & Documented" },
              { v: "logo_only", label: "Logo Only" },
              { v: "need_identity", label: "Need Identity" },
            ].map((o) => (
              <Pressable key={o.v} onPress={() => handleChange("brandStatus", o.v)} style={[styles.radio, form.brandStatus === o.v && styles.radioActive]}>
                <Text style={[styles.radioText, form.brandStatus === o.v && styles.radioTextActive]}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
          {errors.brandStatus && <Text style={styles.errorText}>{errors.brandStatus}</Text>}
          {[
            { key: "references", label: "Reference Websites", placeholder: "linear.app for UX..." },
            { key: "dislikes", label: "Disliked Colors/Styles", placeholder: "Avoid neon pinks..." },
          ].map((f) => (
            <View key={f.key} style={styles.field}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={f.placeholder}
                placeholderTextColor="#475569"
                value={form[f.key]}
                onChangeText={(v) => handleChange(f.key, v)}
                multiline
              />
            </View>
          ))}
        </View>

        {/* Technical Needs */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>04 — Technical Needs & Scope</Text>
          <Text style={styles.label}>Target Package *</Text>
          <View style={styles.radioRow}>
            {[
              { v: "corporate", label: "Corporate (10k EGP)" },
              { v: "dashboard", label: "Dashboard (25k EGP)" },
              { v: "platform", label: "Platform (45k EGP)" },
            ].map((o) => (
              <Pressable key={o.v} onPress={() => handleChange("targetPackage", o.v)} style={[styles.radio, form.targetPackage === o.v && styles.radioActive]}>
                <Text style={[styles.radioText, form.targetPackage === o.v && styles.radioTextActive]}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
          {errors.targetPackage && <Text style={styles.errorText}>{errors.targetPackage}</Text>}
          {[
            { key: "requiredFeatures", label: "Top 3 Essential Features", placeholder: "1. Auth\n2. Billing\n3. Dashboard", multiline: true },
            { key: "integrations", label: "External Integrations", placeholder: "Resend, HubSpot, Stripe..." },
          ].map((f) => (
            <View key={f.key} style={styles.field}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={[styles.input, f.multiline && styles.textArea]}
                placeholder={f.placeholder}
                placeholderTextColor="#475569"
                value={form[f.key]}
                onChangeText={(v) => handleChange(f.key, v)}
                multiline={!!f.multiline}
              />
            </View>
          ))}
        </View>

        {/* Logistics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>05 — Logistics & Timeline</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Target Launch Date</Text>
            <TextInput
              style={styles.input}
              placeholder="2026-12-01"
              placeholderTextColor="#475569"
              value={form.launchDate}
              onChangeText={(v) => handleChange("launchDate", v)}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Extra Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="NDA, priority, etc."
              placeholderTextColor="#475569"
              value={form.extraDetails}
              onChangeText={(v) => handleChange("extraDetails", v)}
              multiline
            />
          </View>
        </View>

        <Pressable onPress={handleContinue} style={styles.submit}>
          <Text style={styles.submitText}>Continue to Scheduling →</Text>
        </Pressable>
        {onBack && (
          <Pressable onPress={onBack} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Back to Home</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
  hero: { alignItems: "center", gap: 12, paddingVertical: 12 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(30,41,59,0.8)", borderWidth: 1, borderColor: "rgba(51,65,85,0.4)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  badgeText: { color: COLORS.primary, fontSize: 11, fontWeight: "700", letterSpacing: 0.7 },
  heading: { color: COLORS.text, fontSize: 26, fontWeight: "800", textAlign: "center" },
  sub: { color: COLORS.onSurfaceVariant, fontSize: 13, textAlign: "center", lineHeight: 18 },
  card: { backgroundColor: "rgba(30,41,59,0.7)", borderWidth: 1, borderColor: "rgba(51,65,85,0.3)", borderRadius: RADIUS.xl, padding: 16, gap: 12 },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  field: { gap: 6 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  input: { backgroundColor: "rgba(2,6,23,0.8)", borderWidth: 1, borderColor: "rgba(51,65,85,0.4)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.text, fontSize: 14 },
  inputError: { borderColor: "#F87171" },
  errorText: { color: "#F87171", fontSize: 11 },
  textArea: { height: 80, textAlignVertical: "top" },
  radioRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  radio: { flex: 1, minWidth: 90, borderWidth: 1, borderColor: "rgba(51,65,85,0.4)", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 8, alignItems: "center", backgroundColor: "rgba(2,6,23,0.5)" },
  radioActive: { borderColor: COLORS.primary, backgroundColor: "rgba(6,182,212,0.15)" },
  radioText: { color: COLORS.onSurfaceVariant, fontSize: 12, fontWeight: "600", textAlign: "center" },
  radioTextActive: { color: COLORS.primary },
  submit: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  submitText: { color: "#003640", fontSize: 15, fontWeight: "800" },
  backLink: { alignItems: "center", paddingVertical: 12 },
  backLinkText: { color: COLORS.onSurfaceVariant, fontSize: 13 },
  header: { padding: 16, gap: 8, backgroundColor: "rgba(30,41,59,0.9)", borderBottomWidth: 1, borderBottomColor: "rgba(51,65,85,0.3)" },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700", textAlign: "center" },
  headerSub: { color: COLORS.onSurfaceVariant, fontSize: 12, textAlign: "center" },
  backBtn: { alignSelf: "flex-start", paddingVertical: 6 },
  backText: { color: COLORS.primary, fontSize: 13, fontWeight: "600" },
  webview: { flex: 1, height: 700, backgroundColor: "#fff" },
  loading: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", gap: 12, backgroundColor: COLORS.background },
  loadingText: { color: COLORS.onSurfaceVariant, fontSize: 13 },
  submittingOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, top: 0, backgroundColor: "rgba(15,23,42,0.85)", justifyContent: "center", alignItems: "center", gap: 12 },
  submittingText: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
});

export default DiscoveryScreen;
