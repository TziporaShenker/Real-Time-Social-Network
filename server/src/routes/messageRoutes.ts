import { Router } from "express";
import { getContacts, getChatHistory, sendMessage } from "../controllers/messageController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.get("/contacts", getContacts);
router.get("/history/:friendId", getChatHistory);
router.post("/send", sendMessage);

export default router;