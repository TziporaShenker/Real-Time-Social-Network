import pool from '../config/db';

export const sendFriendRequest = async (requesterId: string, addresseeId: string) => {
  const query = `
    INSERT INTO friendships (requester_id, addressee_id, status)
    VALUES ($1, $2, 'PENDING')
    RETURNING *;
  `;
  const result = await pool.query(query, [requesterId, addresseeId]);
  return result.rows[0];
};

export const acceptFriendRequest = async (requesterId: string, addresseeId: string) => {
  const query = `
    UPDATE friendships
    SET status = 'ACCEPTED'
    WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)
    RETURNING *;
  `;
  const result = await pool.query(query, [requesterId, addresseeId]);
  return result.rows[0];
};

export const getFriendsList = async (userId: string) => {
  const query = `
    SELECT u.id, u.username, u.first_name, u.last_name, u.bio
    FROM users u
    JOIN friendships f ON (u.id = f.requester_id OR u.id = f.addressee_id)
    WHERE (f.requester_id = $1 OR f.addressee_id = $1) 
    AND f.status = 'ACCEPTED'
    AND u.id != $1;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

export const deleteFriendship = async (userId: string, friendId: string) => {
  const query = `
    DELETE FROM friendships 
    WHERE (requester_id = $1 AND addressee_id = $2) 
       OR (requester_id = $2 AND addressee_id = $1)
    RETURNING *;
  `;
  const result = await pool.query(query, [userId, friendId]);
  return result.rows[0];
};


// Fetch requests where the user RECEIVED the request (they are the addressee)
export const getReceivedRequests = async (userId: string) => {
  const query = `
    SELECT u.id, u.username, u.first_name, u.last_name, u.bio
    FROM friendships f
    JOIN users u ON f.requester_id = u.id -- We want to see info about the person who SENT it
    WHERE f.addressee_id = $1 AND f.status = 'PENDING';
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

// Fetch requests where the user SENT the request (they are the requester)
export const getSentRequests = async (userId: string) => {
  const query = `
    SELECT u.id, u.username, u.first_name, u.last_name, u.bio
    FROM friendships f
    JOIN users u ON f.addressee_id = u.id -- We want to see info about the person who will RECEIVE it
    WHERE f.requester_id = $1 AND f.status = 'PENDING';
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

// --- NEW: Check friendship status between two users ---
export const checkFriendshipStatus = async (userId1: string, userId2: string) => {
  const query = `
    SELECT * FROM friendships 
    WHERE (requester_id = $1 AND addressee_id = $2) 
       OR (requester_id = $2 AND addressee_id = $1);
  `;
  const result = await pool.query(query, [userId1, userId2]);
  return result.rows[0]; // Returns the friendship record if it exists, otherwise undefined
};