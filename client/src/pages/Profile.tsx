import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Container, Paper, Avatar, Typography, Box, 
  Button, CircularProgress, Divider 
} from "@mui/material";
import { 
  PersonAdd, Check, Message, PersonRemove, Close 
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import api from "../api/axiosConfig";
import PostList from "../components/PostList"; 

/**
 * Interface representing the expected structure of a user's profile data.
 */
interface UserProfile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  bio?: string;
}

/**
 * Defines the mutually exclusive states of connection between the authenticated user 
 * and the profile currently being viewed.
 */
type FriendStatus = 
  | 'NONE' 
  | 'ACCEPTED' 
  | 'PENDING_SENT' 
  | 'PENDING_RECEIVED' 
  | 'SELF' 
  | 'LOADING';

/**
 * Profile Component
 * Renders a user's public profile page, displaying their personal information, 
 * network relationship status, and a filtered feed of their recent activity.
 */
const Profile = () => {
  // Extract the dynamic 'username' parameter from the current route URL (e.g., /profile/johndoe)
  const { username } = useParams<{ username: string }>(); 
  
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // State management for profile data and relationship status
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('LOADING');
  const [loading, setLoading] = useState(true);

  /**
   * Initializes the profile view by fetching the target user's details and 
   * determining their connection status with the current user.
   * Triggered on mount and whenever the URL parameter or authenticated user changes.
   */
  useEffect(() => {
    const fetchProfileAndStatus = async () => {
      try {
        setLoading(true);
        
        // 1. Retrieve the public profile details using the username extracted from the route
        const userRes = await api.get(`/users/username/${username}`);
        const fetchedUser = userRes.data;
        setProfileData(fetchedUser);

        // 2. Conditionally evaluate the network relationship status if the viewer is authenticated and the profile exists
        if (currentUser && fetchedUser) {
          const statusRes = await api.get(`/friends/status/${fetchedUser.id}`);
          setFriendStatus(statusRes.data.status);
        }

      } catch (err) {
        console.error("Failed to fetch profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfileAndStatus();
    }
  }, [username, currentUser]);

  // --- Network Action Handlers ---

  /**
   * Dispatches a new connection request to the viewed profile.
   */
  const handleSendRequest = async () => {
    if (!profileData) return;
    try {
      await api.post("/friends/request", { friendId: profileData.id });
      setFriendStatus('PENDING_SENT');
    } catch (err) {
      console.error("Failed to send friend request", err);
    }
  };

  /**
   * Accepts an incoming connection request originating from this profile.
   */
  const handleAcceptRequest = async () => {
    if (!profileData) return;
    try {
      await api.put(`/friends/accept/${profileData.id}`);
      setFriendStatus('ACCEPTED');
    } catch (err) {
      console.error("Failed to accept request", err);
    }
  };

  /**
   * Handles multiple network detachment actions: 
   * Canceling a sent request, ignoring a received request, or removing an established connection.
   */
  const handleRemoveOrCancel = async () => {
    if (!profileData) return;
    
    // Prompt for explicit user confirmation before severing an active connection
    if (friendStatus === 'ACCEPTED' && !window.confirm("Are you sure you want to remove this connection?")) {
      return;
    }

    try {
      // A unified API endpoint handles the deletion of the relationship edge, regardless of its current state
      await api.delete(`/friends/remove/${profileData.id}`);
      setFriendStatus('NONE');
    } catch (err) {
      console.error("Failed to update connection status", err);
    }
  };

  /**
   * Navigates the user to the direct messaging interface.
   */
  const handleMessage = () => {
    if (!profileData) return;
    navigate(`/messages`);
  };

  // --- UI Rendering States ---

  // Display a full-screen spinner while data is being fetched
  if (loading) {
    return (
      <Box sx={{ mt: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Display a fallback message if the requested user does not exist in the database
  if (!profileData) {
    return (
      <Typography sx={{ mt: 10, textAlign: 'center' }} variant="h5" color="text.secondary">
        User not found
      </Typography>
    );
  }

  /**
   * Dynamically resolves and renders the appropriate network action buttons 
   * corresponding to the current relationship status between the viewer and the profile owner.
   */
  const renderActionButtons = () => {
    switch (friendStatus) {
      case 'SELF':
        return (
          <Button variant="outlined" onClick={() => navigate('/settings')}>
            Edit Profile
          </Button>
        );
      
      case 'NONE':
        return (
          <Button variant="contained" startIcon={<PersonAdd />} onClick={handleSendRequest}>
            Connect
          </Button>
        );
      
      case 'PENDING_SENT':
        return (
          <Button variant="outlined" color="inherit" startIcon={<Check />} onClick={handleRemoveOrCancel}>
            Request Sent (Cancel)
          </Button>
        );
      
      case 'PENDING_RECEIVED':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" color="primary" onClick={handleAcceptRequest}>
              Accept
            </Button>
            <Button variant="outlined" color="error" onClick={handleRemoveOrCancel}>
              Ignore
            </Button>
          </Box>
        );
      
      case 'ACCEPTED':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" color="primary" startIcon={<Message />} onClick={handleMessage}>
              Message
            </Button>
            <Button variant="outlined" color="error" startIcon={<PersonRemove />} onClick={handleRemoveOrCancel}>
              Remove
            </Button>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      
      {/* --- Profile Header Section --- */}
      <Paper elevation={2} sx={{ p: 4, borderRadius: 3, mb: 4, textAlign: 'center' }}>
        <Avatar 
          sx={{ 
            width: 120, 
            height: 120, 
            mx: 'auto', 
            mb: 2, 
            bgcolor: 'primary.main', 
            fontSize: '3rem' 
          }}
        >
          {profileData.first_name[0].toUpperCase()}
        </Avatar>
        
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {profileData.first_name} {profileData.last_name}
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
          @{profileData.username}
        </Typography>
        
        {profileData.bio && (
          <Typography variant="body1" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
            {profileData.bio}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          {renderActionButtons()}
        </Box>
      </Paper>

      {/* --- User's Activity Feed --- */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        {profileData.first_name}'s Activity
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {/* Restricts the rendered post feed exclusively to content authored by this specific user */}
      <PostList userId={profileData.id} />

    </Container>
  );
};

export default Profile;