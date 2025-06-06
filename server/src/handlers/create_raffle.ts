
import { db } from '../db';
import { rafflesTable, usersTable } from '../db/schema';
import { type CreateRaffleInput, type Raffle } from '../schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const createRaffle = async (input: CreateRaffleInput): Promise<Raffle> => {
  try {
    // Verify that the creator exists
    const creator = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.creator_id))
      .execute();
    
    if (creator.length === 0) {
      throw new Error(`Creator with id ${input.creator_id} not found`);
    }

    // Generate unique link
    const unique_link = nanoid(10);

    // Insert raffle record
    const result = await db.insert(rafflesTable)
      .values({
        creator_id: input.creator_id,
        title: input.title,
        description: input.description ?? null,
        images: input.images ?? null,
        is_paid: input.is_paid,
        price: input.price ? input.price.toString() : null, // Convert number to string for numeric column
        winner_selection_method: input.winner_selection_method,
        number_quantity: input.number_quantity ?? null,
        number_digits: input.number_digits ?? null,
        use_lottery_integration: input.use_lottery_integration ?? null,
        raffle_date: input.raffle_date,
        raffle_time: input.raffle_time ?? null,
        unique_link: unique_link,
        status: 'draft' // Default status
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers and handle images type conversion
    const raffle = result[0];
    return {
      ...raffle,
      price: raffle.price ? parseFloat(raffle.price) : null, // Convert string back to number
      images: raffle.images as string[] | null // Cast jsonb back to string array
    };
  } catch (error) {
    console.error('Raffle creation failed:', error);
    throw error;
  }
};
