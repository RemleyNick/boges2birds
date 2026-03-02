import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { colors } from '@/constants/colors'
import { useEntitlement } from '@/hooks/useEntitlement'
import { usePaywall } from '@/hooks/usePaywall'
import {
  useCompleteSession,
  useSessionDetails,
  useToggleDrill,
} from '@/hooks/useSessionDetails'
import type { SkillArea } from '@/types'

const SKILL_LABELS: Record<SkillArea, string> = {
  teeShot: 'Tee Shots',
  irons: 'Iron Play',
  shortGame: 'Short Game',
  putting: 'Putting',
  courseMgmt: 'Course Management',
}

export default function PracticeScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const router = useRouter()
  const { data: session, isLoading } = useSessionDetails(sessionId!)
  const toggleDrill = useToggleDrill(sessionId!)
  const completeSessionMutation = useCompleteSession(sessionId!)
  const { isPremium } = useEntitlement()
  const { showPaywall } = usePaywall()

  const isComplete = session?.status === 'complete'
  const isReadOnly = !isPremium && (session?.weekNumber ?? 1) === 1
  const isLockedWeek = !isPremium && (session?.weekNumber ?? 1) > 1

  function handleToggleDrill(sessionDrillId: string, currentlyCompleted: boolean) {
    if (isComplete || isReadOnly) return
    toggleDrill.mutate({ sessionDrillId, completed: !currentlyCompleted })
  }

  async function handleCompleteSession() {
    if (isComplete) return

    // Mark any incomplete drills as complete
    const incompleteDrills = session?.drills.filter((d) => !d.completed) ?? []
    for (const drill of incompleteDrills) {
      toggleDrill.mutate({ sessionDrillId: drill.id, completed: true })
    }

    await completeSessionMutation.mutateAsync()
    router.back()
  }

  if (isLoading || !session) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      </SafeAreaView>
    )
  }

  if (isLockedWeek) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockedIcon}>{'\u{1F512}'}</Text>
          <Text style={styles.lockedTitle}>Premium Content</Text>
          <Text style={styles.lockedBody}>
            Upgrade to Premium to access weeks 2–4 of your training plan.
          </Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={() => showPaywall()}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {SKILL_LABELS[session.primarySkill as SkillArea]}
          </Text>
          <Text style={styles.headerMeta}>
            {session.durationMinutes} min &middot; {session.sessionType}
          </Text>
        </View>
      </View>

      {/* Drill List */}
      <ScrollView contentContainerStyle={styles.drillList}>
        {session.drills.map((sd) => (
          <TouchableOpacity
            key={sd.id}
            style={styles.drillCard}
            onPress={() => handleToggleDrill(sd.id, sd.completed)}
            activeOpacity={isComplete || isReadOnly ? 1 : 0.7}
          >
            {/* Checkbox (hidden in read-only mode) */}
            {!isReadOnly && (
              <View
                style={[
                  styles.checkbox,
                  sd.completed && styles.checkboxChecked,
                ]}
              >
                {sd.completed && <Text style={styles.checkmark}>&#10003;</Text>}
              </View>
            )}

            {/* Drill Info */}
            <View style={styles.drillInfo}>
              <Text style={styles.drillName} numberOfLines={2}>{sd.drill.name}</Text>
              <Text style={styles.drillInstructions} numberOfLines={3}>
                {sd.drill.instructions}
              </Text>
            </View>

            {/* Duration Badge */}
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{sd.drill.durationMinutes} min</Text>
            </View>
          </TouchableOpacity>
        ))}

        {isReadOnly && (
          <View style={styles.readOnlyBanner}>
            <Text style={styles.readOnlyText}>
              This is a preview. Upgrade to track your progress.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Complete Button (hidden in read-only mode) */}
      {!isReadOnly && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.completeButton, isComplete && styles.completeButtonDisabled]}
            onPress={handleCompleteSession}
            disabled={isComplete || completeSessionMutation.isPending}
            activeOpacity={0.8}
          >
            <Text style={styles.completeButtonText}>
              {isComplete ? 'Session Complete' : 'Complete Session'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loader: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
  },
  headerInfo: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerMeta: {
    fontSize: 14,
    color: colors.textMuted,
  },
  drillList: {
    padding: 20,
    gap: 12,
    paddingBottom: 100,
  },
  drillCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.disabled,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  drillInfo: {
    flex: 1,
    gap: 4,
  },
  drillName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  drillInstructions: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  durationBadge: {
    backgroundColor: colors.pillInactive,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSubtle,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  completeButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  lockedOverlay: {
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
  readOnlyBanner: {
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  readOnlyText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
    textAlign: 'center',
  },
})
