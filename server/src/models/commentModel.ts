import pool from "../config/db";

// Fetch comments with author details
export const getCommentsByPostId = async (postId: string) => {
  const query = `
    SELECT 
      c.id, 
      c.content, 
      c.created_at,  -- Added timestamp
      c.author_id,
      json_build_object(
        'first_name', u.first_name,
        'last_name', u.last_name,
        'username', u.username  -- Added username for navigation
      ) AS author
    FROM comments c
    JOIN users u ON c.author_id = u.id
    WHERE c.post_id = $1
    ORDER BY c.created_at ASC;
  `;
  
  const result = await pool.query(query, [postId]);
  return result.rows;
};

// Create a comment
export const createComment = async (postId: string, authorId: string, content: string) => {
  const query = `
    WITH inserted_comment AS (
      INSERT INTO comments (post_id, author_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    )
    SELECT 
      c.*,
      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'username', u.username
      ) AS author
    FROM inserted_comment c
    JOIN users u ON c.author_id = u.id;
  `;
  
  const result = await pool.query(query, [postId, authorId, content]);
  return result.rows[0];
};
// Delete a comment
export const deleteComment = async (commentId: string, userId: string) => {
  const query = `DELETE FROM comments WHERE id = $1 AND author_id = $2 RETURNING *;`;
  const result = await pool.query(query, [commentId, userId]);
  return result.rows[0];
};
export const updateComment = async (commentId: string, authorId: string, content: string) => {
  const query = `
    UPDATE comments 
    SET content = $1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $2 AND author_id = $3 
    RETURNING *;
  `;
  const result = await pool.query(query, [content, commentId, authorId]);
  return result.rows[0];
};

