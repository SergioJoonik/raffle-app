
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, rafflesTable, participationsTable } from '../db/schema';
import { type GetRaffleParticipantsInput, type CreateUserInput } from '../schema';
import { getRaffleParticipants } from '../handlers/get_raffle_participants';

// Helper function to generate random string
const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Test input
const testInput: GetRaffleParticipantsInput = {
  raffle_id: 1
};

// Helper data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  role: 'creator'
};

const testParticipant: CreateUserInput = {
  email: 'participant@example.com',
  name: 'Test Participant',
  role: 'client'
};

describe('getRaffleParticipants', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when raffle has no participants', async () => {
    // Create user and raffle
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(rafflesTable).values({
      creator_id: 1,
      title: 'Test Raffle',
      description: 'A test raffle',
      is_paid: false,
      winner_selection_method: 'random',
      raffle_date: new Date('2024-12-31'),
      unique_link: generateRandomString(10)
    }).execute();

    const result = await getRaffleParticipants(testInput);

    expect(result).toEqual([]);
  });

  it('should return participants for a raffle', async () => {
    // Create users
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(usersTable).values(testParticipant).execute();

    // Create raffle
    await db.insert(rafflesTable).values({
      creator_id: 1,
      title: 'Test Raffle',
      description: 'A test raffle',
      is_paid: false,
      winner_selection_method: 'random',
      raffle_date: new Date('2024-12-31'),
      unique_link: generateRandomString(10)
    }).execute();

    // Create participation
    await db.insert(participationsTable).values({
      raffle_id: 1,
      user_id: 2,
      selected_number: '123'
    }).execute();

    const result = await getRaffleParticipants(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].raffle_id).toEqual(1);
    expect(result[0].user_id).toEqual(2);
    expect(result[0].selected_number).toEqual('123');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple participants for a raffle', async () => {
    // Create users
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(usersTable).values(testParticipant).execute();
    await db.insert(usersTable).values({
      email: 'participant2@example.com',
      name: 'Test Participant 2',
      role: 'client'
    }).execute();

    // Create raffle
    await db.insert(rafflesTable).values({
      creator_id: 1,
      title: 'Test Raffle',
      description: 'A test raffle',
      is_paid: false,
      winner_selection_method: 'random',
      raffle_date: new Date('2024-12-31'),
      unique_link: generateRandomString(10)
    }).execute();

    // Create multiple participations
    await db.insert(participationsTable).values([
      {
        raffle_id: 1,
        user_id: 2,
        selected_number: '123'
      },
      {
        raffle_id: 1,
        user_id: 3,
        selected_number: '456'
      }
    ]).execute();

    const result = await getRaffleParticipants(testInput);

    expect(result).toHaveLength(2);
    expect(result[0].raffle_id).toEqual(1);
    expect(result[1].raffle_id).toEqual(1);
    expect(result.map(p => p.user_id)).toContain(2);
    expect(result.map(p => p.user_id)).toContain(3);
    expect(result.map(p => p.selected_number)).toContain('123');
    expect(result.map(p => p.selected_number)).toContain('456');
  });

  it('should only return participants for the specified raffle', async () => {
    // Create users
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(usersTable).values(testParticipant).execute();

    // Create multiple raffles
    await db.insert(rafflesTable).values([
      {
        creator_id: 1,
        title: 'Test Raffle',
        description: 'A test raffle',
        is_paid: false,
        winner_selection_method: 'random',
        raffle_date: new Date('2024-12-31'),
        unique_link: generateRandomString(10)
      },
      {
        creator_id: 1,
        title: 'Second Raffle',
        description: 'A test raffle',
        is_paid: false,
        winner_selection_method: 'random',
        raffle_date: new Date('2024-12-31'),
        unique_link: generateRandomString(10)
      }
    ]).execute();

    // Create participations for different raffles
    await db.insert(participationsTable).values([
      {
        raffle_id: 1,
        user_id: 2,
        selected_number: '123'
      },
      {
        raffle_id: 2,
        user_id: 2,
        selected_number: '456'
      }
    ]).execute();

    const result = await getRaffleParticipants({ raffle_id: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].raffle_id).toEqual(1);
    expect(result[0].selected_number).toEqual('123');
  });
});
