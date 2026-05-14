import { Router } from 'express';
import { updateUserProfile,getUserByUsername,searchUsers } from '../controllers/userController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router: Router = Router();

router.put('/:id', authenticateToken, updateUserProfile);
router.get("/username/:username", getUserByUsername);
router.get('/search', authenticateToken, searchUsers);

export default router;