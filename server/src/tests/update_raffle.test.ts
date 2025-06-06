
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, rafflesTable } from '../db/schema';
import { type UpdateRaffleInput } from '../schema';
import { updateRaffle } from '../handlers/update_raffle';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'creator@test.com',
  name: 'Test Creator',
  role: 'creator' as const
};

const testRaffle = {
  creator_id: 1,
  title: 'Original Title',
  description: 'Original description',
  images: ['image1.jpg', 'image2.jpg'],
  is_paid: true,
  price: '25.50',
  winner_selection_method: 'random' as const,
  number_quantity: 100,
  number_digits: 3,
  use_lottery_integration: false,
  raffle_date: new Date('2024-12-31'),
  raffle_time: '15:00',
  unique_link: 'test-raffle-link',
  status: 'draft' as const
};

describe('updateRaffle', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test user
    await db.insert(usersTable).values(testUser).execute();
    
    // Create test raffle
    await db.insert(rafflesTable).values(testRaffle).execute();
  });

  afterEach(resetDB);

  it('should update raffle title', async () => {
    const input: UpdateRaffleInput = {
      id: 1,
      title: 'Updated Title'
    };

    const result = await updateRaffle(input);

    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.id).toEqual(1);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const input: UpdateRaffleInput = {
      id: 1,
      title: 'New Title',
      description: 'New description',
      price: 30.75,
      status: 'active'
    };

    const result = await updateRaffle(input);

    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.price).toEqual(30.75);
    expect(result.status).toEqual('active');
    expect(typeof result.price).toEqual('number');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update nullable fields to null', async () => {
    const input: UpdateRaffleInput = {
      id: 1,
      description: null,
      price: null,
      images: null
    };

    const result = await updateRaffle(input);

    expect(result.description).toBeNull();
    expect(result.price).toBeNull();
    expect(result.images).toBeNull();
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
  });

  it('should save changes to database', async () => {
    const input: UpdateRaffleInput = {
      id: 1,
      title: 'Database Test Title',
      price: 15.99
    };

    await updateRaffle(input);

    // Query database to verify changes
    const raffles = await db.select()
      .from(rafflesTable)
      .where(eq(rafflesTable.id, 1))
      .execute();

    expect(raffles).toHaveLength(1);
    expect(raffles[0].title).toEqual('Database Test Title');
    expect(parseFloat(raffles[0].price!)).toEqual(15.99);
    expect(raffles[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update raffle with selection number method fields', async () => {
    const input: UpdateRaffleInput = {
      id: 1,
      winner_selection_method: 'selection_number',
      number_quantity: 500,
      number_digits: 4,
      use_lottery_integration: true
    };

    const result = await updateRaffle(input);

    expect(result.winner_selection_method).toEqual('selection_number');
    expect(result.number_quantity).toEqual(500);
    expect(result.number_digits).toEqual(4);
    expect(result.use_lottery_integration).toEqual(true);
  });

  it('should update raffle date and time', async () => {
    const newDate = new Date('2025-01-15');
    const input: UpdateRaffleInput = {
      id: 1,
      raffle_date: newDate,
      raffle_time: '18:30'
    };

    const result = await updateRaffle(input);

    expect(result.raffle_date).toEqual(newDate);
    expect(result.raffle_time).toEqual('18:30');
  });

  it('should throw error for non-existent raffle', async () => {
    const input: UpdateRaffleInput = {
      id: 999,
      title: 'Non-existent'
    };

    expect(updateRaffle(input)).rejects.toThrow(/not found/i);
  });

  it('should handle images array update', async () => {
    const input: UpdateRaffleInput = {
      id: 1,
      images: ['new1.jpg', 'new2.jpg', 'new3.jpg']
    };

    const result = await updateRaffle(input);

    expect(result.images).toEqual(['new1.jpg', 'new2.jpg', 'new3.jpg']);
    expect(Array.isArray(result.images)).toBe(true);
  });

  it('should verify null values are saved to database', async () => {
    const input: UpdateRaffleInput = {
      id: 1,
      description: null,
      price: null
    };

    await updateRaffle(input);

    // Query database to verify null values are saved
    const raffles = await db.select()
      .from(rafflesTable)
      .where(eq(rafflesTable.id, 1))
      .execute();

    expect(raffles).toHaveLength(1);
    expect(raffles[0].description).toBeNull();
    expect(raffles[0].price).toBeNull();
  });
});
