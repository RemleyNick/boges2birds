import {
  LilitaOne_400Regular,
  useFonts as useLilita,
} from '@expo-google-fonts/lilita-one'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'

import { colors } from '@/constants/colors'
import { PROGRAMS } from '@/constants/programs'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useUserStore } from '@/store/userStore'
import { enrollInProgram } from '@/repositories/userProgramsRepo'
import { ProgramSlug } from '@/types'

export default function ProgramSelectScreen() {
  const router = useRouter()
  const { context } = useLocalSearchParams<{ context?: string }>()
  const isChange = context === 'change'
  const { program, setProgram } = useOnboardingStore()
  const userId = useUserStore((s) => s.userId)
  const queryClient = useQueryClient()

  const [lilitaLoaded] = useLilita({ LilitaOne_400Regular })
  if (!lilitaLoaded) return null

  return (
    <SafeAreaView style={styles.root}>
      {isChange && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inner}>
        <Text style={styles.title}>
          {isChange ? 'Change program' : 'Choose your program'}
        </Text>

        <View style={styles.cards}>
          {PROGRAMS.map((p) => {
            const selected = program === p.slug
            return (
              <TouchableOpacity
                key={p.slug}
                style={[styles.card, selected ? styles.cardSelected : styles.cardUnselected]}
                onPress={() => setProgram(p.slug as ProgramSlug)}
                activeOpacity={0.7}
              >
                <Text style={styles.cardLabel}>{p.label}</Text>
                <Text style={styles.cardDescription}>{p.description}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity
          style={[styles.nextButton, !program && styles.nextButtonDisabled]}
          onPress={async () => {
            if (isChange && program && userId) {
              await enrollInProgram(userId, program)
              queryClient.invalidateQueries({ queryKey: ['active-program'] })
              router.back()
            } else {
              router.push('/(onboarding)/baseline-assessment')
            }
          }}
          disabled={!program}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {isChange ? 'Save' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
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
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'LilitaOne_400Regular',
    fontSize: 36,
    color: colors.text,
    marginBottom: 32,
  },
  cards: {
    flex: 1,
    gap: 14,
    justifyContent: 'flex-start',
  },
  card: {
    borderRadius: 14,
    padding: 20,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  cardUnselected: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textMuted,
  },
  nextButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  nextButtonDisabled: {
    opacity: 0.35,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
})
