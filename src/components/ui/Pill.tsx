import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'

import { colors } from '@/constants/colors'
import { FONT, RADIUS, SPACING } from '@/constants/tokens'

interface Props {
  label: string
  selected?: boolean
  onPress?: () => void
  style?: ViewStyle
}

export function Pill({ label, selected = false, onPress, style }: Props) {
  const containerStyle: ViewStyle[] = [
    styles.base,
    selected ? styles.selected : styles.unselected,
    style ?? null,
  ].filter(Boolean) as ViewStyle[]

  const content = (
    <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>
      {label}
    </Text>
  )

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={containerStyle}>
        {content}
      </TouchableOpacity>
    )
  }

  return <View style={containerStyle}>{content}</View>
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2, // 10
    alignSelf: 'flex-start',
  },
  selected: {
    backgroundColor: colors.accent,
  },
  unselected: {
    backgroundColor: colors.cardBg,
  },
  label: {
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  labelUnselected: {
    color: colors.textMuted,
  },
})
