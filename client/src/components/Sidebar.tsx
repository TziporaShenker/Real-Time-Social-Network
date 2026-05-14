import { Box, Paper, Typography, Avatar, Divider } from '@mui/material';
import { useAuth } from '../context/AuthContext';

/**
 * Sidebar Component
 * Renders a stylized profile card typically displayed on the side of the main layout.
 * It presents a quick overview of the currently authenticated user's profile, including their avatar, name, and a truncated biography.
 */
const Sidebar = () => {
  // Retrieve the currently authenticated user's data from the global authentication context
  const { user } = useAuth(); 

  return (
    <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}>
      
      {/* --- Decorative Header Background --- */}
      {/* Serves as a colorful banner behind the user's avatar */}
      <Box sx={{ height: 60, bgcolor: 'primary.main', position: 'relative' }} />
      
      {/* --- User Profile Information Section --- */}
      {/* Centers the avatar overlapping the banner and displays core user details */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: -4, pb: 2, px: 2 }}>
        <Avatar 
          sx={{ 
            width: 70, 
            height: 70, 
            border: '2px solid white', 
            mb: 1,
            bgcolor: 'secondary.main',
            fontSize: '1.5rem'
          }}
        >
          {/* Extract and display the user's initial based on their first name, falling back to '?' if undefined */}
          {user?.first_name ? user.first_name[0].toUpperCase() : '?'}
        </Avatar>
        
        <Typography variant="h6" sx={{ fontWeight: "bold", textAlign: 'center' }}>
          {user?.first_name} {user?.last_name}
        </Typography>

        {/* --- User Biography Display Area --- */}
        {/* Renders the bio retrieved from the database, handling empty states gracefully */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            textAlign: 'center', 
            mt: 0.5,
            px: 1,
            // CSS Truncation: Restricts the biography text to a maximum of 2 lines to maintain UI consistency and prevent layout shifting
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {user?.bio || "No bio available"} 
        </Typography>
      </Box>

      <Divider />

      {/* --- Footer Section --- */}
      {/* Reserved spacing block for future statistical displays (e.g., connection count, profile views) or action links */}
      <Box sx={{ p: 2 }}>
      </Box>
    </Paper>
  );
};

export default Sidebar;