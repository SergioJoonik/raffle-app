
import { db } from '../db';
import { rafflesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Raffle } from '../schema';

export const getRaffleById = async (id: number): Promise<Raffle | null> => {
  try {
    const results = await db.select()
      .from(rafflesTable)
      .where(eq(rafflesTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const raffle = results[0];
    
    // Convert numeric fields back to numbers and handle nullable fields
    return {
      ...raffle,
      price: raffle.price ? parseFloat(raffle.price) : null,
      images: raffle.images as string[] | null // Cast JSONB field to expected type
    };
  } catch (error) {
    console.error('Get raffle by ID failed:', error);
    throw error;
  }
};
