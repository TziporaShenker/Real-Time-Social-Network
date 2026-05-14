import pool from "../config/db";

// Check if two users are confirmed friends
export const checkFriendship = async (userId1: string, userId2: string) => {
  const query = `
    SELECT * FROM friendships 
    WHERE status = 'ACCEPTED' 
    AND (
      (requester_id = $1 AND addressee_id = $2) 
      OR (requester_id = $2 AND addressee_id = $1)
    );
  `;
  const result = await pool.query(query, [userId1, userId2]);
  return result.rows.length > 0;
};

// Get list of friends to chat with (Conversations list)
export const getChatContacts = async (userId: string) => {
  const query = `
    SELECT u.id, u.first_name, u.last_name, u.username
    FROM users u
    JOIN friendships f ON (u.id = f.requester_id OR u.id = f.addressee_id)
    WHERE f.status = 'ACCEPTED' 
    AND u.id != $1
    AND (f.requester_id = $1 OR f.addressee_id = $1);
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

// Get paginated messages between two users
export const getMessages = async (userId1: string, userId2: string, limit: number, offset: number) => {
  const query = `
    SELECT * FROM messages
    WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
    ORDER BY created_at DESC
    LIMIT $3 OFFSET $4;
  `;
  const result = await pool.query(query, [userId1, userId2, limit, offset]);
  return result.rows; // Returns newest first
};

// Create a new message
export const createMessage = async (senderId: string, receiverId: string, content: string) => {
  const query = `
    INSERT INTO messages (sender_id, receiver_id, content)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const result = await pool.query(query, [senderId, receiverId, content]);
  return result.rows[0];
};