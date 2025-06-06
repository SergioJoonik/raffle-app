
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

const testInput: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  role: 'creator'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.role).toEqual('creator');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].name).toEqual('Test User');
    expect(users[0].role).toEqual('creator');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should create user with client role', async () => {
    const clientInput: CreateUserInput = {
      email: 'client@example.com',
      name: 'Client User',
      role: 'client'
    };

    const result = await createUser(clientInput);

    expect(result.role).toEqual('client');
    expect(result.email).toEqual('client@example.com');
    expect(result.name).toEqual('Client User');
  });

  it('should fail with duplicate email', async () => {
    await createUser(testInput);

    expect(createUser(testInput)).rejects.toThrow(/duplicate key value/i);
  });
});
