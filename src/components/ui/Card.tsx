import { ReactNode } from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'

import { colors } from '@/constants/colors'
import { RADIUS, SPACING } from '@/constants/tokens'

interface Props {
  children: ReactNode
  interactive?: boolean
  elevated?: boolean
  onPress?: () => void
  disabled?: boolean
  style?: ViewStyle
}

export function Card({
  children,
  interactive = false,
  elevated = false,
  onPress,
  disabled,
  style,
}: Props) {
  const containerStyle: ViewStyle[] = [
    styles.base,
    elevated ? styles.elevated : null,
    disabled ? styles.disabled : null,
    style ?? null,
  ].filter(Boolean) as ViewStyle[]

  if (interactive || onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        disabled={disabled}
        style={containerStyle}
      >
        {children}
      </TouchableOpacity>
    )
  }

  return <View style={containerStyle}>{children}</View>
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
  },
  elevated: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  disabled: {
    opacity: 0.5,
  },
})
