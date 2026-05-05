import {
  LilitaOne_400Regular,
  useFonts as useLilita,
} from '@expo-google-fonts/lilita-one'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useEffect } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'

import { colors } from '@/constants/colors'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useUserStore } from '@/store/userStore'
import { saveSkillAssessment } from '@/repositories/skillAssessmentsRepo'
import { useLatestAssessment } from '@/hooks/useProfile'
import type { SessionConfig, SessionDuration, SessionsPerWeek, SessionStructure, SkillArea, SkillRatings } from '@/types'

const SKILLS: { key: SkillArea; label: string }[] = [
  { key: 'teeShot',   label: 'Tee Shots' },
  { key: 'irons',     label: 'Iron Play' },
  { key: 'shortGame', label: 'Short Game' },
  { key: 'putting',   label: 'Putting' },
  { key: 'courseMgmt', label: 'Course Management' },
]

const SESSION_COUNTS: { value: SessionsPerWeek; label: string }[] = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
]

const SESSION_DURATIONS: { value: SessionDuration; label: string }[] = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
]

const STRUCTURES: { value: SessionStructure; label: string; description: string }[] = [
  { value: 'auto', label: 'Auto', description: 'Engine picks the best split for you' },
  { value: 'focused', label: 'Focused', description: 'Group by activity (range day, short game day)' },
  { value: 'mixed', label: 'Mixed', description: 'A little of everything each session' },
]

const RATINGS = [1, 2, 3, 4, 5]

export default function BaselineAssessmentScreen() {
  const router = useRouter()
  const { context } = useLocalSearchParams<{ context?: string }>()
  const isReassess = context === 'reassess'
  const {
    skillRatings,
    sessionsPerWeek,
    sessionDuration,
    sessionStructure,
    setSkillRating,
    setSessionsPerWeek,
    setSessionDuration,
    setSessionStructure,
  } = useOnboardingStore()
  const userId = useUserStore((s) => s.userId)
  const queryClient = useQueryClient()
  const { data: latestAssessment } = useLatestAssessment(isReassess ? userId : null)

  // Pre-populate onboarding store with existing assessment values when reassessing
  useEffect(() => {
    if (!isReassess || !latestAssessment) return
    if (latestAssessment.teeShotRating != null) setSkillRating('teeShot', latestAssessment.teeShotRating)
    if (latestAssessment.ironRating != null) setSkillRating('irons', latestAssessment.ironRating)
    if (latestAssessment.shortGameRating != null) setSkillRating('shortGame', latestAssessment.shortGameRating)
    if (latestAssessment.puttingRating != null) setSkillRating('putting', latestAssessment.puttingRating)
    if (latestAssessment.courseMgmtRating != null) setSkillRating('courseMgmt', latestAssessment.courseMgmtRating)
    if (latestAssessment.sessionsPerWeek) setSessionsPerWeek(latestAssessment.sessionsPerWeek as SessionsPerWeek)
    if (latestAssessment.sessionDuration) setSessionDuration(latestAssessment.sessionDuration as SessionDuration)
    if (latestAssessment.sessionStructure) setSessionStructure(latestAssessment.sessionStructure as SessionStructure)
  }, [isReassess, latestAssessment])

  const [lilitaLoaded] = useLilita({ LilitaOne_400Regular })
  if (!lilitaLoaded) return null

  const allRated = SKILLS.every((s) => skillRatings[s.key] !== undefined)
  const canProceed = allRated && sessionsPerWeek !== null && sessionDuration !== null && sessionStructure !== null

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={12} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.scroll}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {isReassess ? 'Re-assess your game' : 'Rate your game'}
        </Text>
        <Text style={styles.subtitle}>
          {isReassess
            ? 'Update your ratings to refine future training blocks.'
            : 'Be honest — this builds your first training block.'}
        </Text>

        <View style={styles.section}>
          <View style={styles.ratingLegend}>
            <Text style={styles.ratingLegendText}>1 = worst</Text>
            <Text style={styles.ratingLegendText}>5 = best</Text>
          </View>
          {SKILLS.map((skill) => (
            <View key={skill.key} style={styles.skillRow}>
              <Text style={styles.skillLabel}>{skill.label}</Text>
              <View style={styles.ratingButtons}>
                {RATINGS.map((n) => {
                  const selected = skillRatings[skill.key] === n
                  return (
                    <TouchableOpacity
                      key={n}
                      style={[styles.ratingBtn, selected && styles.ratingBtnSelected]}
                      onPress={() => setSkillRating(skill.key, n)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.ratingBtnText, selected && styles.ratingBtnTextSelected]}>
                        {n}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sessions per week</Text>
          <View style={styles.pillRow}>
            {SESSION_COUNTS.map((item) => {
              const selected = sessionsPerWeek === item.value
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.pill, selected && styles.pillSelected]}
                  onPress={() => setSessionsPerWeek(item.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session duration</Text>
          <View style={styles.pillRow}>
            {SESSION_DURATIONS.map((item) => {
              const selected = sessionDuration === item.value
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.pill, selected && styles.pillSelected]}
                  onPress={() => setSessionDuration(item.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session structure</Text>
          {STRUCTURES.map((item) => {
            const selected = sessionStructure === item.value
            return (
              <TouchableOpacity
                key={item.value}
                style={[styles.structureCard, selected && styles.structureCardSelected]}
                onPress={() => setSessionStructure(item.value)}
                activeOpacity={0.7}
              >
                <View style={styles.structureRow}>
                  <Text style={[styles.structureLabel, selected && styles.structureLabelSelected]}>
                    {item.label}
                    {item.value === 'auto' ? ' (Recommended)' : ''}
                  </Text>
                  {selected && <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
                </View>
                <Text style={[styles.structureDesc, selected && styles.structureDescSelected]}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity
          style={[styles.buildButton, !canProceed && styles.buildButtonDisabled]}
          onPress={async () => {
            if (isReassess && userId && sessionsPerWeek && sessionDuration && sessionStructure) {
              const sessionConfig: SessionConfig = {
                sessionsPerWeek,
                sessionDuration,
                structure: sessionStructure,
              }
              await saveSkillAssessment(userId, skillRatings as SkillRatings, sessionConfig)
              queryClient.invalidateQueries({ queryKey: ['latest-assessment'] })
              router.back()
            } else {
              router.push('/(onboarding)/generating')
            }
          }}
          disabled={!canProceed}
          activeOpacity={0.8}
        >
          <Text style={styles.buildButtonText}>
            {isReassess ? 'Save Ratings' : 'Build My Plan'}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 48,
  },
  title: {
    fontFamily: 'LilitaOne_400Regular',
    fontSize: 34,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 32,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  ratingLegend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginBottom: 4,
  },
  ratingLegendText: {
    fontSize: 11,
    color: colors.textSubtle,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skillLabel: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  ratingBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBtnSelected: {
    backgroundColor: colors.accent,
  },
  ratingBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  ratingBtnTextSelected: {
    color: '#FFFFFF',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
  },
  pillSelected: {
    backgroundColor: colors.accent,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  structureCard: {
    borderRadius: 12,
    backgroundColor: colors.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  structureCardSelected: {
    backgroundColor: colors.accent,
  },
  structureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  structureLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  structureLabelSelected: {
    color: '#FFFFFF',
  },
  structureDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  structureDescSelected: {
    color: 'rgba(255,255,255,0.85)',
  },
  buildButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buildButtonDisabled: {
    opacity: 0.35,
  },
  buildButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
})
