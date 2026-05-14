import { Request, Response } from 'express'; 
import * as userModel from '../models/userModel';

/**
 * Interface extending the standard Express Request to include authentication and specific parameter types.
 */
interface AuthRequest extends Request {
  // The field populated by the JWT authentication middleware
  userId?: string; 
  params: {
    id: string;
  };
}

/**
 * Updates a user's public profile information (first name, last name, and bio).
 * Enforces strict authorization to ensure users can only modify their own profiles.
 * 
 * @param {AuthRequest} req - The Express request object containing the user 'id' in parameters and update fields in the body.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} The updated user profile or an error payload.
 */
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { first_name, last_name, bio } = req.body;
  
  console.log("I am in the update route");

  // Basic runtime type validation to ensure the ID is present and correctly formatted
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  // Security check: Ensure the authenticated user ID (from the token) matches the requested profile ID
  if (req.userId !== id) {
    return res.status(403).json({ message: "Unauthorized: You can only edit your own profile" });
  }

  try {
    const updatedUser = await userModel.updateUser(id, { first_name, last_name, bio });
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(updatedUser);
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
  
};

/**
 * Define an interface for the expected URL parameters to provide strict typing for the Request object.
 */
interface UserParams {
  username: string;
}

/**
 * Retrieves a user's public profile data based on their unique username.
 * Used for viewing public profiles (e.g., navigating to /profile/johndoe).
 * 
 * @param {Request<UserParams>} req - The Express request object, strictly typed to expect a 'username' parameter.
 * @param {Response} res - The Express response object.
 */
export const getUserByUsername = async (req: Request<UserParams>, res: Response) => {
  try {
    // Extract the username from the strictly typed parameters
    const { username } = req.params; 
    
    const user = await userModel.findUserByUsername(username);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Searches the user database for profiles matching a specific query string.
 * Used by the global search bar to find connections.
 * 
 * @param {Request} req - The Express request object, expecting a 'query' string parameter.
 * @param {Response} res - The Express response object.
 */
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    // Validate that the search query exists and is a valid string before hitting the database
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await userModel.searchUsersInDB(query);
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsers:", error);
    res.status(500).json({ message: "Server error during search" });
  }
};