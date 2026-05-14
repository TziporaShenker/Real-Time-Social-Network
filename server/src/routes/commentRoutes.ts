import { Router } from "express";
import * as commentController from "../controllers/commentController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

// GET /api/comments/:postId - Get all comments for a specific post
router.get("/:postId", commentController.getCommentsByPost);

// POST /api/comments - Create a new comment
router.post("/", authenticateToken, commentController.createNewComment);

// PUT /api/comments/:id - Update a comment
router.put("/:id", authenticateToken, commentController.updateComment);

// DELETE /api/comments/:id - Delete a comment
router.delete("/:id", authenticateToken, commentController.deleteComment);

export default router;