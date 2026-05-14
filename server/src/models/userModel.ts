import pool from '../config/db';

/**
 * Interface representing the core User entity in the database.
 */
export interface User {
  id?: string;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  bio?: string;
  created_at?: Date;
}

/**
 * Interface for the subset of user data allowed to be updated via the profile settings.
 */
interface UpdateUserData {
  first_name: string;
  last_name: string;
  bio?: string;
}

/**
 * Creates a new user record in the database.
 * 
 * @param {User} user - The user object containing registration details.
 * @returns {Promise<Partial<User>>} The newly created user, excluding sensitive fields like password_hash.
 */
export const createUser = async (user: User) => {
  const query = `
    INSERT INTO users (username, email, password_hash, first_name, last_name, bio)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, username, email, first_name, last_name, created_at;
  `;
  const values = [user.username, user.email, user.password_hash, user.first_name, user.last_name, user.bio];
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Updates an existing user's profile information.
 * 
 * @param {string} id - The unique identifier of the user to update.
 * @param {UpdateUserData} data - The new profile data.
 * @returns {Promise<Partial<User>>} The updated user record.
 */
export const updateUser = async (id: string, data: UpdateUserData) => {
  const { first_name, last_name, bio } = data;
  
  const query = `
    UPDATE users 
    SET first_name = $1, last_name = $2, bio = $3
    WHERE id = $4
    RETURNING id, username, email, first_name, last_name, bio;
  `;
  
  // Explicitly pass null if bio is an empty string to maintain database consistency
  const values = [first_name, last_name, bio || null, id]; 
  const result = await pool.query(query, values);
  
  return result.rows[0];
};

/**
 * Retrieves a user's public profile data based on their unique username.
 * 
 * @param {string} username - The username to search for.
 * @returns {Promise<Partial<User> | undefined>} The user record if found.
 */
export const findUserByUsername = async (username: string) => {
  const query = `
    SELECT id, username, email, first_name, last_name, bio, created_at
    FROM users
    WHERE username = $1
  `;
  
  const result = await pool.query(query, [username]);
  return result.rows[0];
};

/**
 * Retrieves a full user record (including password_hash) by email.
 * Primarily used for authentication processes.
 * 
 * @param {string} email - The email address to search for.
 * @returns {Promise<User | undefined>} The full user record.
 */
export const findUserByEmail = async (email: string) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

/**
 * Retrieves a user's public profile data based on their unique ID.
 * 
 * @param {string} id - The unique user identifier.
 * @returns {Promise<Partial<User> | undefined>} The user record if found.
 */
export const findUserById = async (id: string) => {
  const result = await pool.query(
    'SELECT id, username, email, first_name, last_name, bio, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

/**
 * Performs a partial match search across usernames, first names, and last names.
 * Uses the ILIKE operator for case-insensitive matching.
 * 
 * @param {string} searchTerm - The string to search for in user records.
 * @returns {Promise<Array<Partial<User>>>} A list of matching users, limited to the top 20 results.
 */
export const searchUsersInDB = async (searchTerm: string) => {
  const query = `
    SELECT id, username, first_name, last_name, bio 
    FROM users 
    WHERE 
    　 username ILIKE $1 OR 
    　 first_name ILIKE $1 OR 
    　 last_name ILIKE $1
    LIMIT 20;
  `;
  const values = [`%${searchTerm}%`];
  const { rows } = await pool.query(query, values);
  return rows;
};