
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, rafflesTable, participationsTable } from '../db/schema';
import { type ParticipateInRaffleInput } from '../schema';
import { participateInRaffle } from '../handlers/participate_in_raffle';
import { eq, and } from 'drizzle-orm';

// Helper function to create test user
const createTestUser = async () => {
  const result = await db.insert(usersTable)
    .values({
      email: 'test@example.com',
      name: 'Test User',
      role: 'client'
    })
    .returning()
    .execute();
  return result[0];
};

// Helper function to create test creator
const createTestCreator = async () => {
  const result = await db.insert(usersTable)
    .values({
      email: 'creator@example.com',
      name: 'Test Creator',
      role: 'creator'
    })
    .returning()
    .execute();
  return result[0];
};

// Helper function to create test raffle
const createTestRaffle = async (creatorId: number, status: 'active' | 'draft' | 'completed' | 'cancelled' = 'active') => {
  const result = await db.insert(rafflesTable)
    .values({
      creator_id: creatorId,
      title: 'Test Raffle',
      description: 'A test raffle',
      is_paid: false,
      winner_selection_method: 'random',
      raffle_date: new Date(),
      unique_link: 'test-raffle-link',
      status: status
    })
    .returning()
    .execute();
  return result[0];
};

describe('participateInRaffle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a participation record', async () => {
    const user = await createTestUser();
    const creator = await createTestCreator();
    const raffle = await createTestRaffle(creator.id);

    const input: ParticipateInRaffleInput = {
      raffle_id: raffle.id,
      user_id: user.id,
      selected_number: '123'
    };

    const result = await participateInRaffle(input);

    expect(result.raffle_id).toEqual(raffle.id);
    expect(result.user_id).toEqual(user.id);
    expect(result.selected_number).toEqual('123');
    expect(result.payment_status).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save participation to database', async () => {
    const user = await createTestUser();
    const creator = await createTestCreator();
    const raffle = await createTestRaffle(creator.id);

    const input: ParticipateInRaffleInput = {
      raffle_id: raffle.id,
      user_id: user.id,
      selected_number: null
    };

    const result = await participateInRaffle(input);

    const participations = await db.select()
      .from(participationsTable)
      .where(eq(participationsTable.id, result.id))
      .execute();

    expect(participations).toHaveLength(1);
    expect(participations[0].raffle_id).toEqual(raffle.id);
    expect(participations[0].user_id).toEqual(user.id);
    expect(participations[0].selected_number).toBeNull();
    expect(participations[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when raffle does not exist', async () => {
    const user = await createTestUser();

    const input: ParticipateInRaffleInput = {
      raffle_id: 999999,
      user_id: user.id
    };

    await expect(participateInRaffle(input)).rejects.toThrow(/raffle not found/i);
  });

  it('should throw error when user does not exist', async () => {
    const creator = await createTestCreator();
    const raffle = await createTestRaffle(creator.id);

    const input: ParticipateInRaffleInput = {
      raffle_id: raffle.id,
      user_id: 999999
    };

    await expect(participateInRaffle(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when raffle is not active', async () => {
    const user = await createTestUser();
    const creator = await createTestCreator();
    const raffle = await createTestRaffle(creator.id, 'draft');

    const input: ParticipateInRaffleInput = {
      raffle_id: raffle.id,
      user_id: user.id
    };

    await expect(participateInRaffle(input)).rejects.toThrow(/raffle is not active/i);
  });

  it('should throw error when user already participated', async () => {
    const user = await createTestUser();
    const creator = await createTestCreator();
    const raffle = await createTestRaffle(creator.id);

    const input: ParticipateInRaffleInput = {
      raffle_id: raffle.id,
      user_id: user.id,
      selected_number: '456'
    };

    // First participation should succeed
    await participateInRaffle(input);

    // Second participation should fail
    await expect(participateInRaffle(input)).rejects.toThrow(/already participated/i);
  });

  it('should handle participation without selected number', async () => {
    const user = await createTestUser();
    const creator = await createTestCreator();
    const raffle = await createTestRaffle(creator.id);

    const input: ParticipateInRaffleInput = {
      raffle_id: raffle.id,
      user_id: user.id
    };

    const result = await participateInRaffle(input);

    expect(result.selected_number).toBeNull();
    expect(result.raffle_id).toEqual(raffle.id);
    expect(result.user_id).toEqual(user.id);
  });
});
