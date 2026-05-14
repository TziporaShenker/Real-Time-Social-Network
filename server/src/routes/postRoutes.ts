import { Router } from 'express';
import * as postController from '../controllers/postController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get("/", authenticateToken, postController.getPosts);
router.post('/', authenticateToken, postController.createNewPost);
router.put("/:id", authenticateToken, postController.updatePost);
router.delete("/:id", authenticateToken, postController.deletePost);

export default router;