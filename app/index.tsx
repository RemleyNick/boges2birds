import { LilitaOne_400Regular, useFonts as useLilita } from "@expo-google-fonts/lilita-one";
import { DancingScript_600SemiBold, useFonts as useDancing } from "@expo-google-fonts/dancing-script";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useUserStore } from "@/store/userStore";

export default function WelcomeScreen() {
  const router = useRouter();
  const isAuthReady = useUserStore((s) => s.isAuthReady);
  const isGuest = useUserStore((s) => s.isGuest);

  const [lilitaLoaded] = useLilita({ LilitaOne_400Regular });
  const [dancingLoaded] = useDancing({ DancingScript_600SemiBold });

  // Redirect authenticated users straight to tabs
  useEffect(() => {
    if (isAuthReady && !isGuest) {
      router.replace("/(tabs)");
    }
  }, [isAuthReady, isGuest]);

  if (!lilitaLoaded || !dancingLoaded) return null;

  return (
    <ImageBackground
      source={require("../assets/images/bg-welcome.jpg")}
      style={styles.root}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.inner}>

          {/* Brand */}
          <View style={styles.brandSection}>
            <Text style={styles.preTitle}>Turn your</Text>
            <Text style={styles.appName}>Boges2Birds!</Text>
            <Text style={styles.tagline}>Your personal path to breaking par.</Text>
          </View>

          {/* CTA */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              onPress={() => router.push("/(onboarding)/program-select")}
              style={styles.ctaButton}
              activeOpacity={0.7}
            >
              <Text style={styles.ctaText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-in")}
              activeOpacity={0.7}
            >
              <Text style={styles.signInText}>
                Already have an account? <Text style={styles.signInLink}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.42)",
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 40,
    justifyContent: "space-between",
  },

  // Brand
  brandSection: {
    alignItems: "flex-start",
  },
  preTitle: {
    fontFamily: "LilitaOne_400Regular",
    fontSize: 28,
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: 4,
  },
  appName: {
    fontFamily: "LilitaOne_400Regular",
    fontSize: 52,
    color: "#FFFFFF",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: "DancingScript_600SemiBold",
    fontSize: 22,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 30,
  },

  // Bottom block
  bottomSection: {
    gap: 20,
    alignItems: "center",
  },

  // Frosted glass button
  ctaButton: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.55)",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    alignSelf: "stretch",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  // Sign in link
  signInText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  signInLink: {
    color: "#FFFFFF",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
