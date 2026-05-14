import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import * as messageModel from "../models/messageModel";
import { io } from "../index"; // Import the Socket.IO instance for real-time event broadcasting

/**
 * Retrieves the list of chat contacts for the authenticated user.
 * Contacts are typically users with whom an established connection exists or prior messages were exchanged.
 * 
 * @param {AuthRequest} req - The Express request object, containing the authenticated 'userId'.
 * @param {Response} res - The Express response object.
 */
export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const contacts = await messageModel.getChatContacts(req.userId!);
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: "Failed to load contacts" });
  }
};

/**
 * Retrieves paginated chat history between the authenticated user and a specific connection.
 * Enforces a validation check to ensure the users are actively connected before returning data.
 * 
 * @param {AuthRequest} req - The Express request object, expecting 'friendId' in params and pagination parameters in query.
 * @param {Response} res - The Express response object.
 */
export const getChatHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { friendId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Parse pagination parameters and calculate the database query offset
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Security Validation: Ensure messaging history is only exposed between actively connected friends
    const areFriends = await messageModel.checkFriendship(req.userId!, friendId as string);
    if (!areFriends) return res.status(403).json({ message: "You are not friends with this user." });

    const messages = await messageModel.getMessages(req.userId!, friendId as string, limitNum, offset);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to load messages" });
  }
};

/**
 * Creates a new private message and broadcasts it in real-time via WebSockets.
 * Enforces strict privacy controls by allowing messages only between established friends.
 * 
 * @param {AuthRequest} req - The Express request object, containing 'receiverId' and 'content' in the body.
 * @param {Response} res - The Express response object.
 */
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.userId!;

    // Security Requirement: Messaging is strictly restricted to accepted connections
    const areFriends = await messageModel.checkFriendship(senderId, receiverId);
    if (!areFriends) return res.status(403).json({ message: "You can only message friends." });

    const newMessage = await messageModel.createMessage(senderId, receiverId, content);

    // Real-Time Delivery Requirement:
    // We emit the new message to the receiver's specific private Socket room to notify them instantly.
    // We also emit it back to the sender's private room to ensure multiple active tabs/devices stay synchronized.
    io.to(receiverId).emit("private_message", newMessage);
    io.to(senderId).emit("private_message", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Failed to send message" });
  }
};