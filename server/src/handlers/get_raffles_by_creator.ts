
import { db } from '../db';
import { rafflesTable } from '../db/schema';
import { type GetRafflesByCreatorInput, type Raffle } from '../schema';
import { eq } from 'drizzle-orm';

export const getRafflesByCreator = async (input: GetRafflesByCreatorInput): Promise<Raffle[]> => {
  try {
    const results = await db.select()
      .from(rafflesTable)
      .where(eq(rafflesTable.creator_id, input.creator_id))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(raffle => ({
      ...raffle,
      price: raffle.price ? parseFloat(raffle.price) : null,
      images: raffle.images as string[] | null
    }));
  } catch (error) {
    console.error('Get raffles by creator failed:', error);
    throw error;
  }
};
