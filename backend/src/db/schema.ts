import { integer, pgEnum, pgTable, timestamp, uuid, varchar, boolean, unique } from "drizzle-orm/pg-core";

export const userTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar("name", { length: 45 }).notNull(),
  email: varchar("email", { length: 322 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 66 }).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});



export const pollTable = pgTable("polls", {
  id: uuid().primaryKey().defaultRandom(),
  // Added Foreign Key constraint
  userId: uuid("user_id").notNull().references(() => userTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 100 }).notNull(),
  description: varchar("description", { length: 500 }),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  isPublic: boolean("is_public").notNull().default(true),


  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  // Removed .defaultNow() so it requires a future date
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});


export const questionTable = pgTable("questions", {
  id: uuid().primaryKey().defaultRandom(),
  // Added Foreign Key constraint
  pollId: uuid("poll_id").notNull().references(() => pollTable.id, { onDelete: "cascade" }),
  questionText: varchar("question_text", { length: 500 }).notNull(),
  // for multi choice question
  allowMultiple: boolean("allow_multiple").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});


export const optionTable = pgTable("options", {
  id: uuid().primaryKey().defaultRandom(),
  // Added Foreign Key constraint
  questionId: uuid("question_id").notNull().references(() => questionTable.id, { onDelete: "cascade" }),
  optionText: varchar("option_text", { length: 500 }).notNull(),
  displayOrder: integer("display_order").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});


export const responseTable = pgTable("responses", {
  id: uuid().primaryKey().defaultRandom(),
  pollId: uuid("poll_id").notNull().references(() => pollTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => userTable.id, { onDelete: "cascade" }),
  voterId: varchar("voter_id", { length: 36 }).notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),

}, (table) => {
  return {
    uniqueResponse: unique("unique_response").on(table.pollId, table.voterId)
  }
});
// What it does: This second argument to pgTable is used to define table-level constraints or indexes.
// SQL context: CONSTRAINT unique_response UNIQUE (poll_id, voterId).
// By placing a composite unique constraint on both pollId and voterId,
// the database guarantees that a specific user can only submit one response to a specific poll.


export const voteTable = pgTable("votes", {
  id: uuid().primaryKey().defaultRandom(),
  optionId: uuid("option_id").notNull().references(() => optionTable.id, { onDelete: "cascade" }),
  responseId: uuid("response_id").notNull().references(() => responseTable.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    uniqueVote: unique("unique_vote").on(table.optionId, table.responseId)
  }
});