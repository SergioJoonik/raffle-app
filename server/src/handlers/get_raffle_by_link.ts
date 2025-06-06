
import { db } from '../db';
import { rafflesTable } from '../db/schema';
import { type GetRaffleByLinkInput, type Raffle } from '../schema';
import { eq } from 'drizzle-orm';

export const getRaffleByLink = async (input: GetRaffleByLinkInput): Promise<Raffle | null> => {
  try {
    const result = await db.select()
      .from(rafflesTable)
      .where(eq(rafflesTable.unique_link, input.unique_link))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const raffle = result[0];
    return {
      ...raffle,
      price: raffle.price ? parseFloat(raffle.price) : null,
      images: raffle.images as string[] | null
    };
  } catch (error) {
    console.error('Get raffle by link failed:', error);
    throw error;
  }
};
