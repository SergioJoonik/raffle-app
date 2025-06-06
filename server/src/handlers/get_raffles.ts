
import { db } from '../db';
import { rafflesTable } from '../db/schema';
import { type Raffle } from '../schema';

export const getRaffles = async (): Promise<Raffle[]> => {
  try {
    const results = await db.select()
      .from(rafflesTable)
      .execute();

    // Convert numeric fields back to numbers and handle JSON arrays
    return results.map(raffle => ({
      ...raffle,
      price: raffle.price ? parseFloat(raffle.price) : null,
      images: raffle.images as string[] | null
    }));
  } catch (error) {
    console.error('Getting raffles failed:', error);
    throw error;
  }
};
