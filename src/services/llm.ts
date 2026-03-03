import type { TrainingBlock } from '@/types'
import { buildTemplateSummary } from '@/engine/blockGenerator'

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? ''
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

const SYSTEM_PROMPT = `You are a golf coach. Format the practice plan below into friendly weekly summaries (3–5 sentences each). Do not invent drills or change the structure. Keep the tone casual and motivating. Return plain text only — no markdown, no bullet points, no headers.`

function buildUserPrompt(block: TrainingBlock): string {
  const lines: string[] = []
  lines.push(`Block ${block.blockNumber}`)
  lines.push(`Top priorities: ${block.skillPriorities.map((p) => `${p.skill} (score ${p.score.toFixed(1)})`).join(', ')}`)
  lines.push('')

  for (const week of [1, 2, 3, 4] as const) {
    const weekSessions = block.sessions.filter((s) => s.weekNumber === week)
    const totalMin = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
    const themes: Record<1 | 2 | 3 | 4, string> = {
      1: 'Foundation',
      2: 'Build',
      3: 'Peak',
      4: 'Consolidate',
    }
    lines.push(`Week ${week} (${themes[week]}): ${totalMin} min total`)
    for (const s of weekSessions) {
      lines.push(`  - ${s.primarySkill}: ${s.durationMinutes} min (${s.sessionType})`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Call OpenAI gpt-4o-mini to generate a friendly summary of the training block.
 * Returns null on failure — caller should fall back to the template summary.
 */
async function callOpenAI(block: TrainingBlock): Promise<string | null> {
  if (!OPENAI_API_KEY) return null

  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(block) },
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      console.warn('[llm] OpenAI returned', response.status)
      return null
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content?.trim()
    return content || null
  } catch (error) {
    console.warn('[llm] OpenAI call failed:', error)
    return null
  }
}

/**
 * Enrich a training block with an LLM-generated summary.
 * Falls back to the template summary if the API key is missing or the call fails.
 */
export async function enrichWithLLMSummary(block: TrainingBlock): Promise<string> {
  const llmResult = await callOpenAI(block)
  return llmResult ?? buildTemplateSummary(block)
}
