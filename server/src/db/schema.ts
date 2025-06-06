
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['creator', 'client']);
export const winnerSelectionMethodEnum = pgEnum('winner_selection_method', ['random', 'selection_number']);
export const raffleStatusEnum = pgEnum('raffle_status', ['draft', 'active', 'completed', 'cancelled']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Raffles table
export const rafflesTable = pgTable('raffles', {
  id: serial('id').primaryKey(),
  creator_id: integer('creator_id').notNull().references(() => usersTable.id),
  title: text('title').notNull(),
  description: text('description'),
  images: jsonb('images'), // Array of image URLs stored as JSON
  is_paid: boolean('is_paid').notNull().default(false),
  price: numeric('price', { precision: 10, scale: 2 }),
  winner_selection_method: winnerSelectionMethodEnum('winner_selection_method').notNull(),
  number_quantity: integer('number_quantity'),
  number_digits: integer('number_digits'),
  use_lottery_integration: boolean('use_lottery_integration'),
  raffle_date: timestamp('raffle_date').notNull(),
  raffle_time: text('raffle_time'), // Stored as string (e.g., "14:30")
  unique_link: text('unique_link').notNull().unique(),
  status: raffleStatusEnum('status').notNull().default('draft'),
  winner_id: integer('winner_id').references(() => usersTable.id),
  winner_number: text('winner_number'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Participations table
export const participationsTable = pgTable('participations', {
  id: serial('id').primaryKey(),
  raffle_id: integer('raffle_id').notNull().references(() => rafflesTable.id),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  selected_number: text('selected_number'), // For selection number method
  payment_status: text('payment_status'), // For future payment integration
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  createdRaffles: many(rafflesTable, { relationName: 'creator' }),
  wonRaffles: many(rafflesTable, { relationName: 'winner' }),
  participations: many(participationsTable),
}));

export const rafflesRelations = relations(rafflesTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [rafflesTable.creator_id],
    references: [usersTable.id],
    relationName: 'creator',
  }),
  winner: one(usersTable, {
    fields: [rafflesTable.winner_id],
    references: [usersTable.id],
    relationName: 'winner',
  }),
  participations: many(participationsTable),
}));

export const participationsRelations = relations(participationsTable, ({ one }) => ({
  raffle: one(rafflesTable, {
    fields: [participationsTable.raffle_id],
    references: [rafflesTable.id],
  }),
  user: one(usersTable, {
    fields: [participationsTable.user_id],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Raffle = typeof rafflesTable.$inferSelect;
export type NewRaffle = typeof rafflesTable.$inferInsert;
export type Participation = typeof participationsTable.$inferSelect;
export type NewParticipation = typeof participationsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  raffles: rafflesTable,
  participations: participationsTable,
};
