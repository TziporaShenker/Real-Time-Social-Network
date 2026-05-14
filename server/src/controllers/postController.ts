import { Response } from "express";
import { AuthRequest } from '../middlewares/authMiddleware';
import * as postModel from '../models/postModel';
import { io } from "../index"; // Import the Socket.io instance for real-time event broadcasting

/**
 * Retrieves a paginated list of posts.
 * Operates in two modes: 
 * 1. If an 'author_id' is provided in the query, it fetches that specific user's posts.
 * 2. Otherwise, it retrieves the personalized timeline feed for the authenticated user.
 * 
 * @param {AuthRequest} req - The Express request object, containing query parameters and the authenticated 'userId'.
 * @param {Response} res - The Express response object.
 */
export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { author_id, page = 1, limit = 10 } = req.query; 
    const loggedInUserId = req.userId;
    
    // Pagination calculation: Determine the offset based on the requested page and limit
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let posts;
    if (author_id) {
      // Fetch public/visible posts for a specific profile
      posts = await postModel.getPostsByUserId(author_id as string, limitNum, offset);
    } else {
      // Ensure the user is authenticated before serving a personalized feed
      if (!loggedInUserId) return res.status(401).json({ message: "Login required" });
      posts = await postModel.getPersonalizedFeed(loggedInUserId, limitNum, offset);
    }
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
};

/**
 * Updates the text content and visibility settings of an existing post.
 * Enforces authorization to ensure only the original author can modify the post.
 * 
 * @param {AuthRequest} req - The Express request object, expecting the post 'id' in parameters and updated fields in the body.
 * @param {Response} res - The Express response object.
 */
export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    // Extract both content and visibility settings from the incoming request body
    const { content, visibility } = req.body; 
    const userId = req.userId as string;

    const updated = await postModel.updatePost(id, userId, content, visibility);
    
    // If no post is returned, it either does not exist or the user lacks modification privileges
    if (!updated) return res.status(404).json({ message: "Post not found or unauthorized" });
    
    // Real-Time Integration: Broadcast the fully updated post object to all connected clients.
    // This allows active sessions to reflect the edits instantly without requiring a page refresh.
    io.emit("update_post", updated);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

/**
 * Deletes a specific post and broadcasts the deletion event to keep client UIs synchronized.
 * Enforces authorization to ensure only the original author can delete their post.
 * 
 * @param {AuthRequest} req - The Express request object, expecting the post 'id' in the route parameters.
 * @param {Response} res - The Express response object.
 */
export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId as string;
    const deleted = await postModel.deletePost(id as string, userId);
    
    if (!deleted) return res.status(404).json({ message: "Unauthorized" });
    
    // Real-Time Integration: Notify all connected clients of the deletion event.
    // The payload contains the post ID, allowing clients to efficiently filter it out of their local state.
    io.emit("delete_post", { id });

    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};

/**
 * Creates a new post and broadcasts it in real-time to all connected clients.
 * Applies default visibility settings if none are explicitly provided by the user.
 * 
 * @param {AuthRequest} req - The Express request object, containing 'content' and 'visibility' in the body.
 * @param {Response} res - The Express response object.
 */
export const createNewPost = async (req: AuthRequest, res: Response) => {
  try {
    const { content, visibility } = req.body;
    const authorId = req.userId;

    // Ensure the request is originating from an authenticated user session
    if (!authorId) return res.status(401).json({ message: 'Unauthorized' });

    const newPost = await postModel.createPost({
      author_id: authorId ,
      content,
      visibility: visibility || 'PUBLIC' // Fallback to 'PUBLIC' if visibility is omitted
    });

    // Real-Time Integration: Broadcast the newly created post across the network.
    // Connected clients listening to this event will instantly prepend the post to their feeds.
    io.emit("new_post", newPost);

    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create post' });
  }
};