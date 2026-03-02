import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'

import { colors } from '@/constants/colors'
import { signUp } from '@/services/auth'
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Create Account</Text>
        <Text style={styles.subtitle}>Start your journey to better golf</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textSubtle}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textSubtle}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={colors.textSubtle}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            activeOpacity={0.7}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
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
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  backText: {
    fontSize: 17,
    color: colors.accent,
    fontWeight: '500',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 32,
  },
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  error: {
    fontSize: 14,
    color: colors.danger,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
})
