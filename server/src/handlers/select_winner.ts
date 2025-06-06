
import { db } from '../db';
import { rafflesTable, participationsTable, usersTable } from '../db/schema';
import { type SelectWinnerInput, type Raffle } from '../schema';
import { eq, and } from 'drizzle-orm';

export const selectWinner = async (input: SelectWinnerInput): Promise<Raffle> => {
  try {
    // First, get the raffle details
    const raffles = await db.select()
      .from(rafflesTable)
      .where(eq(rafflesTable.id, input.raffle_id))
      .execute();

    if (raffles.length === 0) {
      throw new Error('Raffle not found');
    }

    const raffle = raffles[0];

    // Check if winner already selected (this should be checked first)
    if (raffle.winner_id) {
      throw new Error('Winner already selected for this raffle');
    }

    // Check if raffle is in active status
    if (raffle.status !== 'active') {
      throw new Error('Raffle must be active to select winner');
    }

    // Get all participants for this raffle
    const participants = await db.select()
      .from(participationsTable)
      .where(eq(participationsTable.raffle_id, input.raffle_id))
      .execute();

    if (participants.length === 0) {
      throw new Error('No participants found for this raffle');
    }

    let winnerId: number;
    let winnerNumber: string | null = null;

    if (raffle.winner_selection_method === 'random') {
      // Select random participant
      const randomIndex = Math.floor(Math.random() * participants.length);
      winnerId = participants[randomIndex].user_id;
      winnerNumber = participants[randomIndex].selected_number;
    } else if (raffle.winner_selection_method === 'selection_number') {
      // For selection_number method, we would need lottery integration or manual selection
      // For now, we'll select the first participant as a placeholder
      winnerId = participants[0].user_id;
      winnerNumber = participants[0].selected_number;
    } else {
      throw new Error('Invalid winner selection method');
    }

    // Update raffle with winner information and set status to completed
    const updatedRaffles = await db.update(rafflesTable)
      .set({
        winner_id: winnerId,
        winner_number: winnerNumber,
        status: 'completed',
        updated_at: new Date()
      })
      .where(eq(rafflesTable.id, input.raffle_id))
      .returning()
      .execute();

    const updatedRaffle = updatedRaffles[0];

    // Convert numeric fields and handle images array properly
    return {
      ...updatedRaffle,
      price: updatedRaffle.price ? parseFloat(updatedRaffle.price) : null,
      images: Array.isArray(updatedRaffle.images) ? updatedRaffle.images as string[] : null
    };
  } catch (error) {
    console.error('Winner selection failed:', error);
    throw error;
  }
};
