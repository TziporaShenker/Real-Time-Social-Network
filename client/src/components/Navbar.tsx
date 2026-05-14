import { useState } from 'react';
import { AppBar, Toolbar, Container, InputBase, Box, IconButton, Menu, MenuItem } from '@mui/material';
import { Search, Home, People, Message, Notifications, AccountCircle } from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Styled wrapper for the search input area.
 * Customizes the background color, border radius, and dimensions.
 */
const SearchBox = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha('#eef3f8', 1),
  marginRight: theme.spacing(2),
  width: '280px',
}));

/**
 * Navbar Component
 * Renders the top application navigation bar, providing access to primary routes,
 * search functionality, and user profile actions.
 */
const Navbar = () => {
  const navigate = useNavigate();
  
  // Retrieve the current authenticated user and the logout function from context
  const { user, logout } = useAuth();
  
  // State management for the search input field
  const [searchQuery, setSearchQuery] = useState("");
  
  // State management for the profile dropdown menu anchor element
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  /**
   * Opens the profile dropdown menu by setting its anchor element.
   * @param {React.MouseEvent<HTMLElement>} event - The click event triggered by the user.
   */
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  /**
   * Closes the profile dropdown menu.
   */
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  /**
   * Handles user logout by closing the menu, invoking the logout context method,
   * and redirecting the user to the login screen.
   */
  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  /**
   * Navigates the user to their specific profile page based on their username.
   * Redirects to the login page if the user data is unavailable.
   */
  const handleProfileClick = () => {
    handleMenuClose();
    if (user?.username) {
      navigate(`/profile/${user.username}`); 
    } else {
      navigate('/login');
    }
  };

  /**
   * Listens for the 'Enter' key press within the search input.
   * Triggers navigation to the search results page with the encoded query.
   * 
   * @param {React.KeyboardEvent} e - The keyboard event.
   */
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Navigate to the SearchPage appending the query parameter 'q'
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      
      // Clear the search input field after submission
      setSearchQuery(""); 
    }
  };

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: 'white' }}>
      <Container maxWidth="lg">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          
          {/* Left Section: Brand Logo and Search Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ bgcolor: '#0a66c2', color: 'white', p: 0.5, borderRadius: 1, fontWeight: 'bold', mr: 1, cursor: 'pointer' }} 
              onClick={() => navigate('/feed')}
            >
              in
            </Box>
            <SearchBox>
              <Box sx={{ p: '0 10px', height: '100%', position: 'absolute', display: 'flex', alignItems: 'center' }}>
                <Search fontSize="small" sx={{ color: '#666' }} />
              </Box>
              <InputBase 
                placeholder="Search by name..." 
                sx={{ pl: 5, width: '100%', fontSize: '14px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyPress} 
              />
            </SearchBox>
          </Box>

          {/* Right Section: Navigation Icons and Profile Menu */}
          <Box sx={{ display: 'flex', gap: 2 }}>
             <IconButton color="inherit" onClick={() => navigate('/feed')}><Home /></IconButton>
             <IconButton color="inherit" onClick={() => navigate('/network')}><People /></IconButton>
             <IconButton color="inherit" onClick={() => navigate('/messages')}><Message /></IconButton>
             <IconButton color="inherit"><Notifications /></IconButton>
             
             <IconButton color="inherit" onClick={handleMenuOpen}>
               <AccountCircle />
             </IconButton>
          </Box>

          {/* Profile Dropdown Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleProfileClick}>View Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Sign Out</MenuItem>
          </Menu>

        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;