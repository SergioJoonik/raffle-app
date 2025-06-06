
import { db } from '../db';
import { rafflesTable } from '../db/schema';
import { type UpdateRaffleInput, type Raffle } from '../schema';
import { eq } from 'drizzle-orm';

export const updateRaffle = async (input: UpdateRaffleInput): Promise<Raffle> => {
  try {
    // Build update object only with defined fields (including null values)
    const updateData: any = {};
    
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.images !== undefined) updateData.images = input.images;
    if (input.is_paid !== undefined) updateData.is_paid = input.is_paid;
    if (input.price !== undefined) updateData.price = input.price !== null ? input.price.toString() : null;
    if (input.winner_selection_method !== undefined) updateData.winner_selection_method = input.winner_selection_method;
    if (input.number_quantity !== undefined) updateData.number_quantity = input.number_quantity;
    if (input.number_digits !== undefined) updateData.number_digits = input.number_digits;
    if (input.use_lottery_integration !== undefined) updateData.use_lottery_integration = input.use_lottery_integration;
    if (input.raffle_date !== undefined) updateData.raffle_date = input.raffle_date;
    if (input.raffle_time !== undefined) updateData.raffle_time = input.raffle_time;
    if (input.status !== undefined) updateData.status = input.status;
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update raffle record
    const result = await db.update(rafflesTable)
      .set(updateData)
      .where(eq(rafflesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Raffle with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const raffle = result[0];
    return {
      ...raffle,
      price: raffle.price ? parseFloat(raffle.price) : null,
      images: raffle.images as string[] | null
    };
  } catch (error) {
    console.error('Raffle update failed:', error);
    throw error;
  }
};
