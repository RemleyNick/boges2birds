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
import { signUp } from '@/services/auth'
import { identifyUser } from '@/services/subscriptions'
import { migrateGuestToAuth } from '@/repositories/usersRepo'
import { getActiveTrainingBlock } from '@/repositories/trainingBlocksRepo'
import { useUserStore } from '@/store/userStore'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignUpScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate(): string | null {
    const trimmed = email.trim().toLowerCase()
    if (!EMAIL_RE.test(trimmed)) return 'Please enter a valid email address.'
    if (password.length < 6) return 'Password must be at least 6 characters.'
    if (password !== confirmPassword) return 'Passwords do not match.'
    return null
  }

  async function handleSignUp() {
    setError('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const trimmedEmail = email.trim().toLowerCase()
    setLoading(true)
    try {
      const { data, error: authError } = await signUp(trimmedEmail, password)
      if (authError) {
        setError(authError.message)
        return
      }

      const user = data.user!
      const { userId: guestUserId, isGuest } = useUserStore.getState()

      // Migrate guest data to the new auth user
      if (isGuest && guestUserId) {
        await migrateGuestToAuth(guestUserId, user.id, user.email!)
      }

      useUserStore.getState().setUserId(user.id)
      useUserStore.getState().setIsGuest(false)

      await identifyUser(user.id)
      await queryClient.invalidateQueries()

      const block = await getActiveTrainingBlock(user.id)
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

        <Text style={styles.heading}>Create Account</Text>
        <Text style={styles.subtitle}>Start your journey to better golf</Text>

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
          <Input
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Create Account"
            onPress={handleSignUp}
            loading={loading}
            style={{ marginTop: SPACING.xs }}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/sign-in')}
            activeOpacity={0.7}
          >
            <Text style={styles.footerLink}>Sign In</Text>
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
    fontSize: FONT.lg - 1,
    color: colors.accent,
    fontWeight: '500',
    marginLeft: 2,
  },
  heading: {
    fontSize: FONT['2xl'],
    fontWeight: '700',
    color: colors.text,
    marginBottom: SPACING.xs + 2,
  },
  subtitle: {
    fontSize: FONT.sm + 1,
    color: colors.textMuted,
    marginBottom: SPACING['3xl'],
  },
  form: {
    gap: SPACING.md + 2,
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
