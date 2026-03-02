import {
  LilitaOne_400Regular,
  useFonts as useLilita,
} from '@expo-google-fonts/lilita-one'
import { useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'

import { db } from '@/db/client'
import { trainingBlocks } from '@/db/schema'
import { colors } from '@/constants/colors'
import { DRILL_SEEDS } from '@/engine/drillSeeds'
import { generateBlockStructure, enrichWithLLMSummary } from '@/engine/blockGenerator'
import { computeSkillPriorities } from '@/engine/skillPriorityEngine'
import { saveSkillAssessment } from '@/repositories/skillAssessmentsRepo'
import { enrollInProgram } from '@/repositories/userProgramsRepo'
import { saveTrainingBlock } from '@/repositories/trainingBlocksRepo'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useUserStore } from '@/store/userStore'
import type { SkillRatings } from '@/types'
import { eq } from 'drizzle-orm'

export default function GeneratingScreen() {
  const router = useRouter()
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
      const { program, skillRatings, weeklyTime } = useOnboardingStore.getState()
      const userId = useUserStore.getState().userId!

      const priorities = computeSkillPriorities([], skillRatings as SkillRatings, program!)
      const block = generateBlockStructure(priorities, weeklyTime!, program!, 1, DRILL_SEEDS)

      await saveSkillAssessment(userId, skillRatings as SkillRatings, weeklyTime!)
      await enrollInProgram(userId, program!)
      const blockId = await saveTrainingBlock(userId, block)

      // Fire-and-forget LLM enrichment
      enrichWithLLMSummary(block)
        .then((summary) =>
          db.update(trainingBlocks)
            .set({ llmSummary: summary, updatedAt: new Date() })
            .where(eq(trainingBlocks.id, blockId))
        )
        .catch(() => {}) // silent fail; template summary is already saved

      useOnboardingStore.getState().reset()
    }

    const isGuest = useUserStore.getState().isGuest

    Promise.all([run(), minDelay])
      .catch((e) => console.error('[generating] Setup error:', e))
      .finally(() => {
        if (isGuest) {
          router.replace('/(onboarding)/create-account')
        } else {
          router.replace('/(tabs)')
        }
      })
  }, [router])

  if (!lilitaLoaded) return null

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Building your plan...</Text>
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
