import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import { useEntitlement } from '@/hooks/useEntitlement'
import { usePaywall } from '@/hooks/usePaywall'
import { signOut } from '@/services/auth'
import { restorePurchases } from '@/services/subscriptions'
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
  const isGuest = useUserStore((s) => s.isGuest)

  const { data: user, isLoading, isError, refetch } = useUser(userId)
  const { data: assessment } = useLatestAssessment(userId)
  const { data: activeProgram } = useActiveProgram(userId)
  const { data: roundLogs = [] } = useRoundLogs(userId)

  const { isPremium } = useEntitlement()
  const { showPaywall } = usePaywall()
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
    const trimmed = nameInput.trim().slice(0, 100)
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
        <View style={styles.errorContainer}>
          <Text style={styles.heading}>Profile</Text>
          <Text style={styles.cardValueMuted}>Failed to load profile.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
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
              <Text style={styles.nameDisplay} numberOfLines={1}>
                {user?.displayName || 'Tap to set name'}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.statusRow}>
            <View style={[styles.statusPill, isPremium && styles.statusPillPremium]}>
              <Text style={[styles.statusPillText, isPremium && styles.statusPillTextPremium]}>
                {isPremium ? 'Premium' : 'Free'}
              </Text>
            </View>
          </View>
          {isPremium && user?.subscriptionExpiresAt && (
            <Text style={styles.expirationText}>
              Renews {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
            </Text>
          )}
          {!isPremium && (
            <View style={styles.upgradeRow}>
              <TouchableOpacity style={styles.upgradeButton} onPress={() => showPaywall()}>
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.restoreLink}
                onPress={async () => {
                  const restored = await restorePurchases()
                  if (!restored) {
                    Alert.alert('No purchases found', 'We couldn\'t find an active subscription to restore.')
                  }
                }}
              >
                <Text style={styles.restoreLinkText}>Restore Purchases</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ─── Program Card ───────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Program</Text>
          {activeProgram ? (
            <Text style={styles.cardValue} numberOfLines={1}>
              {activeProgram.programDisplayName}
            </Text>
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

        {/* ─── Account Actions ────────────────────────────── */}
        {isGuest ? (
          <TouchableOpacity
            style={styles.accountRow}
            onPress={() => router.push('/(auth)/sign-up')}
            activeOpacity={0.6}
          >
            <Text style={styles.createAccountText}>Create Account</Text>
            <Text style={[styles.actionChevron, { color: colors.accent }]}>›</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.accountRow}
            onPress={async () => {
              await signOut()
              router.replace('/')
            }}
            activeOpacity={0.6}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        )}
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
    backgroundColor: colors.cardBg,
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
    backgroundColor: colors.accentLight,
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
    borderTopColor: colors.border,
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
    backgroundColor: colors.pillInactive,
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

  // Account actions
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
  },
  createAccountText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },

  // Premium / Upgrade
  statusPillPremium: {
    backgroundColor: colors.accent,
  },
  statusPillTextPremium: {
    color: '#FFFFFF',
  },
  expirationText: {
    fontSize: 12,
    color: colors.textSubtle,
    marginTop: 6,
  },
  upgradeRow: {
    marginTop: 12,
    gap: 10,
    alignItems: 'center',
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  restoreLink: {
    paddingVertical: 4,
  },
  restoreLinkText: {
    fontSize: 13,
    color: colors.textSubtle,
    textDecorationLine: 'underline',
  },

  // Error state
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  retryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
})
