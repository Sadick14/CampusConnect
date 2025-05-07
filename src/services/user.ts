/**
 * Represents a user.
 */
export interface User {
  /**
   * The unique identifier of the user.
   */
  id: string;
  /**
   * The name of the user.
   */
  name: string;
  /**
   * The role of the user.
   */
  role: string;
  /**
   * The school ID of the user.
   */
  schoolId: string;
}

/**
 * Asynchronously retrieves a user by its ID.
 *
 * @param id The ID of the user to retrieve.
 * @returns A promise that resolves to a User object if found, or null if not found.
 */
export async function getUser(id: string): Promise<User | null> {
  // TODO: Implement this by calling an API.

  return {
    id: '123',
    name: 'John Doe',
    role: 'admin',
    schoolId: '456',
  };
}

/**
 * Asynchronously creates a new user.
 *
 * @param user The user to create.
 * @returns A promise that resolves to the created User object.
 */
export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  // TODO: Implement this by calling an API.

  return {
    id: '456',
    name: user.name,
    role: user.role,
    schoolId: user.schoolId,
  };
}
