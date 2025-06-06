
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, rafflesTable } from '../db/schema';
import { type GetRafflesByCreatorInput, type CreateUserInput } from '../schema';
import { getRafflesByCreator } from '../handlers/get_raffles_by_creator';

describe('getRafflesByCreator', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return raffles for a specific creator', async () => {
    // Create a creator user
    const userInput: CreateUserInput = {
      email: 'creator@example.com',
      name: 'Creator User',
      role: 'creator'
    };

    const createdUsers = await db.insert(usersTable)
      .values(userInput)
      .returning()
      .execute();
    const creatorId = createdUsers[0].id;

    // Create multiple raffles for this creator
    const raffleData = [
      {
        creator_id: creatorId,
        title: 'First Raffle',
        description: 'First raffle description',
        images: JSON.stringify(['image1.jpg']),
        is_paid: true,
        price: '25.99',
        winner_selection_method: 'random' as const,
        number_quantity: 100,
        number_digits: 4,
        use_lottery_integration: false,
        raffle_date: new Date('2024-12-31'),
        raffle_time: '15:00',
        unique_link: 'first-raffle-unique',
        status: 'active' as const
      },
      {
        creator_id: creatorId,
        title: 'Second Raffle',
        description: 'Second raffle description',
        images: JSON.stringify(['image2.jpg', 'image3.jpg']),
        is_paid: false,
        price: null,
        winner_selection_method: 'selection_number' as const,
        number_quantity: 50,
        number_digits: 3,
        use_lottery_integration: true,
        raffle_date: new Date('2024-12-25'),
        raffle_time: '18:30',
        unique_link: 'second-raffle-unique',
        status: 'draft' as const
      }
    ];

    await db.insert(rafflesTable)
      .values(raffleData)
      .execute();

    const input: GetRafflesByCreatorInput = {
      creator_id: creatorId
    };

    const result = await getRafflesByCreator(input);

    expect(result).toHaveLength(2);
    
    // Verify first raffle
    const firstRaffle = result.find(r => r.title === 'First Raffle');
    expect(firstRaffle).toBeDefined();
    expect(firstRaffle!.creator_id).toBe(creatorId);
    expect(firstRaffle!.title).toBe('First Raffle');
    expect(firstRaffle!.description).toBe('First raffle description');
    expect(firstRaffle!.images).toEqual(['image1.jpg']);
    expect(firstRaffle!.is_paid).toBe(true);
    expect(firstRaffle!.price).toBe(25.99);
    expect(typeof firstRaffle!.price).toBe('number');
    expect(firstRaffle!.winner_selection_method).toBe('random');
    expect(firstRaffle!.status).toBe('active');

    // Verify second raffle
    const secondRaffle = result.find(r => r.title === 'Second Raffle');
    expect(secondRaffle).toBeDefined();
    expect(secondRaffle!.creator_id).toBe(creatorId);
    expect(secondRaffle!.title).toBe('Second Raffle');
    expect(secondRaffle!.images).toEqual(['image2.jpg', 'image3.jpg']);
    expect(secondRaffle!.is_paid).toBe(false);
    expect(secondRaffle!.price).toBeNull();
    expect(secondRaffle!.winner_selection_method).toBe('selection_number');
    expect(secondRaffle!.status).toBe('draft');
  });

  it('should return empty array for creator with no raffles', async () => {
    // Create a creator user with no raffles
    const userInput: CreateUserInput = {
      email: 'creator@example.com',
      name: 'Creator User',
      role: 'creator'
    };

    const createdUsers = await db.insert(usersTable)
      .values(userInput)
      .returning()
      .execute();
    const creatorId = createdUsers[0].id;

    const input: GetRafflesByCreatorInput = {
      creator_id: creatorId
    };

    const result = await getRafflesByCreator(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should not return raffles from other creators', async () => {
    // Create two creator users
    const creator1Input: CreateUserInput = {
      email: 'creator1@example.com',
      name: 'Creator One',
      role: 'creator'
    };

    const creator2Input: CreateUserInput = {
      email: 'creator2@example.com',
      name: 'Creator Two',
      role: 'creator'
    };

    const [creator1, creator2] = await Promise.all([
      db.insert(usersTable).values(creator1Input).returning().execute().then(r => r[0]),
      db.insert(usersTable).values(creator2Input).returning().execute().then(r => r[0])
    ]);

    // Create raffles for both creators
    const raffleData = [
      {
        creator_id: creator1.id,
        title: 'Creator 1 Raffle',
        description: 'Raffle by creator 1',
        images: null,
        is_paid: false,
        price: null,
        winner_selection_method: 'random' as const,
        number_quantity: null,
        number_digits: null,
        use_lottery_integration: null,
        raffle_date: new Date('2024-12-31'),
        raffle_time: null,
        unique_link: 'creator1-raffle-unique',
        status: 'active' as const
      },
      {
        creator_id: creator2.id,
        title: 'Creator 2 Raffle',
        description: 'Raffle by creator 2',
        images: null,
        is_paid: false,
        price: null,
        winner_selection_method: 'random' as const,
        number_quantity: null,
        number_digits: null,
        use_lottery_integration: null,
        raffle_date: new Date('2024-12-31'),
        raffle_time: null,
        unique_link: 'creator2-raffle-unique',
        status: 'active' as const
      }
    ];

    await db.insert(rafflesTable)
      .values(raffleData)
      .execute();

    const input: GetRafflesByCreatorInput = {
      creator_id: creator1.id
    };

    const result = await getRafflesByCreator(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Creator 1 Raffle');
    expect(result[0].creator_id).toBe(creator1.id);
    
    // Ensure we don't get creator 2's raffle
    const creator2Raffle = result.find(r => r.creator_id === creator2.id);
    expect(creator2Raffle).toBeUndefined();
  });
});
