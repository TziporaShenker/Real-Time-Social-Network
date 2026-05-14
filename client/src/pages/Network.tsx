import { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  TextField,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

/**
 * Interface representing a user within the network context.
 * Used for connections, sent requests, and received requests.
 */
interface NetworkUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  bio?: string;
}

/**
 * Network Component
 * Manages and displays the user's professional network, including active connections,
 * pending received invitations, and sent invitations. Includes local search filtering.
 */
const Network = () => {
  const navigate = useNavigate();

  // State management for the different network categories
  const [receivedRequests, setReceivedRequests] = useState<NetworkUser[]>([]);
  const [sentRequests, setSentRequests] = useState<NetworkUser[]>([]);
  const [connections, setConnections] = useState<NetworkUser[]>([]);
  
  // State for global loading indicator and local search input
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Initial Data Fetching
   * Retrieves the user's complete network status (connections, sent, and received requests) upon component mount.
   */
  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/friends/network");
        setReceivedRequests(response.data.received);
        setSentRequests(response.data.sent);
        setConnections(response.data.connections);
      } catch (err) {
        console.error("Failed to fetch network data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNetworkData();
  }, []);

  /**
   * Navigates the user to a specific profile page.
   * 
   * @param {string} username - The target user's unique username.
   */
  const handleProfileClick = (username: string) => {
    navigate(`/profile/${username}`);
  };

  // --- Action Handlers ---

  /**
   * Accepts an incoming friend/connection request.
   * Utilizes optimistic UI updating to provide an immediate response to the user
   * without waiting for the server's confirmation.
   * 
   * @param {string} targetId - The ID of the user whose request is being accepted.
   */
  const handleAcceptRequest = async (targetId: string) => {
    try {
      await api.put(`/friends/accept/${targetId}`);
      
      // Optimistic UI update: Find the user in the received requests, remove them from there,
      // and append them directly to the active connections list.
      const userToMove = receivedRequests.find((req) => req.id === targetId);
      if (userToMove) {
        setReceivedRequests((prev) =>
          prev.filter((req) => req.id !== targetId),
        );
        setConnections((prev) => [...prev, userToMove]);
      }
    } catch (err) {
      console.error("Failed to accept request", err);
    }
  };

  /**
   * A multi-purpose handler for rejecting incoming requests, canceling sent requests, 
   * or removing established connections.
   * 
   * @param {string} targetId - The ID of the target user.
   * @param {"received" | "sent" | "connection"} listType - Indicates which list the user currently resides in.
   */
  const handleRemoveOrCancel = async (
    targetId: string,
    listType: "received" | "sent" | "connection",
  ) => {
    // Require explicit confirmation only when severing an established connection
    if (
      listType === "connection" &&
      !window.confirm("Are you sure you want to remove this connection?")
    )
      return;

    try {
      // Execute the deletion request against the API
      await api.delete(`/friends/remove/${targetId}`);

      // Update the local state UI based on the specific list the action originated from
      if (listType === "received")
        setReceivedRequests((prev) =>
          prev.filter((req) => req.id !== targetId),
        );
      if (listType === "sent")
        setSentRequests((prev) => prev.filter((req) => req.id !== targetId));
      if (listType === "connection")
        setConnections((prev) => prev.filter((req) => req.id !== targetId));
    } catch (err) {
      console.error("Failed to remove/cancel", err);
    }
  };

  /**
   * Navigates the user to the direct messaging interface with a specific connection.
   * 
   * @param {string} username - The target user's unique username.
   */
  const handleSendMessage = (username: string) => {
    navigate(`/messages/${username}`);
  };

  // --- Filtering Logic ---

  /**
   * Filters a provided list of network users based on the current search query.
   * Evaluates the query against a concatenation of the user's first and last name.
   * 
   * @param {NetworkUser[]} list - The array of users to filter.
   * @returns {NetworkUser[]} The filtered array of users.
   */
  const filterBySearch = (list: NetworkUser[]) => {
    return list.filter((user) => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  };

  // Display a full-screen loading spinner while the initial data fetch is in progress
  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  // Apply the local search filter to all three network categories prior to rendering
  const filteredReceived = filterBySearch(receivedRequests);
  const filteredSent = filterBySearch(sentRequests);
  const filteredConnections = filterBySearch(connections);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3} sx={{ justifyContent: "center" }}>
        <Grid sx={{ xs: 12, md: 8 }}>
          
          {/* --- Global Network Search Bar --- */}
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2, mb: 3 }}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Search your network..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              // Uses slotProps instead of InputProps to comply with modern MUI component standards
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Paper>

          {/* --- 1. RECEIVED INVITATIONS SECTION --- */}
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Received Invitations
            </Typography>
            {filteredReceived.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No pending friend requests.
              </Typography>
            ) : (
              <List disablePadding>
                {filteredReceived.map((req, index) => (
                  <Box key={req.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar
                        sx={{ cursor: "pointer" }}
                        onClick={() => handleProfileClick(req.username)}
                      >
                        <Avatar
                          sx={{
                            width: 50,
                            height: 50,
                            mr: 2,
                            bgcolor: "secondary.main",
                          }}
                        >
                          {req.first_name[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: "bold", cursor: "pointer" }}
                            onClick={() => handleProfileClick(req.username)}
                          >
                            {req.first_name} {req.last_name}
                          </Typography>
                        }
                        secondary={req.bio}
                      />
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="text"
                          color="inherit"
                          size="small"
                          onClick={() =>
                            handleRemoveOrCancel(req.id, "received")
                          }
                        >
                          Ignore
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          sx={{ borderRadius: 5 }}
                          onClick={() => handleAcceptRequest(req.id)}
                        >
                          Accept
                        </Button>
                      </Box>
                    </ListItem>
                    {/* Render a visual divider between items, except after the last one */}
                    {index < filteredReceived.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Paper>

          {/* --- 2. SENT INVITATIONS SECTION --- */}
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Sent Invitations
            </Typography>
            {filteredSent.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No sent requests pending.
              </Typography>
            ) : (
              <List disablePadding>
                {filteredSent.map((req, index) => (
                  <Box key={req.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar
                        sx={{ cursor: "pointer" }}
                        onClick={() => handleProfileClick(req.username)}
                      >
                        <Avatar
                          sx={{
                            width: 50,
                            height: 50,
                            mr: 2,
                            bgcolor: "grey.400",
                          }}
                        >
                          {req.first_name[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: "bold", cursor: "pointer" }}
                            onClick={() => handleProfileClick(req.username)}
                          >
                            {req.first_name} {req.last_name}
                          </Typography>
                        }
                        secondary={req.bio}
                      />
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        sx={{ borderRadius: 5, textTransform: "none" }}
                        onClick={() => handleRemoveOrCancel(req.id, "sent")}
                      >
                        Cancel Request
                      </Button>
                    </ListItem>
                    {index < filteredSent.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Paper>

          {/* --- 3. CONNECTIONS SECTION --- */}
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Your Connections
            </Typography>
            {filteredConnections.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No connections found.
              </Typography>
            ) : (
              <List disablePadding>
                {filteredConnections.map((conn, index) => (
                  <Box key={conn.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar
                        sx={{ cursor: "pointer" }}
                        onClick={() => handleProfileClick(conn.username)}
                      >
                        <Avatar
                          sx={{
                            width: 50,
                            height: 50,
                            mr: 2,
                            bgcolor: "primary.main",
                          }}
                        >
                          {conn.first_name[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: "bold", cursor: "pointer" }}
                            onClick={() => handleProfileClick(conn.username)}
                          >
                            {conn.first_name} {conn.last_name}
                          </Typography>
                        }
                        secondary={conn.bio}
                      />
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          sx={{ borderRadius: 5, textTransform: "none" }}
                          onClick={() =>
                            handleRemoveOrCancel(conn.id, "connection")
                          }
                        >
                          Remove
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          sx={{ borderRadius: 5, textTransform: "none" }}
                          onClick={() => handleSendMessage(conn.username)}
                        >
                          Message
                        </Button>
                      </Box>
                    </ListItem>
                    {index < filteredConnections.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Paper>
          
        </Grid>
      </Grid>
    </Container>
  );
};

export default Network;