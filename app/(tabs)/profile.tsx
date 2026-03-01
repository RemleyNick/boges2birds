import { useMemo, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import { colors } from '@/constants/colors'
import { useUserStore } from '@/store/userStore'
import {
  useUser,
  useLatestAssessment,
  useActiveProgram,
  useUpdateDisplayName,
  useUpdateWeeklyTime,
} from '@/hooks/useProfile'
import { useRoundLogs } from '@/hooks/useRoundLogs'
import type { WeeklyTime, SkillArea } from '@/types'

const SKILLS: { key: SkillArea; label: string }[] = [
  { key: 'teeShot', label: 'Tee Shots' },
  { key: 'irons', label: 'Iron Play' },
  { key: 'shortGame', label: 'Short Game' },
  { key: 'putting', label: 'Putting' },
  { key: 'courseMgmt', label: 'Course Mgmt' },
]

const SKILL_FIELD_MAP: Record<SkillArea, string> = {
  teeShot: 'teeShotRating',
  irons: 'ironRating',
  shortGame: 'shortGameRating',
  putting: 'puttingRating',
  courseMgmt: 'courseMgmtRating',
}

const WEEKLY_TIMES: { value: WeeklyTime; label: string }[] = [
  { value: '<60', label: '<60m' },
  { value: '60-90', label: '60–90m' },
  { value: '90-150', label: '90–150m' },
  { value: '150-240', label: '150–240m' },
  { value: '240+', label: '240m+' },
]

export default function ProfileScreen() {
  const router = useRouter()
  const userId = useUserStore((s) => s.userId)

  const { data: user } = useUser(userId)
  const { data: assessment } = useLatestAssessment(userId)
  const { data: activeProgram } = useActiveProgram(userId)
  const { data: roundLogs = [] } = useRoundLogs(userId)

  const updateName = useUpdateDisplayName(userId ?? '')
  const updateTime = useUpdateWeeklyTime(userId ?? '')

  // Name editing state
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')

  // Weekly time editing state
  const [editingTime, setEditingTime] = useState(false)
  const [selectedTime, setSelectedTime] = useState<WeeklyTime | null>(null)

  // Round stats (computed)
  const roundStats = useMemo(() => {
    if (roundLogs.length === 0) return null
    const scores = roundLogs.map((r) => r.totalScore)
    return {
      count: roundLogs.length,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      best: Math.min(...scores),
    }
  }, [roundLogs])

  function startEditName() {
    setNameInput(user?.displayName ?? '')
    setEditingName(true)
  }

  function saveName() {
    const trimmed = nameInput.trim()
    if (trimmed && userId) {
      updateName.mutate(trimmed)
    }
    setEditingName(false)
  }

  function startEditTime() {
    setSelectedTime((assessment?.weeklyTimeAvailable as WeeklyTime) ?? null)
    setEditingTime(true)
  }

  function saveTime() {
    if (selectedTime && userId) {
      updateTime.mutate(selectedTime)
    }
    setEditingTime(false)
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Profile</Text>

        {/* ─── Identity Card ──────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Identity</Text>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Your name"
                placeholderTextColor={colors.textSubtle}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={saveName}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={startEditName} activeOpacity={0.6}>
              <Text style={styles.nameDisplay}>
                {user?.displayName || 'Tap to set name'}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.statusRow}>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>
                {user?.subscriptionStatus === 'active' ? 'Premium' : 'Free'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Program Card ───────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Program</Text>
          {activeProgram ? (
            <Text style={styles.cardValue}>{activeProgram.programDisplayName}</Text>
          ) : (
            <Text style={styles.cardValueMuted}>No active program</Text>
          )}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/(onboarding)/program-select?context=change')}
            activeOpacity={0.6}
          >
            <Text style={styles.actionText}>Change program</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Skill Ratings Card ─────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Skill Ratings</Text>
          {assessment ? (
            <View style={styles.skillList}>
              {SKILLS.map((s) => {
                const rating = assessment[SKILL_FIELD_MAP[s.key] as keyof typeof assessment] as number | null
                return (
                  <View key={s.key} style={styles.skillRow}>
                    <Text style={styles.skillLabel}>{s.label}</Text>
                    <Text style={styles.skillValue}>
                      {rating != null ? `${rating} / 5` : '—'}
                    </Text>
                  </View>
                )
              })}
            </View>
          ) : (
            <Text style={styles.cardValueMuted}>No assessment yet</Text>
          )}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() =>
              router.push('/(onboarding)/baseline-assessment?context=reassess')
            }
            activeOpacity={0.6}
          >
            <Text style={styles.actionText}>Re-assess</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Weekly Time Card ───────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Practice Time</Text>
          {editingTime ? (
            <>
              <View style={styles.pillRow}>
                {WEEKLY_TIMES.map((t) => {
                  const active = selectedTime === t.value
                  return (
                    <TouchableOpacity
                      key={t.value}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => setSelectedTime(t.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              <TouchableOpacity style={styles.saveTimeBtn} onPress={saveTime}>
                <Text style={styles.saveTimeBtnText}>Save</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={startEditTime} activeOpacity={0.6}>
              <Text style={styles.cardValue}>
                {assessment?.weeklyTimeAvailable
                  ? WEEKLY_TIMES.find((t) => t.value === assessment.weeklyTimeAvailable)
                      ?.label ?? assessment.weeklyTimeAvailable
                  : '—'}
              </Text>
              <Text style={styles.tapHint}>Tap to change</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Round Stats Card ───────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Round Stats</Text>
          {roundStats ? (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{roundStats.count}</Text>
                <Text style={styles.statLabel}>Rounds</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{roundStats.avg}</Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{roundStats.best}</Text>
                <Text style={styles.statLabel}>Best</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.cardValueMuted}>No rounds logged yet</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },

  // Card
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  cardValueMuted: {
    fontSize: 15,
    color: colors.textSubtle,
    fontStyle: 'italic',
  },

  // Identity
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nameInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  nameDisplay: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statusRow: {
    marginTop: 10,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.accent,
  },
  actionChevron: {
    fontSize: 20,
    color: colors.accent,
  },

  // Skills
  skillList: {
    gap: 6,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillLabel: {
    fontSize: 15,
    color: colors.text,
  },
  skillValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },

  // Weekly time pills
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: colors.accent,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  saveTimeBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  saveTimeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tapHint: {
    fontSize: 12,
    color: colors.textSubtle,
    marginTop: 4,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSubtle,
    marginTop: 2,
  },
})
