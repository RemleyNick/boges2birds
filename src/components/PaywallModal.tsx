import { Linking, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import RevenueCatUI from 'react-native-purchases-ui'
import { colors } from '@/constants/colors'
import { PRIVACY_POLICY_URL, TERMS_URL } from '@/constants/legal'

type Props = {
  visible: boolean
  onClose: (purchased: boolean) => void
}

export function PaywallModal({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => onClose(false)}
    >
      <View style={{ flex: 1 }}>
        <RevenueCatUI.Paywall
          onPurchaseCompleted={() => onClose(true)}
          onRestoreCompleted={() => onClose(true)}
          onDismiss={() => onClose(false)}
        />
        <SafeAreaView
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={() => onClose(false)}
            style={{ padding: 16 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 20, color: '#1A1A1A', fontWeight: '600' }}>✕</Text>
          </TouchableOpacity>
        </SafeAreaView>
        <SafeAreaView style={styles.legalFooter}>
          <View style={styles.legalRow}>
            <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)} activeOpacity={0.7}>
              <Text style={styles.legalLink}>Terms of Use</Text>
            </TouchableOpacity>
            <Text style={styles.legalSep}> · </Text>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} activeOpacity={0.7}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  legalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  legalLink: {
    fontSize: 12,
    color: colors.textSubtle,
    textDecorationLine: 'underline',
  },
  legalSep: {
    fontSize: 12,
    color: colors.textSubtle,
  },
})
