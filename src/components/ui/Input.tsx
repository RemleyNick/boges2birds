import { forwardRef } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native'

import { colors } from '@/constants/colors'
import { FONT, RADIUS, SPACING } from '@/constants/tokens'

interface Props extends TextInputProps {
  label?: string
  error?: string
  containerStyle?: ViewStyle
}

export const Input = forwardRef<TextInput, Props>(function Input(
  { label, error, containerStyle, style, ...rest },
  ref,
) {
  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textSubtle}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
})

const styles = StyleSheet.create({
  label: {
    fontSize: FONT.sm,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: SPACING.xs + 2, // 6
  },
  input: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2, // 14
    fontSize: FONT.base,
    color: colors.text,
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.danger,
  },
  error: {
    fontSize: FONT.sm,
    color: colors.danger,
    marginTop: SPACING.xs + 2,
  },
})
