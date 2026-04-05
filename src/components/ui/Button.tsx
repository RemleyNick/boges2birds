import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native'

import { colors } from '@/constants/colors'
import { FONT, RADIUS, SPACING } from '@/constants/tokens'

type Variant = 'primary' | 'secondary' | 'danger'

interface Props extends Omit<TouchableOpacityProps, 'style'> {
  title: string
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
  style?: ViewStyle
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  disabled,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled || loading
  const containerStyle: ViewStyle[] = [
    styles.base,
    variantContainer[variant],
    fullWidth ? styles.fullWidth : null,
    isDisabled ? styles.disabled : null,
    style ?? null,
  ].filter(Boolean) as ViewStyle[]

  const textStyle: TextStyle[] = [styles.text, variantText[variant]]

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={isDisabled}
      style={containerStyle}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.accent : '#FFFFFF'} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg + 2, // 18
    paddingHorizontal: SPACING['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: FONT.lg - 1, // 17
    fontWeight: '600',
  },
})

const variantContainer: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.danger },
}

const variantText: Record<Variant, TextStyle> = {
  primary: { color: '#FFFFFF' },
  secondary: { color: colors.accent },
  danger: { color: '#FFFFFF' },
}
