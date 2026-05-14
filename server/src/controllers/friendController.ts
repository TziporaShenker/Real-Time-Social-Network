import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as friendModel from '../models/friendModel';

/**
 * Initiates a new friend request from the authenticated user to a target user.
 * Includes validation to prevent a user from sending a request to themselves.
 * 
 * @param {AuthRequest} req - The Express request object, containing 'friendId' in the body.
 * @param {Response} res - The Express response object.
 */
export const requestFriendship = async (req: AuthRequest, res: Response) => {
  try {
    const { friendId } = req.body;
    const userId = req.userId;

    if (userId === friendId) {
      return res.status(400).json({ message: "You cannot friend yourself" });
    }

    const request = await friendModel.sendFriendRequest(userId!, friendId);
    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send friend request" });
  }
};

/**
 * Retrieves the list of accepted friends for the authenticated user.
 * 
 * @param {AuthRequest} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
export const listFriends = async (req: AuthRequest, res: Response) => {
  try {
    const friends = await friendModel.getFriendsList(req.userId!);
    res.status(200).json(friends);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch friends" });
  }
};

/**
 * Aggregates all network-related data for the user's Network page.
 * Concurrently fetches received requests, sent requests, and established connections to optimize performance.
 * 
 * @param {AuthRequest} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
export const getNetworkData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string;

    // Concurrently fetch all 3 lists to minimize network latency and improve response time
    const [received, sent, connections] = await Promise.all([
      friendModel.getReceivedRequests(userId),
      friendModel.getSentRequests(userId),
      friendModel.getFriendsList(userId)
    ]);

    res.status(200).json({ received, sent, connections });
  } catch (error) {
    console.error("Error fetching network data:", error);
    res.status(500).json({ message: "Failed to fetch network data" });
  }
};

/**
 * Accepts a pending friend request.
 * Utilizes route parameters to adhere strictly to RESTful API design standards.
 * 
 * @param {AuthRequest} req - The Express request object, expecting 'friendId' in the route parameters.
 * @param {Response} res - The Express response object.
 */
export const acceptRequest = async (req: AuthRequest, res: Response) => {
  try {
    // Extracted from URL parameters instead of body (e.g., PUT /api/friends/accept/:friendId)
    const { friendId } = req.params; 
    const userId = req.userId; 

    const updated = await friendModel.acceptFriendRequest(friendId as string, userId!);
    
    if (!updated) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    res.status(200).json({ message: "Friendship accepted", data: updated });
  } catch (error) {
    console.error("Error accepting request:", error);
    res.status(500).json({ message: "Failed to accept request" });
  }
};

/**
 * Rejects an incoming request, cancels a sent request, or removes an established friendship.
 * Serves as a unified endpoint for all connection-severing actions.
 * 
 * @param {AuthRequest} req - The Express request object, expecting 'friendId' in the route parameters.
 * @param {Response} res - The Express response object.
 */
export const removeFriend = async (req: AuthRequest, res: Response) => {
  try {
    const { friendId } = req.params;    
    const userId = req.userId;
    
    const deleted = await friendModel.deleteFriendship(userId!, friendId as string);
    
    if (!deleted) {
      return res.status(404).json({ message: "Friendship not found" });
    }

    res.status(200).json({ message: "Friendship removed" });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({ message: "Failed to remove friend" });
  }
};

/**
 * Determines the precise relationship status between the authenticated user and a specific profile.
 * Crucial for rendering the correct interactive buttons on the frontend (e.g., Connect, Accept, Message).
 * 
 * @param {AuthRequest} req - The Express request object, expecting 'profileId' in the route parameters.
 * @param {Response} res - The Express response object.
 */
export const getFriendshipStatus = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId as string;
    const profileId = req.params.profileId; 

    // Return early if the user is viewing their own profile
    if (String(currentUserId) === String(profileId)) {
      return res.json({ status: 'SELF' });
    }

    const friendship = await friendModel.checkFriendshipStatus(currentUserId, profileId as string);

    // If no relationship edge exists between the two users
    if (!friendship) {
      return res.json({ status: 'NONE' });
    }

    // If they are actively connected
    if (friendship.status === 'ACCEPTED') {
      return res.json({ status: 'ACCEPTED' });
    }

    // If the request is pending, directional context is required to display the correct UI state
    if (friendship.status === 'PENDING') {
      // Convert both IDs to strings to prevent strict-equality bugs caused by implicit type mismatches in JS/TS
      const requesterId = String(friendship.requester_id);
      const currentId = String(currentUserId);

      if (requesterId === currentId) {
        // The current user initiated the request -> Client should display "Request Sent (Cancel)"
        return res.json({ status: 'PENDING_SENT' });
      } else {
        // The current user is the recipient -> Client should display "Accept / Ignore"
        return res.json({ status: 'PENDING_RECEIVED' });
      }
    }

  } catch (error) {
    console.error("Error checking friendship status:", error);
    res.status(500).json({ message: "Failed to check status" });
  }
};