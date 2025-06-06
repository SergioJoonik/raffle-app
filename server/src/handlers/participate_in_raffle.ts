
import { db } from '../db';
import { participationsTable, rafflesTable, usersTable } from '../db/schema';
import { type ParticipateInRaffleInput, type Participation } from '../schema';
import { eq, and } from 'drizzle-orm';

export const participateInRaffle = async (input: ParticipateInRaffleInput): Promise<Participation> => {
  try {
    // Verify that the raffle exists and is active
    const raffle = await db.select()
      .from(rafflesTable)
      .where(eq(rafflesTable.id, input.raffle_id))
      .execute();

    if (!raffle || raffle.length === 0) {
      throw new Error('Raffle not found');
    }

    if (raffle[0].status !== 'active') {
      throw new Error('Raffle is not active');
    }

    // Verify that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (!user || user.length === 0) {
      throw new Error('User not found');
    }

    // Check if user has already participated in this raffle
    const existingParticipation = await db.select()
      .from(participationsTable)
      .where(and(
        eq(participationsTable.raffle_id, input.raffle_id),
        eq(participationsTable.user_id, input.user_id)
      ))
      .execute();

    if (existingParticipation.length > 0) {
      throw new Error('User has already participated in this raffle');
    }

    // Insert participation record
    const result = await db.insert(participationsTable)
      .values({
        raffle_id: input.raffle_id,
        user_id: input.user_id,
        selected_number: input.selected_number || null,
        payment_status: null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Participation creation failed:', error);
    throw error;
  }
};
