import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { setAccessToken } from '../api/axiosConfig'; // Import the configured Axios instance and the token setter function

/**
 * Interface representing the structure of a User object.
 * Updated to include the optional biography field.
 */
interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio?: string; // Optional field for the user's biography
}

/**
 * Interface detailing the properties and methods provided by the Authentication Context.
 */
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  /** Loading state to prevent premature redirection to the login page before the refresh token validation is complete */
  isLoading: boolean; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 * Wraps the application to provide global access to authentication state and actions.
 * Handles the initial session restoration via silent token refreshing.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  
  // Initially set to true to block rendering until the auth check resolves
  const [isLoading, setIsLoading] = useState(true); 

  /**
   * Helper function to securely update the access token in both React state 
   * and the Axios in-memory configuration.
   * 
   * @param {string | null} newToken - The new JWT access token or null to clear it.
   */
  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    setAccessToken(newToken);
  };

  /**
   * Initial Authentication Verification
   * Runs once upon application initialization (e.g., page refresh) to attempt a silent re-authentication.
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Attempt to fetch a new access token. The browser automatically attaches the HttpOnly refresh token cookie if it exists.
        const res = await api.get('/auth/refresh');
        setToken(res.data.accessToken);
        
        // Optional future implementation: Fetch fresh user details directly from the server
        // Example: const userRes = await api.get('/users/me'); setUser(userRes.data);
        
        // For now, retrieve the non-sensitive user profile data from localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUser(JSON.parse(savedUser));

      } catch (error) {
        // If the request fails, it indicates that the refresh token is missing, invalid, or expired. The user remains unauthenticated.
        console.log("No valid session found");
      } finally {
        setIsLoading(false); // Flag the authentication check process as complete
      }
    };

    checkAuth();
  }, []);

  /**
   * Establishes a user session upon successful login.
   * 
   * @param {string} newAccessToken - The JWT access token provided by the server.
   * @param {User} newUser - The user profile data.
   */
  const login = (newAccessToken: string, newUser: User) => {
    setTokenState(newAccessToken); // Updates the local React state
    setAccessToken(newAccessToken); // Updates the in-memory variable utilized by Axios interceptors
    setUser(newUser);
    
    // Persists non-sensitive user data locally. Crucially, the access token is NEVER stored in localStorage for security reasons.
    localStorage.setItem('user', JSON.stringify(newUser)); 
  };

  /**
   * Terminates the current user session and clears all associated data.
   */
  const logout = async () => {
    try {
      // Transmit a logout request to the server to invalidate the session and clear the HttpOnly cookies
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Failed to logout from server", error);
    } finally {
      // Ensure local state and storage are rigorously cleared regardless of the server response
      setTokenState(null);
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  // Suspend application rendering until the initial authentication verification concludes
  if (isLoading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to consume the authentication context.
 * Must be used within a component wrapped by the AuthProvider.
 * 
 * @returns {AuthContextType} The authentication context values and methods.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};