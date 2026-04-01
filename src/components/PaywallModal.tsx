import { Modal, SafeAreaView, Text, TouchableOpacity, View } from 'react-native'
import RevenueCatUI from 'react-native-purchases-ui'

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
      </View>
    </Modal>
  )
}
