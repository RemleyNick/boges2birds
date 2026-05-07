import { useRouter } from 'expo-router'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'

import { Button, Card } from '@/components/ui'
import { colors } from '@/constants/colors'
import { useActiveTrainingBlock, useLatestBlock } from '@/hooks/useActiveTrainingBlock'
import { useEntitlement } from '@/hooks/useEntitlement'
import { usePaywall } from '@/hooks/usePaywall'
import { useUserStore } from '@/store/userStore'
import { getSessionLabel } from '@/engine/skillGrouping'
import type { SkillArea } from '@/types'

const WEEK_THEMES: Record<number, string> = {
  1: 'Foundation',
  2: 'Build',
  3: 'Peak',
  4: 'Consolidate',
}

export default function HomeScreen() {
  const router = useRouter()
  const userId = useUserStore((s) => s.userId)
  const { data: blockData, isLoading, isError, refetch } = useActiveTrainingBlock(userId)
  const { data: latestBlock } = useLatestBlock(userId)
  const { isPremium } = useEntitlement()
  const { showPaywall } = usePaywall()

  const currentWeek = (() => {
    if (!blockData) return 1
    for (const wk of [1, 2, 3, 4] as const) {
      const hasPending = blockData.sessions.some(
        (s) => s.weekNumber === wk && s.status !== 'complete',
      )
      if (hasPending) return wk
    }
    return 4
  })()
  const weekSessions = blockData?.sessions.filter((s) => s.weekNumber === currentWeek) ?? []

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      </SafeAreaView>
    )
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Failed to load your plan</Text>
          <Text style={styles.emptyBody}>
            Something went wrong. Tap below to try again.
          </Text>
          <Button
            title="Retry"
            onPress={() => refetch()}
            fullWidth={false}
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    )
  }

  if (!blockData) {
    if (latestBlock && latestBlock.status === 'completed') {
      const completedSessionCount = latestBlock.sessions.filter(
        (s) => s.status === 'complete',
      ).length
      return (
        <SafeAreaView style={styles.root}>
          <View style={styles.empty}>
            <Ionicons
              name="trophy"
              size={48}
              color={colors.accent}
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.emptyTitle}>
              Block {latestBlock.blockNumber} complete — nice work.
            </Text>
            <Text style={styles.emptyBody}>
              {completedSessionCount} sessions logged. Re-rate your skills to
              build your next 4-week block.
            </Text>
            <Button
              title={`Start Block ${latestBlock.blockNumber + 1}`}
              onPress={() =>
                router.push('/(onboarding)/baseline-assessment?context=newblock')
              }
              fullWidth={false}
              style={{ marginTop: 20 }}
            />
          </View>
        </SafeAreaView>
      )
    }

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
        {weekSessions.map((session, index) => {
          const isDone = session.status === 'complete'
          const isLocked = !isPremium && currentWeek > 1
          const skills = (session.skills as SkillArea[] | null) ?? [session.primarySkill as SkillArea]
          const label = getSessionLabel(skills)
          return (
            <Card
              key={session.id}
              elevated
              onPress={() => isLocked ? showPaywall() : router.push(`/practice/${session.id}`)}
              style={{
                ...styles.card,
                ...(isDone ? styles.cardDone : null),
                ...(isLocked ? styles.cardLocked : null),
              }}
            >
              <View style={styles.cardContent}>
                <View style={styles.skillRow}>
                  {isLocked && (
                    <Ionicons
                      name="lock-closed"
                      size={16}
                      color={colors.textSubtle}
                      style={{ marginRight: 6 }}
                    />
                  )}
                  <Text style={[styles.skill, isLocked && styles.lockedText]} numberOfLines={1}>
                    Day {index + 1} — {label}
                  </Text>
                </View>
                {isLocked ? (
                  <Text style={styles.lockedMeta}>Upgrade to unlock</Text>
                ) : (
                  <Text style={styles.meta}>{session.durationMinutes} min</Text>
                )}
              </View>
              {isDone && !isLocked && (
                <View style={styles.doneBadge}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  <Text style={styles.doneBadgeText}>Done</Text>
                </View>
              )}
            </Card>
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
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
