import pool from '../config/db';

/**
 * Persists a new Refresh Token in the database associated with a specific user.
 * 
 * @param {string} userId - The unique identifier of the user.
 * @param {string} token - The signed JWT refresh token string.
 * @param {Date} expiresAt - The calculated expiration timestamp for the token.
 * @returns {Promise<any>} The newly created refresh token record.
 */
export const saveRefreshToken = async (userId: string, token: string, expiresAt: Date) => {
  const query = `
    INSERT INTO refresh_tokens (user_id, token, expires_at)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [userId, token, expiresAt];
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Retrieves a refresh token record from the database to verify its existence and validity.
 * 
 * @param {string} token - The refresh token string to search for.
 * @returns {Promise<any | undefined>} The token record if found, otherwise undefined.
 */
export const findToken = async (token: string) => {
  const query = `
    SELECT * FROM refresh_tokens 
    WHERE token = $1;
  `;
  const values = [token];
  
  const result = await pool.query(query, values);
  return result.rows[0]; 
};

/**
 * Deletes a specific refresh token from the database.
 * Typically used during logout or when a token is rotated.
 * 
 * @param {string} token - The refresh token string to be removed.
 * @returns {Promise<void>}
 */
export const deleteToken = async (token: string) => {
  const query = `
    DELETE FROM refresh_tokens 
    WHERE token = $1;
  `;
  const values = [token];
  
  await pool.query(query, values);
};

/**
 * Revokes all refresh tokens associated with a specific user.
 * Useful for security events, such as a forced global logout or password reset.
 * 
 * @param {string} userId - The unique identifier of the user.
 * @returns {Promise<void>}
 */
export const deleteAllUserTokens = async (userId: string) => {
  const query = `
    DELETE FROM refresh_tokens 
    WHERE user_id = $1;
  `;
  const values = [userId];
  
  await pool.query(query, values);
};