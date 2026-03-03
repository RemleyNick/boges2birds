import { db } from '@/db/client'
import { userPrograms } from '@/db/schema'
import type { ProgramSlug } from '@/types'
import { logSyncEntry } from './syncLogHelper'

const PROGRAM_IDS: Record<ProgramSlug, string> = {
  break100: 'prog-break100',
  break90:  'prog-break90',
  break80:  'prog-break80',
}

export async function enrollInProgram(userId: string, slug: ProgramSlug): Promise<void> {
  const id = crypto.randomUUID()
  const now = new Date()
  await db.insert(userPrograms).values({
    id,
    userId,
    programId: PROGRAM_IDS[slug],
    status: 'active',
    enrolledAt: now,
    createdAt: now,
    updatedAt: now,
  })
  await logSyncEntry('user_programs', id, 'insert')
}
