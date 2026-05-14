import axios from 'axios';

/**
 * Axios instance configuration for API requests.
 */
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  // Crucial: Enables the browser to send the Refresh Token cookie automatically
  withCredentials: true,
});

/**
 * In-memory variable to store the Access Token.
 * Storing it here instead of localStorage enhances security against XSS attacks.
 */
let accessToken: string | null = null;

/**
 * Updates the in-memory Access Token.
 * Typically called by the AuthContext after login or token refresh.
 * 
 * @param token - The new JWT access token or null to clear it.
 */
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

/**
 * Request Interceptor:
 * Automatically attaches the Access Token to the Authorization header of every outgoing request.
 */
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/**
 * Response Interceptor:
 * Core logic for handling token expiration (401 Unauthorized) and silent token refreshing.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    /**
     * Condition logic to trigger silent refresh:
     * 1. Response status must be 401 (Unauthorized).
     * 2. The request must not have been retried already (prevents infinite loops).
     * 3. The request must not be directed at the auth endpoints itself.
     */
    if (
      error.response && 
      error.response.status === 401 && 
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh' &&
      originalRequest.url !== '/auth/login'
    ) {
      originalRequest._retry = true; 

      try {
        // Attempt to fetch a new Access Token using the Refresh Token stored in a HttpOnly cookie
        const response = await axios.get('http://localhost:5000/api/auth/refresh', {
          withCredentials: true 
        });

        const newAccessToken = response.data.accessToken;
        
        // Update the in-memory state and the header for the failed request
        setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry the original request with the new token
        return api(originalRequest);

      } catch (refreshError) {
        // If the Refresh Token is invalid or expired, clear the state and redirect to login
        setAccessToken(null);
        
        const currentPath = window.location.pathname;
        // Redirect only if the user is not already on an authentication page
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;