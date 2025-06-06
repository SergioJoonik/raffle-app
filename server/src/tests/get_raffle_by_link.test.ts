
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, rafflesTable } from '../db/schema';
import { type GetRaffleByLinkInput } from '../schema';
import { getRaffleByLink } from '../handlers/get_raffle_by_link';

describe('getRaffleByLink', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return raffle by unique link', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'creator@test.com',
        name: 'Test Creator',
        role: 'creator'
      })
      .returning()
      .execute();

    const creator = userResult[0];

    // Create test raffle
    const raffleResult = await db.insert(rafflesTable)
      .values({
        creator_id: creator.id,
        title: 'Test Raffle',
        description: 'A test raffle',
        images: ['image1.jpg', 'image2.jpg'],
        is_paid: true,
        price: '19.99',
        winner_selection_method: 'random',
        number_quantity: 100,
        number_digits: 3,
        use_lottery_integration: false,
        raffle_date: new Date('2024-12-31'),
        raffle_time: '15:30',
        unique_link: 'test-unique-link-123',
        status: 'active'
      })
      .returning()
      .execute();

    const createdRaffle = raffleResult[0];

    const input: GetRaffleByLinkInput = {
      unique_link: 'test-unique-link-123'
    };

    const result = await getRaffleByLink(input);

    expect(result).toBeDefined();
    expect(result?.id).toEqual(createdRaffle.id);
    expect(result?.title).toEqual('Test Raffle');
    expect(result?.description).toEqual('A test raffle');
    expect(result?.images).toEqual(['image1.jpg', 'image2.jpg']);
    expect(result?.is_paid).toEqual(true);
    expect(result?.price).toEqual(19.99);
    expect(typeof result?.price).toEqual('number');
    expect(result?.winner_selection_method).toEqual('random');
    expect(result?.unique_link).toEqual('test-unique-link-123');
    expect(result?.status).toEqual('active');
    expect(result?.creator_id).toEqual(creator.id);
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when raffle not found', async () => {
    const input: GetRaffleByLinkInput = {
      unique_link: 'non-existent-link'
    };

    const result = await getRaffleByLink(input);

    expect(result).toBeNull();
  });

  it('should handle raffle with null price correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'creator@test.com',
        name: 'Test Creator',
        role: 'creator'
      })
      .returning()
      .execute();

    const creator = userResult[0];

    // Create free raffle (no price)
    await db.insert(rafflesTable)
      .values({
        creator_id: creator.id,
        title: 'Free Raffle',
        is_paid: false,
        price: null,
        winner_selection_method: 'selection_number',
        raffle_date: new Date('2024-12-31'),
        unique_link: 'free-raffle-link',
        status: 'draft'
      })
      .execute();

    const input: GetRaffleByLinkInput = {
      unique_link: 'free-raffle-link'
    };

    const result = await getRaffleByLink(input);

    expect(result).toBeDefined();
    expect(result?.title).toEqual('Free Raffle');
    expect(result?.price).toBeNull();
    expect(result?.is_paid).toEqual(false);
  });

  it('should handle raffle with null images correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'creator@test.com',
        name: 'Test Creator',
        role: 'creator'
      })
      .returning()
      .execute();

    const creator = userResult[0];

    // Create raffle without images
    await db.insert(rafflesTable)
      .values({
        creator_id: creator.id,
        title: 'No Images Raffle',
        images: null,
        is_paid: false,
        winner_selection_method: 'random',
        raffle_date: new Date('2024-12-31'),
        unique_link: 'no-images-link',
        status: 'active'
      })
      .execute();

    const input: GetRaffleByLinkInput = {
      unique_link: 'no-images-link'
    };

    const result = await getRaffleByLink(input);

    expect(result).toBeDefined();
    expect(result?.title).toEqual('No Images Raffle');
    expect(result?.images).toBeNull();
  });
});
