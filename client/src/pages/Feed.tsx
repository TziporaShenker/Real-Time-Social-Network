import { Container, Box } from "@mui/material";
import Sidebar from "../components/Sidebar";
import CreatePost from "../components/CreatePost";
import PostList from "../components/PostList";

/**
 * Feed Component
 * Serves as the primary layout wrapper for the user's main feed page.
 * Utilizes a responsive Flexbox layout to maintain a side-by-side structure 
 * (Sidebar and Main Feed) on desktop screens, while gracefully stacking elements 
 * vertically on smaller mobile devices.
 */
const Feed = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          // Responsive layout configuration: 
          // Stack elements in a column on extra-small (xs) screens, 
          // and switch to a row-based layout on medium (md) and larger screens.
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 3, 
          alignItems: 'flex-start' 
        }}
      >
        
        {/* --- Left Column: Sidebar --- */}
        {/* 
          Maintains a fixed width on desktop screens and utilizes 'sticky' positioning 
          to remain visible within the viewport as the user scrolls down the main feed.
        */}
        <Box 
          sx={{ 
            // Fix the width to exactly 280px on medium screens and above
            flex: { md: '0 0 280px' }, 
            width: '100%',
            // Apply sticky positioning relative to the header height
            position: { md: 'sticky' },
            top: '80px'
          }}
        >
          <Sidebar />
        </Box>
        
        {/* --- Main Column: Feed Content --- */}
        {/* 
          Flexible container housing the post creation UI and the continuous post stream.
          Designed to dynamically expand and occupy all remaining horizontal space.
        */}
        <Box 
          sx={{ 
            // Ensures this box consumes all available space remaining after the sidebar
            flexGrow: 1, 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <CreatePost />
          <PostList /> 
        </Box>
        
      </Box>
    </Container>
  );
};

export default Feed;