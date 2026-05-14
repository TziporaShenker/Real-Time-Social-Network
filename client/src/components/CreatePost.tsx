import { useState } from "react";
import {
  Paper,
  Box,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";
import { Public, People, Lock } from "@mui/icons-material"; // Icons representing different visibility settings
import { useAuth } from "../context/AuthContext";
import api from "../api/axiosConfig";

/**
 * Props interface for the CreatePost component.
 */
interface CreatePostProps {
  /** Optional callback function executed after a post is successfully created */
  onPostCreated?: () => void;
}

/**
 * CreatePost Component
 * Renders a UI trigger that opens a dialog allowing users to create a new post.
 * Includes functionality for setting post visibility (Public, Friends Only, Private).
 *
 * @param {CreatePostProps} props - The component props.
 */
const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  // Retrieve the current authenticated user from the context
  const { user } = useAuth();

  // State management for dialog visibility and post content
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  
  // State management for the selected post visibility level
  const [visibility, setVisibility] = useState("PUBLIC");
  
  // State to track the loading status during the API request
  const [loading, setLoading] = useState(false);

  /**
   * Opens the post creation dialog.
   */
  const handleOpen = () => setOpen(true);

  /**
   * Closes the dialog and resets all input fields to their default states.
   * Prevents closing if a submission is currently in progress.
   */
  const handleClose = () => {
    if (!loading) {
      setOpen(false);
      setContent("");
      setVisibility("PUBLIC"); // Reset visibility to default value
    }
  };

  /**
   * Handles the submission of the new post to the server.
   */
  const handleSubmit = async () => {
    // Prevent submission if the content is empty or contains only whitespace
    if (!content.trim()) return;

    try {
      setLoading(true);

      /**
       * Transmit the POST request to the server with the post content 
       * and the selected visibility setting.
       */
      await api.post("/posts", {
        content: content,
        visibility: visibility, 
      });

      // Trigger the callback function if it was provided via props
      if (onPostCreated) {
        onPostCreated();
      }

      // Close the dialog and clean up the form upon successful creation
      handleClose();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Post Trigger Card: A stylized button that mimics an input field to prompt user interaction */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "secondary.main" }}>
            {user?.first_name ? user.first_name[0].toUpperCase() : "?"}
          </Avatar>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleOpen}
            sx={{
              justifyContent: "flex-start",
              borderRadius: 10,
              color: "text.secondary",
              borderColor: "divider",
              textTransform: "none",
              py: 1,
            }}
          >
            Start a post...
          </Button>
        </Box>
      </Paper>

      {/* Create Post Dialog: Modal window containing the form for drafting and configuring the post */}
      <Dialog
        open={open}
        onClose={(event, reason) => {
          // Prevent the dialog from closing when clicking outside or pressing Escape during an active API call
          if (loading && (reason === "backdropClick" || reason === "escapeKeyDown")) return;
          handleClose();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>Create a post</DialogTitle>

        <DialogContent dividers>
          {/* Header section containing the user's avatar, name, and the visibility configuration dropdown */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: "secondary.main" }}>
              {user?.first_name ? user.first_name[0].toUpperCase() : "?"}
            </Avatar>
            <Box>
              <Box sx={{ fontWeight: "bold" }}>
                {user?.first_name} {user?.last_name}
              </Box>
              
              {/* Visibility Selection Dropdown */}
              <FormControl variant="standard" sx={{ mt: 0.5 }}>
                <Select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  disabled={loading}
                  sx={{ 
                    fontSize: "0.75rem", 
                    borderRadius: 5, 
                    border: "1px solid #666", 
                    px: 1,
                    "&:before, &:after": { display: "none" } // Hides the default MUI standard input underline
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {selected === "PUBLIC" && <Public fontSize="inherit" />}
                      {selected === "FRIENDS_ONLY" && <People fontSize="inherit" />}
                      {selected === "PRIVATE" && <Lock fontSize="inherit" />}
                      {selected.replace("_", " ")}
                    </Box>
                  )}
                >
                  <MenuItem value="PUBLIC">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Public fontSize="small" /> Public
                    </Box>
                  </MenuItem>
                  <MenuItem value="FRIENDS_ONLY">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <People fontSize="small" /> Friends Only
                    </Box>
                  </MenuItem>
                  <MenuItem value="PRIVATE">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Lock fontSize="small" /> Private
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Main textual input area for the post content */}
          <TextField
            autoFocus
            multiline
            rows={6}
            fullWidth
            placeholder="What do you want to talk about?"
            variant="standard"
            slotProps={{
              input: { disableUnderline: true, style: { fontSize: "1.1rem" } },
            }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleClose}
            color="inherit"
            disabled={loading}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!content.trim() || loading}
            sx={{
              borderRadius: 5,
              textTransform: "none",
              minWidth: 80,
            }}
          >
            {/* Display a loading spinner if the request is active, otherwise display the submit text */}
            {loading ? <CircularProgress size={24} color="inherit" /> : "Post"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CreatePost;