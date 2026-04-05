import { LilitaOne_400Regular, useFonts as useLilita } from "@expo-google-fonts/lilita-one";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui";
import { colors } from "@/constants/colors";
import { FONT, SPACING } from "@/constants/tokens";
import { useUserStore } from "@/store/userStore";

export default function WelcomeScreen() {
  const router = useRouter();
  const isAuthReady = useUserStore((s) => s.isAuthReady);
  const isGuest = useUserStore((s) => s.isGuest);

  const [lilitaLoaded] = useLilita({ LilitaOne_400Regular });

  // Redirect authenticated users straight to tabs
  useEffect(() => {
    if (isAuthReady && !isGuest) {
      router.replace("/(tabs)");
    }
  }, [isAuthReady, isGuest]);

  if (!lilitaLoaded) return null;

  return (
    <SafeAreaView style={styles.root}>
      {/* Soft mint wash behind the hero — approximates a gradient without adding a dep */}
      <View style={styles.mintWash} pointerEvents="none" />

      <View style={styles.inner}>
        <View style={styles.hero}>
          <View style={styles.iconBadge}>
            <Ionicons name="golf" size={56} color={colors.accent} />
          </View>
          <Text style={styles.appName}>Boges2Birds</Text>
          <Text style={styles.tagline}>Turn bogeys into birdies.</Text>
        </View>

        <View style={styles.bottomSection}>
          <Button
            title="Get Started"
            onPress={() => router.push("/(onboarding)/program-select")}
          />
          <TouchableOpacity
            onPress={() => router.push("/(auth)/sign-in")}
            activeOpacity={0.7}
            style={styles.signInBtn}
          >
            <Text style={styles.signInText}>
              Already have an account? <Text style={styles.signInLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mintWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "62%",
    backgroundColor: colors.accentLight,
    borderBottomLeftRadius: 220,
    borderBottomRightRadius: 220,
    transform: [{ scaleX: 1.4 }],
  },
  inner: {
    flex: 1,
    paddingHorizontal: SPACING['2xl'] + 4, // 28
    paddingTop: SPACING['3xl'] + 16, // 48
    paddingBottom: SPACING['3xl'] + 8, // 40
    justifyContent: "space-between",
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING['2xl'],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  appName: {
    fontFamily: "LilitaOne_400Regular",
    fontSize: FONT['3xl'], // 36
    color: colors.text,
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  tagline: {
    fontSize: FONT.base,
    color: colors.textMuted,
    lineHeight: 24,
    textAlign: "center",
  },
  bottomSection: {
    gap: SPACING.lg,
    alignItems: "center",
  },
  signInBtn: {
    paddingVertical: SPACING.sm,
  },
  signInText: {
    color: colors.textMuted,
    fontSize: FONT.sm + 1, // 15
  },
  signInLink: {
    color: colors.accent,
    fontWeight: "600",
  },
});
