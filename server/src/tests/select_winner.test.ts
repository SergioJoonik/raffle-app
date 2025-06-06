
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, rafflesTable, participationsTable } from '../db/schema';
import { type SelectWinnerInput } from '../schema';
import { selectWinner } from '../handlers/select_winner';
import { eq } from 'drizzle-orm';

describe('selectWinner', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let creatorId: number;
  let participantId1: number;
  let participantId2: number;
  let raffleId: number;

  beforeEach(async () => {
    // Create test users
    const creators = await db.insert(usersTable)
      .values({
        email: 'creator@test.com',
        name: 'Test Creator',
        role: 'creator'
      })
      .returning()
      .execute();
    creatorId = creators[0].id;

    const participants = await db.insert(usersTable)
      .values([
        {
          email: 'participant1@test.com',
          name: 'Participant 1',
          role: 'client'
        },
        {
          email: 'participant2@test.com',
          name: 'Participant 2',
          role: 'client'
        }
      ])
      .returning()
      .execute();
    participantId1 = participants[0].id;
    participantId2 = participants[1].id;

    // Create test raffle
    const raffles = await db.insert(rafflesTable)
      .values({
        creator_id: creatorId,
        title: 'Test Raffle',
        description: 'A raffle for testing',
        is_paid: false,
        winner_selection_method: 'random',
        raffle_date: new Date(),
        unique_link: 'test-raffle-link',
        status: 'active'
      })
      .returning()
      .execute();
    raffleId = raffles[0].id;

    // Create test participations
    await db.insert(participationsTable)
      .values([
        {
          raffle_id: raffleId,
          user_id: participantId1,
          selected_number: '001'
        },
        {
          raffle_id: raffleId,
          user_id: participantId2,
          selected_number: '002'
        }
      ])
      .execute();
  });

  const testInput: SelectWinnerInput = {
    raffle_id: 0 // Will be set in tests
  };

  it('should select a winner for active raffle', async () => {
    const input = { ...testInput, raffle_id: raffleId };
    const result = await selectWinner(input);

    // Basic field validation
    expect(result.id).toEqual(raffleId);
    expect(result.winner_id).toBeDefined();
    expect(result.winner_id).toBeOneOf([participantId1, participantId2]);
    expect(result.winner_number).toBeDefined();
    expect(result.winner_number).toBeOneOf(['001', '002']);
    expect(result.status).toEqual('completed');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save winner information to database', async () => {
    const input = { ...testInput, raffle_id: raffleId };
    const result = await selectWinner(input);

    // Query database to verify changes
    const raffles = await db.select()
      .from(rafflesTable)
      .where(eq(rafflesTable.id, raffleId))
      .execute();

    expect(raffles).toHaveLength(1);
    expect(raffles[0].winner_id).toEqual(result.winner_id);
    expect(raffles[0].winner_number).toEqual(result.winner_number);
    expect(raffles[0].status).toEqual('completed');
    expect(raffles[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent raffle', async () => {
    const input = { ...testInput, raffle_id: 99999 };
    
    expect(selectWinner(input)).rejects.toThrow(/raffle not found/i);
  });

  it('should throw error for non-active raffle', async () => {
    // Update raffle status to draft
    await db.update(rafflesTable)
      .set({ status: 'draft' })
      .where(eq(rafflesTable.id, raffleId))
      .execute();

    const input = { ...testInput, raffle_id: raffleId };
    
    expect(selectWinner(input)).rejects.toThrow(/raffle must be active/i);
  });

  it('should throw error when winner already selected', async () => {
    // Manually set a winner without changing status to test this specific condition
    await db.update(rafflesTable)
      .set({ winner_id: participantId1, winner_number: '001' })
      .where(eq(rafflesTable.id, raffleId))
      .execute();

    const input = { ...testInput, raffle_id: raffleId };
    
    expect(selectWinner(input)).rejects.toThrow(/winner already selected/i);
  });

  it('should throw error when no participants exist', async () => {
    // Delete all participations
    await db.delete(participationsTable)
      .where(eq(participationsTable.raffle_id, raffleId))
      .execute();

    const input = { ...testInput, raffle_id: raffleId };
    
    expect(selectWinner(input)).rejects.toThrow(/no participants found/i);
  });

  it('should handle selection_number method', async () => {
    // Create raffle with selection_number method
    const selectionRaffles = await db.insert(rafflesTable)
      .values({
        creator_id: creatorId,
        title: 'Selection Number Raffle',
        description: 'A raffle with selection number method',
        is_paid: false,
        winner_selection_method: 'selection_number',
        raffle_date: new Date(),
        unique_link: 'selection-raffle-link',
        status: 'active'
      })
      .returning()
      .execute();
    
    const selectionRaffleId = selectionRaffles[0].id;

    // Add participants
    await db.insert(participationsTable)
      .values([
        {
          raffle_id: selectionRaffleId,
          user_id: participantId1,
          selected_number: '123'
        }
      ])
      .execute();

    const input = { ...testInput, raffle_id: selectionRaffleId };
    const result = await selectWinner(input);

    expect(result.winner_id).toEqual(participantId1);
    expect(result.winner_number).toEqual('123');
    expect(result.status).toEqual('completed');
  });
});
