import {
  DancingScript_600SemiBold,
  useFonts as useDancing,
} from '@expo-google-fonts/dancing-script'
import {
  LilitaOne_400Regular,
  useFonts as useLilita,
} from '@expo-google-fonts/lilita-one'
import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { colors } from '@/constants/colors'
import { useOnboardingStore } from '@/store/onboardingStore'
import { SkillArea, WeeklyTime } from '@/types'

const SKILLS: { key: SkillArea; label: string }[] = [
  { key: 'teeShot',   label: 'Tee Shots' },
  { key: 'irons',     label: 'Iron Play' },
  { key: 'shortGame', label: 'Short Game' },
  { key: 'putting',   label: 'Putting' },
  { key: 'courseMgmt', label: 'Course Management' },
]

const WEEKLY_TIMES: { value: WeeklyTime; label: string }[] = [
  { value: '<60',     label: '<60m' },
  { value: '60-90',   label: '60–90m' },
  { value: '90-150',  label: '90–150m' },
  { value: '150-240', label: '150–240m' },
  { value: '240+',    label: '240m+' },
]

const RATINGS = [1, 2, 3, 4, 5]

export default function BaselineAssessmentScreen() {
  const router = useRouter()
  const { skillRatings, weeklyTime, setSkillRating, setWeeklyTime } = useOnboardingStore()

  const [lilitaLoaded] = useLilita({ LilitaOne_400Regular })
  const [dancingLoaded] = useDancing({ DancingScript_600SemiBold })
  if (!lilitaLoaded || !dancingLoaded) return null

  const allRated = SKILLS.every((s) => skillRatings[s.key] !== undefined)
  const canProceed = allRated && weeklyTime !== null

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Rate your game</Text>
        <Text style={styles.subtitle}>
          Be honest — this builds your first training block.
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
          <Text style={styles.sectionTitle}>Weekly practice time</Text>
          <View style={styles.pillRow}>
            {WEEKLY_TIMES.map((t) => {
              const selected = weeklyTime === t.value
              return (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.pill, selected && styles.pillSelected]}
                  onPress={() => setWeeklyTime(t.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.buildButton, !canProceed && styles.buildButtonDisabled]}
          onPress={() => router.push('/(onboarding)/generating')}
          disabled={!canProceed}
          activeOpacity={0.8}
        >
          <Text style={styles.buildButtonText}>Build My Plan</Text>
        </TouchableOpacity>
      </ScrollView>
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
  backChevron: {
    fontSize: 36,
    color: colors.text,
    lineHeight: 40,
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
    fontFamily: 'DancingScript_600SemiBold',
    fontSize: 18,
    color: colors.textMuted,
    marginBottom: 32,
    lineHeight: 26,
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
    backgroundColor: '#F5F5F5',
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
    backgroundColor: '#F5F5F5',
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
