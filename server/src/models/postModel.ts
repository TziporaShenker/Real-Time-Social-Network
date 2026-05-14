import pool from "../config/db";

export interface Post {
  id?: string;
  author_id: string;
  content: string;
  visibility: "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";
  created_at?: Date;
  updated_at?: Date;
}

export const createPost = async (post: Post) => {
  const query = `
    WITH inserted_post AS (
      INSERT INTO posts (author_id, content, visibility)
      VALUES ($1, $2, $3)
      RETURNING *
    )
    SELECT 
      p.*,
      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'username', u.username
      ) AS author
    FROM inserted_post p
    JOIN users u ON p.author_id = u.id;
  `;
  
  const values = [post.author_id, post.content, post.visibility];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Update content of a post
export const updatePost = async (postId: string, userId: string, content: string, visibility: string) => {
  const query = `
    UPDATE posts 
    SET content = $1, visibility = $2, updated_at = NOW()
    WHERE id = $3 AND author_id = $4
    RETURNING *;
  `;
  const result = await pool.query(query, [content, visibility, postId, userId]);
  return result.rows[0];
};

// Delete a post
export const deletePost = async (postId: string, userId: string) => {
  const query = `DELETE FROM posts WHERE id = $1 AND author_id = $2 RETURNING *;`;
  const result = await pool.query(query, [postId, userId]);
  return result.rows[0];
};

// Updated: Added LIMIT and OFFSET for Pagination
export const getPostsByUserId = async (userId: string, limit: number, offset: number) => {
  const query = `
    SELECT p.id, p.content, p.created_at, p.visibility, p.author_id,
    json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name, 'username', u.username) AS author
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.author_id = $1
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const result = await pool.query(query, [userId, limit, offset]);
  return result.rows;
};

// Updated: Personalized Feed with Pagination
export const getPersonalizedFeed = async (userId: string, limit: number, offset: number) => {
  const query = `
    SELECT p.id, p.content, p.created_at, p.visibility, p.author_id,
           json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name, 'username', u.username) AS author
    FROM posts p
    JOIN users u ON p.author_id = u.id
    LEFT JOIN friendships f ON (
        (f.requester_id = $1 AND f.addressee_id = p.author_id) OR
        (f.requester_id = p.author_id AND f.addressee_id = $1)
    )
    WHERE p.visibility = 'PUBLIC' 
       OR p.author_id = $1 
       OR (p.visibility = 'FRIENDS_ONLY' AND f.status = 'ACCEPTED')
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const result = await pool.query(query, [userId, limit, offset]);
  return result.rows;
};