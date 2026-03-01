import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { colors } from '@/constants/colors'
import { useActiveTrainingBlock } from '@/hooks/useActiveTrainingBlock'
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
  const userId = useUserStore((s) => s.userId)
  const { data: blockData, isLoading } = useActiveTrainingBlock(userId)

  const currentWeek = 1 // TODO: derive from blockData.weekStartDate
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
          <Text style={styles.emptyText}>No active plan</Text>
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
        {weekSessions.map((session) => (
          <View key={session.id} style={styles.card}>
            <Text style={styles.skill}>
              {SKILL_LABELS[session.primarySkill as SkillArea]}
            </Text>
            <Text style={styles.meta}>{session.durationMinutes} min</Text>
          </View>
        ))}
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
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
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
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
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
})
