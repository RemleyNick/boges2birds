import { useRouter } from "expo-router";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";

import { colors } from "@/constants/colors";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 32 }}>
        {/* Top section: icon + brand */}
        <View
          style={{
            flex: 0.55,
            alignItems: "center",
            justifyContent: "flex-end",
            paddingBottom: 24,
          }}
        >
          <Text style={{ fontSize: 72, marginBottom: 8 }}>🏌️</Text>
          <Text
            style={{
              fontSize: 36,
              fontWeight: "bold",
              color: colors.text,
              letterSpacing: -0.5,
              marginBottom: 8,
            }}
          >
            Boges2Birds
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.textMuted,
              textAlign: "center",
            }}
          >
            Your personal golf training system.
          </Text>
        </View>

        {/* Bottom section: CTA + subtext */}
        <View style={{ flex: 0.45, justifyContent: "flex-end" }}>
          <TouchableOpacity
            onPress={() => router.push("/(onboarding)/program-select")}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
              marginBottom: 24,
            }}
            activeOpacity={0.85}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 17,
                fontWeight: "600",
              }}
            >
              Get Started
            </Text>
          </TouchableOpacity>

          <View
            style={{
              height: 1,
              backgroundColor: "#E5E5E5",
              marginBottom: 20,
            }}
          />

          <Text
            style={{
              fontSize: 13,
              color: colors.textSubtle,
              textAlign: "center",
              fontStyle: "italic",
              lineHeight: 20,
            }}
          >
            {"Break 100. Break 90.\nBreak 80. We'll get you there."}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
