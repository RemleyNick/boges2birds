import { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'

import { Button, Input, Pill } from '@/components/ui'
import { colors } from '@/constants/colors'
import { FONT, SPACING } from '@/constants/tokens'
import { useUserStore } from '@/store/userStore'
import { useUser, useActiveProgram } from '@/hooks/useProfile'
import { useSubmitFeedback } from '@/hooks/useFeedback'
import type { FeedbackType } from '@/services/feedback'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GUEST_EMAIL_REGEX = /^guest-.*@local$/

export default function FeedbackScreen() {
  const router = useRouter()
  const userId = useUserStore((s) => s.userId)
  const { data: user } = useUser(userId)
  const { data: activeProgram } = useActiveProgram(userId)

  const initialEmail =
    user?.email && !GUEST_EMAIL_REGEX.test(user.email) ? user.email : ''

  const [type, setType] = useState<FeedbackType>('bug')
  const [message, setMessage] = useState('')
  const [replyEmail, setReplyEmail] = useState(initialEmail)
  const [error, setError] = useState('')

  const submit = useSubmitFeedback()

  function validate(): string | null {
    const trimmed = message.trim()
    if (!trimmed) return 'Please enter a message.'
    if (trimmed.length > 4000) return 'Message is too long (4000 character limit).'
    const email = replyEmail.trim()
    if (email && !EMAIL_REGEX.test(email)) return 'Please enter a valid email or leave it blank.'
    return null
  }

  function handleSubmit() {
    setError('')
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    submit.mutate(
      {
        type,
        message: message.trim(),
        replyEmail: replyEmail.trim() || null,
        activeProgramSlug: activeProgram?.programSlug ?? null,
      },
      {
        onSuccess: () => {
          Alert.alert('Thanks!', 'Your feedback was sent.', [
            { text: 'OK', onPress: () => router.back() },
          ])
        },
        onError: () => {
          Alert.alert(
            'Send failed',
            'We couldn\'t send your feedback. Please check your connection and try again.',
          )
        },
      },
    )
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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>Send Feedback</Text>
          <Text style={styles.subtitle}>
            Found a bug or have an idea? Let me know — I read every submission.
          </Text>

          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            <Pill label="Bug" selected={type === 'bug'} onPress={() => setType('bug')} />
            <Pill
              label="Improvement"
              selected={type === 'improvement'}
              onPress={() => setType('improvement')}
            />
          </View>

          <Text style={[styles.label, styles.labelSpaced]}>Message</Text>
          <TextInput
            style={styles.textarea}
            value={message}
            onChangeText={setMessage}
            placeholder="What happened, or what would you like to see?"
            placeholderTextColor={colors.textSubtle}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={4000}
          />

          <Input
            label="Reply email (optional)"
            value={replyEmail}
            onChangeText={setReplyEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.replyEmail}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Send"
            onPress={handleSubmit}
            loading={submit.isPending}
            style={styles.submit}
          />
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
  container: {
    flex: 1,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: SPACING.lg,
  },
  backText: {
    fontSize: FONT.lg - 1,
    color: colors.accent,
    fontWeight: '500',
    marginLeft: 2,
  },
  scrollContent: {
    paddingBottom: SPACING['3xl'],
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
    marginBottom: SPACING['2xl'],
  },
  label: {
    fontSize: FONT.sm,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: SPACING.sm,
  },
  labelSpaced: {
    marginTop: SPACING.lg,
  },
  typeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  textarea: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
    fontSize: FONT.base,
    color: colors.text,
    minHeight: 140,
  },
  replyEmail: {
    marginTop: SPACING.lg,
  },
  error: {
    fontSize: FONT.sm,
    color: colors.danger,
    marginTop: SPACING.md,
  },
  submit: {
    marginTop: SPACING.xl,
  },
})
