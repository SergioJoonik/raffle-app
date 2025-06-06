
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { rafflesTable, usersTable } from '../db/schema';
import { type CreateRaffleInput, type CreateUserInput } from '../schema';
import { createRaffle } from '../handlers/create_raffle';
import { eq } from 'drizzle-orm';

describe('createRaffle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCreator: any;

  beforeEach(async () => {
    // Create a test creator user first
    const userInput: CreateUserInput = {
      email: 'creator@test.com',
      name: 'Test Creator',
      role: 'creator'
    };

    const createdUsers = await db.insert(usersTable)
      .values(userInput)
      .returning()
      .execute();
    
    testCreator = createdUsers[0];
  });

  const createTestInput = (overrides?: Partial<CreateRaffleInput>): CreateRaffleInput => ({
    creator_id: testCreator.id,
    title: 'Test Raffle',
    description: 'A raffle for testing',
    images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    is_paid: true,
    price: 25.50,
    winner_selection_method: 'random',
    number_quantity: 100,
    number_digits: 4,
    use_lottery_integration: false,
    raffle_date: new Date('2024-12-31'),
    raffle_time: '15:30',
    ...overrides
  });

  it('should create a raffle with all fields', async () => {
    const testInput = createTestInput();
    const result = await createRaffle(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Raffle');
    expect(result.description).toEqual('A raffle for testing');
    expect(result.images).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']);
    expect(result.is_paid).toEqual(true);
    expect(result.price).toEqual(25.50);
    expect(typeof result.price).toEqual('number');
    expect(result.winner_selection_method).toEqual('random');
    expect(result.number_quantity).toEqual(100);
    expect(result.number_digits).toEqual(4);
    expect(result.use_lottery_integration).toEqual(false);
    expect(result.raffle_date).toEqual(new Date('2024-12-31'));
    expect(result.raffle_time).toEqual('15:30');
    expect(result.creator_id).toEqual(testCreator.id);
    expect(result.status).toEqual('draft');
    expect(result.id).toBeDefined();
    expect(result.unique_link).toBeDefined();
    expect(result.unique_link.length).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a raffle with minimal fields', async () => {
    const testInput = createTestInput({
      description: undefined,
      images: undefined,
      price: undefined,
      number_quantity: undefined,
      number_digits: undefined,
      use_lottery_integration: undefined,
      raffle_time: undefined
    });

    const result = await createRaffle(testInput);

    expect(result.title).toEqual('Test Raffle');
    expect(result.description).toBeNull();
    expect(result.images).toBeNull();
    expect(result.price).toBeNull();
    expect(result.number_quantity).toBeNull();
    expect(result.number_digits).toBeNull();
    expect(result.use_lottery_integration).toBeNull();
    expect(result.raffle_time).toBeNull();
    expect(result.is_paid).toEqual(true);
    expect(result.winner_selection_method).toEqual('random');
  });

  it('should save raffle to database', async () => {
    const testInput = createTestInput();
    const result = await createRaffle(testInput);

    // Query using proper drizzle syntax
    const raffles = await db.select()
      .from(rafflesTable)
      .where(eq(rafflesTable.id, result.id))
      .execute();

    expect(raffles).toHaveLength(1);
    expect(raffles[0].title).toEqual('Test Raffle');
    expect(raffles[0].creator_id).toEqual(testCreator.id);
    expect(parseFloat(raffles[0].price!)).toEqual(25.50);
    expect(raffles[0].unique_link).toEqual(result.unique_link);
    expect(raffles[0].status).toEqual('draft');
    expect(raffles[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate unique links for different raffles', async () => {
    const testInput1 = createTestInput({ title: 'Raffle 1' });
    const testInput2 = createTestInput({ title: 'Raffle 2' });

    const result1 = await createRaffle(testInput1);
    const result2 = await createRaffle(testInput2);

    expect(result1.unique_link).not.toEqual(result2.unique_link);
    expect(result1.unique_link.length).toBeGreaterThan(0);
    expect(result2.unique_link.length).toBeGreaterThan(0);
  });

  it('should handle selection_number winner method', async () => {
    const testInput = createTestInput({
      winner_selection_method: 'selection_number',
      number_quantity: 50,
      number_digits: 3
    });

    const result = await createRaffle(testInput);

    expect(result.winner_selection_method).toEqual('selection_number');
    expect(result.number_quantity).toEqual(50);
    expect(result.number_digits).toEqual(3);
  });

  it('should handle boolean values correctly', async () => {
    const testInputTrue = createTestInput({ use_lottery_integration: true });
    const testInputFalse = createTestInput({ use_lottery_integration: false });

    const resultTrue = await createRaffle(testInputTrue);
    const resultFalse = await createRaffle(testInputFalse);

    expect(resultTrue.use_lottery_integration).toEqual(true);
    expect(resultFalse.use_lottery_integration).toEqual(false);
  });

  it('should throw error when creator does not exist', async () => {
    const testInput = createTestInput({ creator_id: 99999 });

    await expect(createRaffle(testInput)).rejects.toThrow(/Creator with id 99999 not found/i);
  });
});
