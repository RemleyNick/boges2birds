import { useRouter } from 'expo-router'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { colors } from '@/constants/colors'
import { useActiveTrainingBlock } from '@/hooks/useActiveTrainingBlock'
import { useEntitlement } from '@/hooks/useEntitlement'
import { usePaywall } from '@/hooks/usePaywall'
import { useUserStore } from '@/store/userStore'
import type { SkillArea } from '@/types'

const SKILL_LABELS: Record<SkillArea, string> = {
  teeShot: 'Tee Shots',
  irons: 'Iron Play',
  shortGame: 'Short Game',
  putting: 'Putting',
  courseMgmt: 'Course Management',
}

const WEEK_THEMES: Record<number, string> = {
  1: 'Foundation',
  2: 'Build',
  3: 'Peak',
  4: 'Consolidate',
}

export default function HomeScreen() {
  const router = useRouter()
  const userId = useUserStore((s) => s.userId)
  const { data: blockData, isLoading } = useActiveTrainingBlock(userId)
  const { isPremium } = useEntitlement()
  const { showPaywall } = usePaywall()

  const currentWeek = (() => {
    if (!blockData?.weekStartDate) return 1
    const msPerWeek = 7 * 24 * 60 * 60 * 1000
    const elapsed = Date.now() - new Date(blockData.weekStartDate).getTime()
    return Math.max(1, Math.min(4, Math.floor(elapsed / msPerWeek) + 1))
  })()
  const weekSessions = blockData?.sessions.filter((s) => s.weekNumber === currentWeek) ?? []

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      </SafeAreaView>
    )
  }

  if (!blockData) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No active plan</Text>
          <Text style={styles.emptyBody}>
            Complete onboarding to get your first 4-week practice block.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>
          Week {currentWeek} — {WEEK_THEMES[currentWeek]}
        </Text>
        {weekSessions.map((session) => {
          const isDone = session.status === 'complete'
          const isLocked = !isPremium && currentWeek > 1
          return (
            <TouchableOpacity
              key={session.id}
              style={[styles.card, isDone && styles.cardDone, isLocked && styles.cardLocked]}
              onPress={() => isLocked ? showPaywall() : router.push(`/practice/${session.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Text style={[styles.skill, isLocked && styles.lockedText]} numberOfLines={1}>
                  {isLocked ? '\u{1F512} ' : ''}{SKILL_LABELS[session.primarySkill as SkillArea]}
                </Text>
                {isLocked ? (
                  <Text style={styles.lockedMeta}>Upgrade to unlock</Text>
                ) : (
                  <Text style={styles.meta}>{session.durationMinutes} min</Text>
                )}
              </View>
              {isDone && !isLocked && (
                <View style={styles.doneBadge}>
                  <Text style={styles.doneBadgeText}>Done</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>
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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDone: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skill: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: 14,
    color: colors.textMuted,
  },
  doneBadge: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 12,
  },
  doneBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardLocked: {
    opacity: 0.5,
  },
  lockedText: {
    color: colors.textSubtle,
  },
  lockedMeta: {
    fontSize: 13,
    color: colors.textSubtle,
    fontStyle: 'italic',
  },
})
