import { Router } from 'express';
import { suggestComment } from '../controllers/aiController';
// אם יש לך middleware של אימות (auth), שווה לייבא אותו פה כדי להגן על הראוט
// import { authenticateToken } from '../middlewares/authMiddleware'; 

const router = Router();

// במידה ויש אימות, כדאי להוסיף אותו כאן כאמצעי הגנה
router.post('/suggest-comment', suggestComment);

export default router;