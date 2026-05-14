import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userModel from '../models/userModel';
import * as tokenModel from '../models/tokenModel';

/**
 * Handles user registration.
 * Validates the email uniqueness, hashes the password securely, and persists the new user to the database.
 * 
 * @param {Request} req - The Express request object containing user registration details in the body.
 * @param {Response} res - The Express response object.
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, first_name, last_name } = req.body;

    // 1. Verify if a user with the provided email already exists in the database
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // 2. Hash the password using bcrypt to ensure data security
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Persist the new user record to the database
    const newUser = await userModel.createUser({
      username,
      email,
      password_hash: hashedPassword,
      first_name,
      last_name
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * Handles user login.
 * Authenticates credentials, generates JWTs (Access and Refresh), stores the Refresh Token,
 * and configures the secure HttpOnly cookie for session management.
 * 
 * @param {Request} req - The Express request object containing login credentials.
 * @param {Response} res - The Express response object.
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    // 1. Generate a short-lived Access Token (e.g., valid for 15 minutes)
    const accessToken = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '15m' } 
    );

    // 2. Generate a long-lived Refresh Token (e.g., valid for 7 days)
    // Note: Ensure REFRESH_TOKEN_SECRET is defined in the environment variables
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: '7d' }
    );

    // 3. Store the Refresh Token in the database
    // This function inserts a new record into the refresh_tokens table
    await tokenModel.saveRefreshToken(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    // 4. Configure and set the secure HttpOnly cookie for the Refresh Token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // Prevent JavaScript access to mitigate XSS attacks
      secure: process.env.NODE_ENV === 'production', // Restrict to HTTPS in production environments
      sameSite: 'strict', // Prevent Cross-Site Request Forgery (CSRF)
      maxAge: 7 * 24 * 60 * 60 * 1000 // Set cookie expiration matching the token (7 days)
    });

    const { password_hash, ...userWithoutPassword } = user;
    
    // Note: Only the Access Token and user data are returned in the JSON payload; 
    // the Refresh Token is securely handled via cookies.
    res.status(200).json({
      message: 'Login successful',
      accessToken, 
      user: userWithoutPassword
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Handles user logout.
 * Invalidates the current session by deleting the Refresh Token from the database 
 * and clearing the HttpOnly cookie from the client.
 * 
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    // 1. Invalidate the Refresh Token by removing it from the database
    if (refreshToken) {
      await tokenModel.deleteToken(refreshToken);
    }

    // 2. Clear the HttpOnly cookie from the client's browser
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during logout' });
  }
};

/**
 * Handles the issuance of new Access Tokens.
 * Validates the incoming HttpOnly Refresh Token and its database record before 
 * granting a new short-lived Access Token.
 * 
 * @param {Request} req - The Express request object containing the Refresh Token cookie.
 * @param {Response} res - The Express response object.
 */
export const refreshTokenController = async (req: Request, res: Response) => {
  try {
    // Extract the Refresh Token from the incoming secure cookies
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

    // Verify the token's existence and validity in the database (ensure it hasn't been revoked)
    const tokenInDb = await tokenModel.findToken(refreshToken);
    if (!tokenInDb) return res.status(403).json({ message: 'Invalid refresh token' });

    // Cryptographically verify the token's signature and expiration
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string, (err: any, decoded: any) => {
      if (err) return res.status(403).json({ message: 'Token expired or invalid' });

      // Generate and issue a new short-lived Access Token
      const newAccessToken = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET as string,
        { expiresIn: '15m' }
      );

      res.json({ accessToken: newAccessToken });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};