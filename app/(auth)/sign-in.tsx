import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import Ionicons from '@expo/vector-icons/Ionicons'

import { Button, Input } from '@/components/ui'
import { colors } from '@/constants/colors'
import { FONT, SPACING } from '@/constants/tokens'
import { signIn } from '@/services/auth'
import { identifyUser } from '@/services/subscriptions'
import { getOrCreateAuthUser } from '@/repositories/usersRepo'
import { getActiveTrainingBlock } from '@/repositories/trainingBlocksRepo'
import { useUserStore } from '@/store/userStore'

export default function SignInScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setError('')
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    try {
      const { data, error: authError } = await signIn(trimmedEmail, password)
      if (authError) {
        setError(authError.message)
        return
      }

      const user = data.user!
      const userId = await getOrCreateAuthUser(user.id, user.email!)
      useUserStore.getState().setUserId(userId)
      useUserStore.getState().setIsGuest(false)

      await identifyUser(userId)
      await queryClient.invalidateQueries()

      const block = await getActiveTrainingBlock(userId)
      if (block) {
        router.replace('/(tabs)')
      } else {
        router.replace('/(onboarding)/program-select')
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Sign In</Text>
        <Text style={styles.subtitle}>Welcome back to Boges2Birds</Text>

        <View style={styles.form}>
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Sign In"
            onPress={handleSignIn}
            loading={loading}
            style={{ marginTop: SPACING.xs }}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/sign-up')}
            activeOpacity={0.7}
          >
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: SPACING['2xl'],
  },
  backText: {
    fontSize: FONT.lg - 1, // 17
    color: colors.accent,
    fontWeight: '500',
    marginLeft: 2,
  },
  heading: {
    fontSize: FONT['2xl'], // 28
    fontWeight: '700',
    color: colors.text,
    marginBottom: SPACING.xs + 2,
  },
  subtitle: {
    fontSize: FONT.sm + 1, // 15
    color: colors.textMuted,
    marginBottom: SPACING['3xl'],
  },
  form: {
    gap: SPACING.md + 2, // 14
  },
  error: {
    fontSize: FONT.sm,
    color: colors.danger,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING['2xl'] + 4,
  },
  footerText: {
    fontSize: FONT.sm + 1,
    color: colors.textMuted,
  },
  footerLink: {
    fontSize: FONT.sm + 1,
    fontWeight: '600',
    color: colors.accent,
  },
})
