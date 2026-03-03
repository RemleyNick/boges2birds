import { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { colors } from '@/constants/colors'
import { useEntitlement } from '@/hooks/useEntitlement'
import { usePaywall } from '@/hooks/usePaywall'
import { useSaveRoundLog } from '@/hooks/useRoundLogs'
import { useUserStore } from '@/store/userStore'

type HolesOption = 9 | 18

export default function LogRoundScreen() {
  const userId = useUserStore((s) => s.userId)
  const saveRound = useSaveRoundLog(userId ?? '')
  const { isPremium } = useEntitlement()
  const { showPaywall } = usePaywall()

  const [holesPlayed, setHolesPlayed] = useState<HolesOption>(18)
  const [courseName, setCourseName] = useState('')
  const [totalScore, setTotalScore] = useState('')
  const [fairwaysHit, setFairwaysHit] = useState('')
  const [girHit, setGirHit] = useState('')
  const [totalPutts, setTotalPutts] = useState('')
  const [penalties, setPenalties] = useState('')

  const [fairwaysTotal, setFairwaysTotal] = useState('14')
  const girTotal = holesPlayed === 18 ? 18 : 9

  function resetForm() {
    setHolesPlayed(18)
    setCourseName('')
    setTotalScore('')
    setFairwaysHit('')
    setFairwaysTotal('14')
    setGirHit('')
    setTotalPutts('')
    setPenalties('')
  }

  function handleSave() {
    const score = parseInt(totalScore, 10)
    if (!totalScore || isNaN(score)) {
      Alert.alert('Score required', 'Please enter your total score.')
      return
    }

    const fwHit = parseInt(fairwaysHit, 10) || 0
    const fwTotal = parseInt(fairwaysTotal, 10) || (holesPlayed === 18 ? 14 : 7)
    const gHit = parseInt(girHit, 10) || 0
    const putts = parseInt(totalPutts, 10) || 0
    const pens = parseInt(penalties, 10) || 0

    const errors: string[] = []
    if (score < 18 || score > 200) errors.push('Score must be between 18 and 200.')
    if (fwHit > fwTotal) errors.push('Fairways hit cannot exceed fairways total.')
    if (gHit > girTotal) errors.push('GIR hit cannot exceed GIR total.')
    if (putts < 0 || putts > holesPlayed * 4) errors.push(`Putts must be between 0 and ${holesPlayed * 4}.`)
    if (pens < 0 || pens > 20) errors.push('Penalties must be between 0 and 20.')

    if (errors.length > 0) {
      Alert.alert('Invalid input', errors.join('\n'))
      return
    }

    saveRound.mutate(
      {
        playedAt: new Date(),
        courseName: courseName.trim().slice(0, 100) || null,
        holesPlayed,
        totalScore: score,
        fairwaysHit: fwHit,
        fairwaysTotal: fwTotal,
        girHit: gHit,
        girTotal,
        totalPutts: putts,
        penalties: pens,
      },
      {
        onSuccess: () => {
          Alert.alert('Round saved!', 'Your round has been logged.')
          resetForm()
        },
        onError: () => {
          Alert.alert('Save failed', 'Something went wrong saving your round. Please try again.')
        },
      },
    )
  }

  if (!isPremium) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedIcon}>{'\u{1F512}'}</Text>
          <Text style={styles.lockedTitle}>Log Rounds with Premium</Text>
          <Text style={styles.lockedBody}>
            Track your scores and stats to get personalized practice plans.
          </Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={() => showPaywall()}>
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Log a Round</Text>

          {/* Course name */}
          <Text style={styles.label}>Course</Text>
          <TextInput
            style={styles.input}
            placeholder="Course name (optional)"
            placeholderTextColor={colors.textSubtle}
            value={courseName}
            onChangeText={setCourseName}
          />

          {/* Holes played */}
          <Text style={styles.label}>Holes Played</Text>
          <View style={styles.pillRow}>
            {([9, 18] as HolesOption[]).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.pill, holesPlayed === opt && styles.pillActive]}
                onPress={() => {
                  setHolesPlayed(opt)
                  setFairwaysTotal(opt === 18 ? '14' : '7')
                }}
              >
                <Text style={[styles.pillText, holesPlayed === opt && styles.pillTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Total score */}
          <Text style={styles.label}>Total Score *</Text>
          <TextInput
            style={[styles.input, styles.scoreInput]}
            placeholder="e.g. 95"
            placeholderTextColor={colors.textSubtle}
            keyboardType="number-pad"
            value={totalScore}
            onChangeText={setTotalScore}
          />

          {/* Fairways hit */}
          <Text style={styles.label}>Fairways Hit</Text>
          <View style={styles.statRow}>
            <TextInput
              style={[styles.input, styles.statInput]}
              placeholder="0"
              placeholderTextColor={colors.textSubtle}
              keyboardType="number-pad"
              value={fairwaysHit}
              onChangeText={setFairwaysHit}
            />
            <Text style={styles.statDivider}>/</Text>
            <TextInput
              style={[styles.input, styles.statInput]}
              placeholder={holesPlayed === 18 ? '14' : '7'}
              placeholderTextColor={colors.textSubtle}
              keyboardType="number-pad"
              value={fairwaysTotal}
              onChangeText={setFairwaysTotal}
            />
          </View>

          {/* GIR hit */}
          <Text style={styles.label}>Greens in Regulation</Text>
          <View style={styles.statRow}>
            <TextInput
              style={[styles.input, styles.statInput]}
              placeholder="0"
              placeholderTextColor={colors.textSubtle}
              keyboardType="number-pad"
              value={girHit}
              onChangeText={setGirHit}
            />
            <Text style={styles.statDivider}>/ {girTotal}</Text>
          </View>

          {/* Total putts */}
          <Text style={styles.label}>Total Putts</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.textSubtle}
            keyboardType="number-pad"
            value={totalPutts}
            onChangeText={setTotalPutts}
          />

          {/* Penalties */}
          <Text style={styles.label}>Penalties</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.textSubtle}
            keyboardType="number-pad"
            value={penalties}
            onChangeText={setPenalties}
          />

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveButton, saveRound.isPending && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saveRound.isPending}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {saveRound.isPending ? 'Saving…' : 'Save Round'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 6,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  scoreInput: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  pill: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  pillActive: {
    backgroundColor: colors.accent,
  },
  pillText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statInput: {
    flex: 1,
  },
  statDivider: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  lockedIcon: {
    fontSize: 48,
    marginBottom: 4,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  lockedBody: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
})
