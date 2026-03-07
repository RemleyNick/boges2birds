import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import type { ProgramSlug, SkillPriority } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────
// crypto.randomUUID() is a global in Hermes (Expo SDK 49+) and Node 19+.
// Do NOT import expo-crypto here — drizzle-kit evaluates this file in Node
// and cannot resolve Expo modules.

const uuid = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID())

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
}

// ─── users ────────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: uuid(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  // 'free' | 'active' | 'expired' | 'cancelled'
  subscriptionStatus: text('subscription_status').notNull().default('free'),
  subscriptionExpiresAt: integer('subscription_expires_at', { mode: 'timestamp_ms' }),
  revenuecatCustomerId: text('revenuecat_customer_id'),
  ...timestamps,
})

// ─── skill_assessments ────────────────────────────────────────────────────────

export const skillAssessments = sqliteTable('skill_assessments', {
  id: uuid(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  avgScore: real('avg_score'),
  handicapIndex: real('handicap_index'),
  teeShotRating: integer('tee_shot_rating'),      // 1–5 self-rating
  ironRating: integer('iron_rating'),
  shortGameRating: integer('short_game_rating'),
  puttingRating: integer('putting_rating'),
  courseMgmtRating: integer('course_mgmt_rating'),
  weeklyTimeAvailable: text('weekly_time_available'), // WeeklyTime
  ...timestamps,
})

// ─── programs ─────────────────────────────────────────────────────────────────
// Seeded at first migration — 3 static rows (break100, break90, break80)

export const programs = sqliteTable('programs', {
  id: uuid(),
  slug: text('slug').notNull().unique(), // ProgramSlug
  displayName: text('display_name').notNull(),
  targetAvgScore: integer('target_avg_score').notNull(),
  ...timestamps,
})

// ─── user_programs ────────────────────────────────────────────────────────────

export const userPrograms = sqliteTable('user_programs', {
  id: uuid(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  programId: text('program_id')
    .notNull()
    .references(() => programs.id),
  // 'active' | 'completed' | 'paused'
  status: text('status').notNull().default('active'),
  enrolledAt: integer('enrolled_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  ...timestamps,
})

// ─── training_blocks ──────────────────────────────────────────────────────────

export const trainingBlocks = sqliteTable('training_blocks', {
  id: uuid(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  blockNumber: integer('block_number').notNull(),
  weekStartDate: integer('week_start_date', { mode: 'timestamp_ms' }).notNull(),
  weekEndDate: integer('week_end_date', { mode: 'timestamp_ms' }).notNull(),
  // Stored as JSON: SkillPriority[]
  skillPriorities: text('skill_priorities', { mode: 'json' })
    .$type<SkillPriority[]>()
    .notNull(),
  llmSummary: text('llm_summary'),
  // 'active' | 'completed'
  status: text('status').notNull().default('active'),
  ...timestamps,
})

// ─── sessions ─────────────────────────────────────────────────────────────────

export const sessions = sqliteTable('sessions', {
  id: uuid(),
  trainingBlockId: text('training_block_id')
    .notNull()
    .references(() => trainingBlocks.id, { onDelete: 'cascade' }),
  weekNumber: integer('week_number').notNull(),        // 1–4
  sessionNumber: integer('session_number').notNull(),  // within block
  sessionType: text('session_type').notNull(),         // SessionType
  primarySkill: text('primary_skill').notNull(),       // SkillArea
  scheduledDate: integer('scheduled_date', { mode: 'timestamp_ms' }),
  durationMinutes: integer('duration_minutes').notNull(),
  // 'pending' | 'complete' | 'skipped'
  status: text('status').notNull().default('pending'),
  ...timestamps,
})

// ─── drills ───────────────────────────────────────────────────────────────────

export const drills = sqliteTable('drills', {
  // System drills use engine seed IDs ('drive-01', etc.); user drills get UUIDs
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  skillArea: text('skill_area').notNull(),       // SkillArea
  sessionType: text('session_type').notNull(),   // SessionType
  difficulty: integer('difficulty'),             // 1–3, nullable
  durationMinutes: integer('duration_minutes').notNull(),
  shotCount: integer('shot_count'),
  // JSON array — drills can belong to multiple programs
  programSlugs: text('program_slugs', { mode: 'json' })
    .$type<ProgramSlug[]>()
    .notNull()
    .$defaultFn(() => []),
  instructions: text('instructions').notNull(),
  isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
})

// ─── session_drills ───────────────────────────────────────────────────────────

export const sessionDrills = sqliteTable('session_drills', {
  id: uuid(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  drillId: text('drill_id')
    .notNull()
    .references(() => drills.id),
  orderIndex: integer('order_index').notNull(),
  durationOverride: integer('duration_override'),
  shotCountOverride: integer('shot_count_override'),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
})

// ─── round_logs ───────────────────────────────────────────────────────────────

export const roundLogs = sqliteTable('round_logs', {
  id: uuid(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  playedAt: integer('played_at', { mode: 'timestamp_ms' }).notNull(),
  courseName: text('course_name'),
  holesPlayed: integer('holes_played').notNull().default(18),
  totalScore: integer('total_score').notNull(),
  fairwaysHit: integer('fairways_hit').notNull().default(0),
  fairwaysTotal: integer('fairways_total').notNull().default(14),
  girHit: integer('gir_hit').notNull().default(0),
  girTotal: integer('gir_total').notNull().default(18),
  totalPutts: integer('total_putts').notNull().default(0),
  penalties: integer('penalties').notNull().default(0),
  ...timestamps,
})

// ─── sync_log ─────────────────────────────────────────────────────────────────

export const syncLog = sqliteTable('sync_log', {
  id: uuid(),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  // 'insert' | 'update' | 'delete'
  operation: text('operation').notNull(),
  synced: integer('synced', { mode: 'boolean' }).notNull().default(false),
  syncedAt: integer('synced_at', { mode: 'timestamp_ms' }),
  errorMessage: text('error_message'),
  ...timestamps,
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  skillAssessments: many(skillAssessments),
  userPrograms: many(userPrograms),
  trainingBlocks: many(trainingBlocks),
  roundLogs: many(roundLogs),
}))

export const skillAssessmentsRelations = relations(skillAssessments, ({ one }) => ({
  user: one(users, { fields: [skillAssessments.userId], references: [users.id] }),
}))

export const programsRelations = relations(programs, ({ many }) => ({
  userPrograms: many(userPrograms),
}))

export const userProgramsRelations = relations(userPrograms, ({ one }) => ({
  user: one(users, { fields: [userPrograms.userId], references: [users.id] }),
  program: one(programs, { fields: [userPrograms.programId], references: [programs.id] }),
}))

export const trainingBlocksRelations = relations(trainingBlocks, ({ one, many }) => ({
  user: one(users, { fields: [trainingBlocks.userId], references: [users.id] }),
  sessions: many(sessions),
}))

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  trainingBlock: one(trainingBlocks, {
    fields: [sessions.trainingBlockId],
    references: [trainingBlocks.id],
  }),
  sessionDrills: many(sessionDrills),
}))

export const drillsRelations = relations(drills, ({ many }) => ({
  sessionDrills: many(sessionDrills),
}))

export const sessionDrillsRelations = relations(sessionDrills, ({ one }) => ({
  session: one(sessions, { fields: [sessionDrills.sessionId], references: [sessions.id] }),
  drill: one(drills, { fields: [sessionDrills.drillId], references: [drills.id] }),
}))

export const roundLogsRelations = relations(roundLogs, ({ one }) => ({
  user: one(users, { fields: [roundLogs.userId], references: [users.id] }),
}))

// ─── Inferred Types ───────────────────────────────────────────────────────────
// Suffixed with 'Row' where the name conflicts with engine types in src/types/index.ts

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type SkillAssessment = typeof skillAssessments.$inferSelect
export type NewSkillAssessment = typeof skillAssessments.$inferInsert
export type Program = typeof programs.$inferSelect
export type UserProgram = typeof userPrograms.$inferSelect
export type NewUserProgram = typeof userPrograms.$inferInsert
export type TrainingBlockRow = typeof trainingBlocks.$inferSelect
export type NewTrainingBlockRow = typeof trainingBlocks.$inferInsert
export type SessionRow = typeof sessions.$inferSelect
export type NewSessionRow = typeof sessions.$inferInsert
export type DrillRow = typeof drills.$inferSelect
export type NewDrillRow = typeof drills.$inferInsert
export type SessionDrill = typeof sessionDrills.$inferSelect
export type NewSessionDrill = typeof sessionDrills.$inferInsert
export type RoundLog = typeof roundLogs.$inferSelect
export type NewRoundLog = typeof roundLogs.$inferInsert
export type SyncLogRow = typeof syncLog.$inferSelect
export type NewSyncLogRow = typeof syncLog.$inferInsert
