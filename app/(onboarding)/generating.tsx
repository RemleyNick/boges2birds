import {
  LilitaOne_400Regular,
  useFonts as useLilita,
} from '@expo-google-fonts/lilita-one'
import { useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'

import { colors } from '@/constants/colors'

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

    const timer = setTimeout(() => {
      router.replace('/(tabs)')
    }, 2500)

    return () => clearTimeout(timer)
  }, [dot1, dot2, dot3, router])

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
