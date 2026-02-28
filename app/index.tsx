import { useRouter } from "expo-router";
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require("../assets/images/bg-welcome.jpg")}
      style={styles.root}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.inner}>

          {/* Brand — sits in the upper third */}
          <View style={styles.brandSection}>
            <Text style={styles.preTitle}>Let's turn your</Text>
            <Text style={styles.appName}>Boges2Birds</Text>
          </View>

          {/* Bottom — motivational copy + CTA */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              onPress={() => router.push("/(onboarding)/program-select")}
              style={styles.ctaButton}
              activeOpacity={0.7}
            >
              <Text style={styles.ctaText}>Get Started</Text>
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
    fontSize: 20,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.8)",
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  appName: {
    fontSize: 44,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
    marginBottom: 8,
  },
  // Bottom block
  bottomSection: {
    gap: 28,
  },
  // Frosted glass button
  ctaButton: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.55)",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
});
