import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Network from './pages/Network';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Messages from './pages/Messages';
import SearchPage from './pages/SearchPage'; 

/**
 * AppRoutes Component
 * Manages the application's routing logic, implementing navigation guards to secure protected routes.
 * It also handles the conditional rendering of global UI elements like the Navbar.
 */
const AppRoutes = () => {
  // Extract the authentication status from the global context
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      {/* Conditionally render the global Navbar only for authenticated users */}
      {isAuthenticated && <Navbar />}
      
      <Routes>
        {/* --- Public Routes --- */}
        {/* Redirect users to the main feed if they attempt to access auth pages while already logged in */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate transition-style="in:circle:center" to="/feed" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/feed" />} />
        
        {/* --- Protected Routes --- */}
        {/* Require an active session; otherwise, redirect the user back to the login page */}
        <Route path="/feed" element={isAuthenticated ? <Feed /> : <Navigate to="/login" />} />
        <Route path="/network" element={isAuthenticated ? <Network /> : <Navigate to="/login" />} />
        <Route path="/messages" element={isAuthenticated ? <Messages /> : <Navigate to="/login" />} />
        <Route path="/profile/:username" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/search" element={isAuthenticated ? <SearchPage /> : <Navigate to="/login" />} />
        
        {/* --- Fallback/Catch-all Route --- */}
        {/* Intercepts undefined or invalid URLs and redirects based on the user's current authentication state */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/feed" : "/login"} />} />
      </Routes>
    </Router>
  );
};

/**
 * App Component
 * The root component of the React application. 
 * Wraps the routing hierarchy within the AuthProvider to guarantee global access to the authentication state.
 */
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;