import {
  LilitaOne_400Regular,
  useFonts as useLilita,
} from '@expo-google-fonts/lilita-one'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'

import { colors } from '@/constants/colors'
import { DRILL_SEEDS } from '@/engine/drillSeeds'
import { generateBlockStructure } from '@/engine/blockGenerator'
import { computeSkillPriorities } from '@/engine/skillPriorityEngine'
import { saveSkillAssessment } from '@/repositories/skillAssessmentsRepo'
import { enrollInProgram } from '@/repositories/userProgramsRepo'
import {
  getDrillIdsForBlock,
  getLatestBlock,
  saveTrainingBlock,
} from '@/repositories/trainingBlocksRepo'
import { getActiveUserProgram } from '@/repositories/profileRepo'
import { usePaywall } from '@/hooks/usePaywall'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useUserStore } from '@/store/userStore'
import type { ProgramSlug, SessionConfig, SkillRatings } from '@/types'

export default function GeneratingScreen() {
  const router = useRouter()
  const { context } = useLocalSearchParams<{ context?: string }>()
  const isNewBlock = context === 'newblock'
  const { showPaywall } = usePaywall()
  const queryClient = useQueryClient()
  const [lilitaLoaded] = useLilita({ LilitaOne_400Regular })

  // Three pulsing dots
  const dot1 = useRef(new Animated.Value(0.3)).current
  const dot2 = useRef(new Animated.Value(0.3)).current
  const dot3 = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start()

    pulse(dot1, 0)
    pulse(dot2, 200)
    pulse(dot3, 400)
  }, [dot1, dot2, dot3])

  useEffect(() => {
    const minDelay = new Promise<void>((r) => setTimeout(r, 1500))

    async function run() {
      const { program, skillRatings, sessionsPerWeek, sessionDuration, sessionStructure } = useOnboardingStore.getState()
      const userId = useUserStore.getState().userId!

      const sessionConfig: SessionConfig = {
        sessionsPerWeek: sessionsPerWeek!,
        sessionDuration: sessionDuration!,
        structure: sessionStructure!,
      }

      let blockProgram: ProgramSlug
      let blockNumber: number
      let previousDrillIds: Set<string> | undefined

      if (isNewBlock) {
        const activeProgram = await getActiveUserProgram(userId)
        if (!activeProgram) throw new Error('No active program found for user')
        blockProgram = activeProgram.programSlug as ProgramSlug

        const lastBlock = await getLatestBlock(userId)
        blockNumber = (lastBlock?.blockNumber ?? 0) + 1
        previousDrillIds = lastBlock
          ? await getDrillIdsForBlock(lastBlock.id)
          : undefined
      } else {
        blockProgram = program!
        blockNumber = 1
      }

      const priorities = computeSkillPriorities([], skillRatings as SkillRatings, blockProgram)
      const block = generateBlockStructure(
        priorities,
        sessionConfig,
        blockProgram,
        blockNumber,
        DRILL_SEEDS,
        previousDrillIds,
      )

      if (!isNewBlock) {
        await saveSkillAssessment(userId, skillRatings as SkillRatings, sessionConfig)
        await enrollInProgram(userId, blockProgram)
      }
      await saveTrainingBlock(userId, block, sessionConfig)

      queryClient.invalidateQueries({ queryKey: ['active-block'] })
      queryClient.invalidateQueries({ queryKey: ['latest-block'] })

      useOnboardingStore.getState().reset()
    }

    const isGuest = useUserStore.getState().isGuest

    Promise.all([run(), minDelay])
      .catch((e) => console.error('[generating] Setup error:', e))
      .finally(() => {
        if (isNewBlock) {
          router.replace('/(tabs)')
          return
        }

        // Show paywall as a fire-and-forget conversion opportunity
        showPaywall().catch(() => {})

        if (isGuest) {
          router.replace('/(onboarding)/create-account')
        } else {
          router.replace('/(tabs)')
        }
      })
  }, [router, isNewBlock])

  if (!lilitaLoaded) return null

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>
        {isNewBlock ? 'Building your next block...' : 'Building your plan...'}
      </Text>
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  heading: {
    fontFamily: 'LilitaOne_400Regular',
    fontSize: 34,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 28,
  },
  dots: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
  },
})
