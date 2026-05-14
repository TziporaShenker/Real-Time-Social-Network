import { Router } from 'express';
import * as friendController from '../controllers/friendController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Apply auth middleware to ALL routes in this file automatically
router.use(authenticateToken);

// GET /api/friends/network - Get all network data (Received, Sent, Connections)
router.get("/network", friendController.getNetworkData);

// GET /api/friends/my-friends - Get only accepted friends list
router.get('/my-friends', friendController.listFriends);

// POST /api/friends/request - Send a new friend request
router.post('/request', friendController.requestFriendship);

// PUT /api/friends/accept/:friendId - Accept a pending request
router.put("/accept/:friendId", friendController.acceptRequest);

// DELETE /api/friends/remove/:friendId - Remove connection / Cancel request / Ignore
router.delete("/remove/:friendId", friendController.removeFriend);

// GET /api/friends/status/:profileId - Check relationship status
router.get("/status/:profileId", friendController.getFriendshipStatus);

export default router;