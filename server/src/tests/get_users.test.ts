
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

// Test user inputs
const testUser1: CreateUserInput = {
  email: 'user1@example.com',
  name: 'User One',
  role: 'creator'
};

const testUser2: CreateUserInput = {
  email: 'user2@example.com',
  name: 'User Two',
  role: 'client'
};

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([testUser1, testUser2])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Verify first user
    const user1 = result.find(u => u.email === 'user1@example.com');
    expect(user1).toBeDefined();
    expect(user1!.name).toEqual('User One');
    expect(user1!.role).toEqual('creator');
    expect(user1!.id).toBeDefined();
    expect(user1!.created_at).toBeInstanceOf(Date);

    // Verify second user
    const user2 = result.find(u => u.email === 'user2@example.com');
    expect(user2).toBeDefined();
    expect(user2!.name).toEqual('User Two');
    expect(user2!.role).toEqual('client');
    expect(user2!.id).toBeDefined();
    expect(user2!.created_at).toBeInstanceOf(Date);
  });

  it('should return users in order they were created', async () => {
    // Create users one by one to ensure order
    await db.insert(usersTable)
      .values(testUser1)
      .execute();

    await db.insert(usersTable)
      .values(testUser2)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    expect(result[0].email).toEqual('user1@example.com');
    expect(result[1].email).toEqual('user2@example.com');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
