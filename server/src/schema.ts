
import { z } from 'zod';

// Enum for user roles
export const userRoleSchema = z.enum(['creator', 'client']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Enum for winner selection methods
export const winnerSelectionMethodSchema = z.enum(['random', 'selection_number']);
export type WinnerSelectionMethod = z.infer<typeof winnerSelectionMethodSchema>;

// Enum for raffle status
export const raffleStatusSchema = z.enum(['draft', 'active', 'completed', 'cancelled']);
export type RaffleStatus = z.infer<typeof raffleStatusSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  role: userRoleSchema,
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Raffle schema
export const raffleSchema = z.object({
  id: z.number(),
  creator_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  images: z.array(z.string()).nullable(),
  is_paid: z.boolean(),
  price: z.number().nullable(),
  winner_selection_method: winnerSelectionMethodSchema,
  number_quantity: z.number().int().nullable(),
  number_digits: z.number().int().nullable(),
  use_lottery_integration: z.boolean().nullable(),
  raffle_date: z.coerce.date(),
  raffle_time: z.string().nullable(),
  unique_link: z.string(),
  status: raffleStatusSchema,
  winner_id: z.number().nullable(),
  winner_number: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Raffle = z.infer<typeof raffleSchema>;

// Participation schema
export const participationSchema = z.object({
  id: z.number(),
  raffle_id: z.number(),
  user_id: z.number(),
  selected_number: z.string().nullable(),
  payment_status: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Participation = z.infer<typeof participationSchema>;

// Input schemas
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: userRoleSchema
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createRaffleInputSchema = z.object({
  creator_id: z.number(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  is_paid: z.boolean(),
  price: z.number().positive().nullable().optional(),
  winner_selection_method: winnerSelectionMethodSchema,
  number_quantity: z.number().int().positive().nullable().optional(),
  number_digits: z.number().int().min(1).max(10).nullable().optional(),
  use_lottery_integration: z.boolean().nullable().optional(),
  raffle_date: z.coerce.date(),
  raffle_time: z.string().nullable().optional()
});

export type CreateRaffleInput = z.infer<typeof createRaffleInputSchema>;

export const updateRaffleInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  is_paid: z.boolean().optional(),
  price: z.number().positive().nullable().optional(),
  winner_selection_method: winnerSelectionMethodSchema.optional(),
  number_quantity: z.number().int().positive().nullable().optional(),
  number_digits: z.number().int().min(1).max(10).nullable().optional(),
  use_lottery_integration: z.boolean().nullable().optional(),
  raffle_date: z.coerce.date().optional(),
  raffle_time: z.string().nullable().optional(),
  status: raffleStatusSchema.optional()
});

export type UpdateRaffleInput = z.infer<typeof updateRaffleInputSchema>;

export const participateInRaffleInputSchema = z.object({
  raffle_id: z.number(),
  user_id: z.number(),
  selected_number: z.string().nullable().optional()
});

export type ParticipateInRaffleInput = z.infer<typeof participateInRaffleInputSchema>;

export const getRaffleByLinkInputSchema = z.object({
  unique_link: z.string().min(1)
});

export type GetRaffleByLinkInput = z.infer<typeof getRaffleByLinkInputSchema>;

export const selectWinnerInputSchema = z.object({
  raffle_id: z.number()
});

export type SelectWinnerInput = z.infer<typeof selectWinnerInputSchema>;

export const getRafflesByCreatorInputSchema = z.object({
  creator_id: z.number()
});

export type GetRafflesByCreatorInput = z.infer<typeof getRafflesByCreatorInputSchema>;

export const getRaffleParticipantsInputSchema = z.object({
  raffle_id: z.number()
});

export type GetRaffleParticipantsInput = z.infer<typeof getRaffleParticipantsInputSchema>;
