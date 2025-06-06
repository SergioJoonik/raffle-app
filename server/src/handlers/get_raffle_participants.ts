
import { db } from '../db';
import { participationsTable } from '../db/schema';
import { type GetRaffleParticipantsInput, type Participation } from '../schema';
import { eq } from 'drizzle-orm';

export const getRaffleParticipants = async (input: GetRaffleParticipantsInput): Promise<Participation[]> => {
  try {
    const results = await db.select()
      .from(participationsTable)
      .where(eq(participationsTable.raffle_id, input.raffle_id))
      .execute();

    return results;
  } catch (error) {
    console.error('Get raffle participants failed:', error);
    throw error;
  }
};
