import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Typography, Card, Avatar, Button, Box, CircularProgress, List, ListItem, Divider } from '@mui/material';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

/**
 * Interface representing the structure of a user object returned by the search API.
 */
interface UserResult {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  bio: string;
}

/**
 * SearchPage Component
 * Extracts the search query from the URL parameters, requests matching users from the backend,
 * and renders a visually structured list of search results.
 */
const SearchPage = () => {
  // Hook to access and parse URL query string parameters
  const [searchParams] = useSearchParams();
  
  // Extract the specific 'q' parameter which holds the user's search term
  const query = searchParams.get('q'); 
  
  // State management for the fetched search results and UI loading indicator
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  /**
   * Data Fetching Effect
   * Triggers an API call to the search endpoint whenever the URL 'query' parameter changes.
   */
  useEffect(() => {
    const fetchResults = async () => {
      // Abort the fetch if the query string is empty or undefined
      if (!query) return;
      
      setLoading(true);
      try {
        // Transmit the GET request to the backend search endpoint, passing the encoded query
        const response = await api.get(`/users/search?query=${query}`);
        setResults(response.data);
      } catch (err) {
        console.error("Search failed", err);
        // Ensure the results state is cleared if an error occurs to prevent displaying stale data
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      
      {/* Dynamic Header displaying the active search term and the total number of hits */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        {results.length} results for: "{query}"
      </Typography>

      {/* Conditionally render a full-width spinner while the network request is pending */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card sx={{ borderRadius: 2, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }}>
          <List disablePadding>
            
            {/* Determine UI state based on whether results were found */}
            {results.length > 0 ? (
              // Iterate over the results array to render individual list items
              results.map((person, index) => (
                <React.Fragment key={person.id}>
                  <ListItem 
                    sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    
                    {/* Left Section: Avatar and User Details (Clickable) */}
                    <Box 
                      sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexGrow: 1 }} 
                      onClick={() => navigate(`/profile/${person.username}`)}
                    >
                      <Avatar sx={{ width: 56, height: 56, mr: 2, bgcolor: '#0a66c2', fontSize: '20px' }}>
                        {person.first_name ? person.first_name[0].toUpperCase() : '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {person.first_name} {person.last_name}
                        </Typography>
                        
                        {/* Bio Truncation: Ensures long bios don't break the layout by using 'noWrap' and a 'maxWidth' */}
                        <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: '350px' }}>
                          {person.bio || "No professional summary provided"}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Right Section: Explicit Call-to-Action button for viewing the profile */}
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      sx={{ borderRadius: 5, textTransform: 'none', fontWeight: 600, ml: 2 }}
                      onClick={() => navigate(`/profile/${person.username}`)}
                    >
                      View Profile
                    </Button>
                  </ListItem>
                  
                  {/* Append a divider beneath all items except the final one in the list */}
                  {index < results.length - 1 && <Divider />}
                </React.Fragment>
              ))
            ) : (
              // Fallback UI (Empty State) rendered when the search yields no matches
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No matches found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Try searching for a different name or checking your spelling.
                </Typography>
              </Box>
            )}
            
          </List>
        </Card>
      )}
    </Container>
  );
};

export default SearchPage;