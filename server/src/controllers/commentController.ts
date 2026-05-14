import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import * as commentModel from "../models/commentModel";
import { io } from "../index"; // Import the Socket.io instance for real-time event broadcasting

/**
 * Retrieves all comments associated with a specific post.
 * 
 * @param {AuthRequest} req - The Express request object, expecting 'postId' in the route parameters.
 * @param {Response} res - The Express response object.
 */
export const getCommentsByPost = async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.postId as string; 
    
    const comments = await commentModel.getCommentsByPostId(postId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};

/**
 * Creates a new comment on a post and broadcasts it in real-time to all connected clients.
 * 
 * @param {AuthRequest} req - The Express request object, containing 'postId' and 'content' in the body, and the authenticated 'userId'.
 * @param {Response} res - The Express response object.
 */
export const createNewComment = async (req: AuthRequest, res: Response) => {
  try {
    const { postId, content } = req.body;
    const authorId = req.userId;

    // Ensure the request is coming from an authenticated user
    if (!authorId) return res.status(401).json({ message: "Unauthorized" });

    const newComment = await commentModel.createComment(postId, authorId, content);
    
    // Real-Time Integration: Broadcast the newly created comment to all connected clients
    // This allows the frontend to instantly append the comment without an additional API fetch
    io.emit("new_comment", newComment);
    
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: "Failed to create comment" });
  }
};

/**
 * Deletes a specific comment and broadcasts the deletion event to keep client UIs synchronized.
 * Enforces authorization to ensure only the comment's author can delete it.
 * 
 * @param {AuthRequest} req - The Express request object, expecting the comment 'id' in the route parameters.
 * @param {Response} res - The Express response object.
 */
export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string; 
    const authorId = req.userId;

    if (!authorId) return res.status(401).json({ message: "Unauthorized" });

    const deletedComment = await commentModel.deleteComment(id, authorId);

    // If no comment is returned, it either doesn't exist or the user lacks permission to delete it
    if (!deletedComment) {
      return res.status(404).json({ message: "Comment not found or unauthorized" });
    }

    // Real-Time Integration: Broadcast the deletion event.
    // The payload includes the post ID so clients can efficiently locate and remove the comment from their local state.
    io.emit("delete_comment", { id, postId: deletedComment.post_id }); 

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

/**
 * Updates the text content of an existing comment and broadcasts the updated data.
 * Enforces authorization to ensure only the comment's author can modify it.
 * 
 * @param {AuthRequest} req - The Express request object, expecting the comment 'id' in parameters and new 'content' in the body.
 * @param {Response} res - The Express response object.
 */
export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string; 
    const { content } = req.body;
    const authorId = req.userId;

    if (!authorId) return res.status(401).json({ message: "Unauthorized" });

    const updatedComment = await commentModel.updateComment(id, authorId, content);

    if (!updatedComment) {
      return res.status(404).json({ message: "Comment not found or unauthorized" });
    }

    // Real-Time Integration: Broadcast the fully updated comment object to all clients
    // This allows the frontend to instantly reflect the edits across all active sessions
    io.emit("update_comment", updatedComment);

    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ message: "Failed to update comment" });
  }
};