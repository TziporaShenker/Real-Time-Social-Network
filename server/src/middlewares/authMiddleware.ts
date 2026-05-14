import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Custom interface extending the standard Express Request object.
 * This allows the middleware to inject the authenticated user's ID into the request,
 * making it accessible to subsequent controllers.
 */
export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Authentication Middleware
 * Intercepts incoming requests to verify the presence and validity of a JWT Access Token.
 * If valid, it extracts the user ID and attaches it to the request object.
 * 
 * @param {AuthRequest} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware or controller in the pipeline.
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Debug log: Verifying that the middleware is successfully intercepted by the router
  console.log("Auth Middleware triggered"); 

  // Extract the token from the Authorization header (Expected format: "Bearer <TOKEN>")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Return a 401 Unauthorized error if no token is found in the header
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    /**
     * Verify the cryptographic signature of the token using the environment's secret key.
     * The token payload is expected to contain the unique 'userId'.
     */
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    
    // Inject the decoded userId into the request object for use by protected controllers
    req.userId = decoded.userId;
    
    // Authorization successful: Proceed to the next step in the route handler
    next();
  } catch (error) {
    // Return a 401 error if the token has been tampered with or has expired
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};