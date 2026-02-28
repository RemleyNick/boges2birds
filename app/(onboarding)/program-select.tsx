import { SafeAreaView, Text, View } from "react-native";

import { colors } from "@/constants/colors";

export default function ProgramSelectScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 20, fontWeight: "600", color: colors.text }}>
          Program Selection
        </Text>
        <Text
          style={{ fontSize: 14, color: colors.textMuted, marginTop: 8 }}
        >
          Coming soon
        </Text>
      </View>
    </SafeAreaView>
  );
}
