import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { getClient } from './auth'
import { useUserStore } from '@/store/userStore'

export type FeedbackType = 'bug' | 'improvement'

export interface SubmitFeedbackInput {
  type: FeedbackType
  message: string
  replyEmail?: string | null
  activeProgramSlug?: string | null
}

export async function submitFeedback(input: SubmitFeedbackInput): Promise<void> {
  const client = getClient()
  if (!client) {
    throw new Error('Feedback is not available — Supabase is not configured.')
  }

  const message = input.message.trim()
  if (!message) throw new Error('Message is required.')
  if (message.length > 4000) throw new Error('Message is too long.')

  const replyEmail = input.replyEmail?.trim() || null
  // Don't store the local guest placeholder email as a real reply address
  const cleanedReplyEmail =
    replyEmail && /^guest-.*@local$/.test(replyEmail) ? null : replyEmail

  const { userId, isGuest } = useUserStore.getState()

  const context = {
    app_version: Constants.expoConfig?.version ?? null,
    platform: Platform.OS,
    os_version: String(Platform.Version),
    active_program_slug: input.activeProgramSlug ?? null,
  }

  // Insert via SECURITY DEFINER RPC to bypass anon-role write restrictions
  // on the feedback table.
  const { error } = await client.rpc('submit_feedback', {
    p_type: input.type,
    p_message: message,
    p_is_guest: isGuest,
    p_user_id: userId,
    p_reply_email: cleanedReplyEmail,
    p_context: context,
  })

  if (error) throw new Error(error.message)
}
