
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, rafflesTable } from '../db/schema';
import { getRaffles } from '../handlers/get_raffles';

describe('getRaffles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no raffles exist', async () => {
    const result = await getRaffles();
    expect(result).toEqual([]);
  });

  it('should return all raffles', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'creator@test.com',
        name: 'Test Creator',
        role: 'creator'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test raffles
    await db.insert(rafflesTable)
      .values([
        {
          creator_id: userId,
          title: 'First Raffle',
          description: 'First test raffle',
          is_paid: false,
          winner_selection_method: 'random',
          raffle_date: new Date('2024-12-31'),
          unique_link: 'first-raffle-123',
          status: 'draft'
        },
        {
          creator_id: userId,
          title: 'Second Raffle',
          description: 'Second test raffle',
          is_paid: true,
          price: '25.50',
          winner_selection_method: 'selection_number',
          number_quantity: 100,
          number_digits: 3,
          raffle_date: new Date('2024-12-25'),
          unique_link: 'second-raffle-456',
          status: 'active'
        }
      ])
      .execute();

    const result = await getRaffles();

    expect(result).toHaveLength(2);
    
    // Check first raffle
    const firstRaffle = result.find(r => r.title === 'First Raffle');
    expect(firstRaffle).toBeDefined();
    expect(firstRaffle!.creator_id).toEqual(userId);
    expect(firstRaffle!.description).toEqual('First test raffle');
    expect(firstRaffle!.is_paid).toEqual(false);
    expect(firstRaffle!.price).toBeNull();
    expect(firstRaffle!.winner_selection_method).toEqual('random');
    expect(firstRaffle!.status).toEqual('draft');
    expect(firstRaffle!.unique_link).toEqual('first-raffle-123');

    // Check second raffle
    const secondRaffle = result.find(r => r.title === 'Second Raffle');
    expect(secondRaffle).toBeDefined();
    expect(secondRaffle!.is_paid).toEqual(true);
    expect(secondRaffle!.price).toEqual(25.5);
    expect(typeof secondRaffle!.price).toEqual('number');
    expect(secondRaffle!.winner_selection_method).toEqual('selection_number');
    expect(secondRaffle!.number_quantity).toEqual(100);
    expect(secondRaffle!.number_digits).toEqual(3);
    expect(secondRaffle!.status).toEqual('active');
  });

  it('should handle raffles with images correctly', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'creator@test.com',
        name: 'Test Creator',
        role: 'creator'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create raffle with images
    await db.insert(rafflesTable)
      .values({
        creator_id: userId,
        title: 'Raffle with Images',
        description: 'Test raffle with images',
        images: JSON.stringify(['image1.jpg', 'image2.png']),
        is_paid: false,
        winner_selection_method: 'random',
        raffle_date: new Date('2024-12-31'),
        unique_link: 'raffle-with-images-789',
        status: 'draft'
      })
      .execute();

    const result = await getRaffles();

    expect(result).toHaveLength(1);
    expect(result[0].images).toEqual(['image1.jpg', 'image2.png']);
    expect(Array.isArray(result[0].images)).toBe(true);
  });

  it('should handle all date fields correctly', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'creator@test.com',
        name: 'Test Creator',
        role: 'creator'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const testDate = new Date('2024-06-15T10:30:00Z');

    await db.insert(rafflesTable)
      .values({
        creator_id: userId,
        title: 'Date Test Raffle',
        is_paid: false,
        winner_selection_method: 'random',
        raffle_date: testDate,
        raffle_time: '14:30',
        unique_link: 'date-test-raffle',
        status: 'draft'
      })
      .execute();

    const result = await getRaffles();

    expect(result).toHaveLength(1);
    expect(result[0].raffle_date).toBeInstanceOf(Date);
    expect(result[0].raffle_time).toEqual('14:30');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });
});
