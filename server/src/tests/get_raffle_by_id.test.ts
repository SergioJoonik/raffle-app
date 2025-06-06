
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, rafflesTable } from '../db/schema';
import { getRaffleById } from '../handlers/get_raffle_by_id';

describe('getRaffleById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return raffle by id', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'creator@test.com',
        name: 'Test Creator',
        role: 'creator'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test raffle
    const raffleResult = await db.insert(rafflesTable)
      .values({
        creator_id: userId,
        title: 'Test Raffle',
        description: 'A test raffle',
        images: ['image1.jpg', 'image2.jpg'],
        is_paid: true,
        price: '25.99',
        winner_selection_method: 'random',
        number_quantity: 100,
        number_digits: 4,
        use_lottery_integration: false,
        raffle_date: new Date('2024-12-31'),
        raffle_time: '18:00',
        unique_link: 'test-raffle-123',
        status: 'active'
      })
      .returning()
      .execute();

    const raffleId = raffleResult[0].id;

    const result = await getRaffleById(raffleId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(raffleId);
    expect(result!.title).toEqual('Test Raffle');
    expect(result!.description).toEqual('A test raffle');
    expect(result!.images).toEqual(['image1.jpg', 'image2.jpg']);
    expect(result!.is_paid).toEqual(true);
    expect(result!.price).toEqual(25.99);
    expect(typeof result!.price).toEqual('number');
    expect(result!.winner_selection_method).toEqual('random');
    expect(result!.number_quantity).toEqual(100);
    expect(result!.number_digits).toEqual(4);
    expect(result!.use_lottery_integration).toEqual(false);
    expect(result!.raffle_date).toBeInstanceOf(Date);
    expect(result!.raffle_time).toEqual('18:00');
    expect(result!.unique_link).toEqual('test-raffle-123');
    expect(result!.status).toEqual('active');
    expect(result!.creator_id).toEqual(userId);
    expect(result!.winner_id).toBeNull();
    expect(result!.winner_number).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent raffle', async () => {
    const result = await getRaffleById(999);

    expect(result).toBeNull();
  });

  it('should handle raffle with null values correctly', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'creator@test.com',
        name: 'Test Creator',
        role: 'creator'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create minimal raffle with null values
    const raffleResult = await db.insert(rafflesTable)
      .values({
        creator_id: userId,
        title: 'Minimal Raffle',
        description: null,
        images: null,
        is_paid: false,
        price: null,
        winner_selection_method: 'selection_number',
        number_quantity: null,
        number_digits: null,
        use_lottery_integration: null,
        raffle_date: new Date('2024-12-31'),
        raffle_time: null,
        unique_link: 'minimal-raffle-456',
        status: 'draft'
      })
      .returning()
      .execute();

    const raffleId = raffleResult[0].id;

    const result = await getRaffleById(raffleId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(raffleId);
    expect(result!.title).toEqual('Minimal Raffle');
    expect(result!.description).toBeNull();
    expect(result!.images).toBeNull();
    expect(result!.is_paid).toEqual(false);
    expect(result!.price).toBeNull();
    expect(result!.number_quantity).toBeNull();
    expect(result!.number_digits).toBeNull();
    expect(result!.use_lottery_integration).toBeNull();
    expect(result!.raffle_time).toBeNull();
    expect(result!.status).toEqual('draft');
  });
});
