import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Divider,
  IconButton,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import { Edit, Save, Cancel, DeleteOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axiosConfig";
import CommentSection from "./CommentSection";

/**
 * Interface representing the structure of a Post object.
 */
interface Post {
  id: string;
  content: string;
  visibility: string;
  created_at: string;
  author_id: string;
  author: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
}

/**
 * Props interface for the PostItem component.
 */
interface PostItemProps {
  /** The post data object to be displayed */
  post: Post;
  /** Callback function triggered when a post is successfully deleted */
  onDelete: (id: string) => void;
}

/**
 * PostItem Component
 * Renders an individual post card, handling its display, inline editing, and deletion.
 * Integrates with the CommentSection for nested interactions.
 * 
 * @param {PostItemProps} props - The component props.
 */
const PostItem = ({ post, onDelete }: PostItemProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State to toggle between viewing and editing modes
  const [isEditing, setIsEditing] = useState(false);

  /**
   * States for Edit Mode
   * Tracks the temporary input values while the user is actively editing the post.
   */
  const [editContent, setEditContent] = useState(post.content);
  const [editVisibility, setEditVisibility] = useState(post.visibility);

  /**
   * States for Display Mode
   * Holds the finalized data that is currently rendered to the user.
   */
  const [displayContent, setDisplayContent] = useState(post.content);
  const [displayVisibility, setDisplayVisibility] = useState(post.visibility);

  /**
   * Real-Time Synchronization Hook
   * Listens for changes to the 'post' prop. If the parent component (PostList)
   * receives updated data via WebSockets and passes it down, this ensures the
   * local state remains perfectly synchronized without requiring a page refresh.
   */
  useEffect(() => {
    setDisplayContent(post.content);
    setDisplayVisibility(post.visibility);
    setEditContent(post.content);
    setEditVisibility(post.visibility);
  }, [post]);

  /**
   * Submits the updated post content and visibility settings to the server.
   */
  const handleUpdate = async () => {
    try {
      await api.put(`/posts/${post.id}`, {
        content: editContent,
        visibility: editVisibility,
      });
      
      // Update UI immediately for a snappy, optimistic rendering feel locally
      setDisplayContent(editContent);
      setDisplayVisibility(editVisibility);
      setIsEditing(false);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update post");
    }
  };

  /**
   * Requests the deletion of the post after prompting the user for confirmation.
   */
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/posts/${post.id}`);
      
      // Invoke the callback to remove the post from the parent component's state
      onDelete(post.id);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete post");
    }
  };

  return (
    <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden", mb: 2 }}>
      
      {/* --- HEADER SECTION --- */}
      {/* Displays user info, timestamp, visibility, and action buttons */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box
          sx={{ display: "flex", gap: 1.5, cursor: "pointer" }}
          onClick={() =>
            post.author?.username &&
            navigate(`/profile/${post.author.username}`)
          }
        >
          {/* Fallback protections: Prevents the application from crashing if the 'author' object or 'first_name' property is missing */}
          <Avatar sx={{ bgcolor: "primary.main" }}>
            {post.author?.first_name?.[0]?.toUpperCase() || "U"}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              {post.author?.first_name || "Unknown"}{" "}
              {post.author?.last_name || "User"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(post.created_at).toLocaleString()} • {displayVisibility}
            </Typography>
          </Box>
        </Box>

        {/* --- ACTIONS SECTION --- */}
        {/* Render Edit and Delete buttons only if the current user is the author of the post and not currently in edit mode */}
        {user?.id === post.author_id && !isEditing && (
          <Box>
            <IconButton size="small" onClick={() => setIsEditing(true)}>
              <Edit fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={handleDelete}>
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* --- CONTENT AREA --- */}
      {/* Toggles between the editing form and the standard text display */}
      <Box sx={{ px: 2, pb: 2 }}>
        {isEditing ? (
          <Box>
            <TextField
              fullWidth
              multiline
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              sx={{ mb: 1.5 }}
            />

            {/* Visibility Configuration Dropdown for Edit Mode */}
            <FormControl
              size="small"
              sx={{ mb: 1.5, minWidth: 150, display: "block" }}
            >
              <Select
                value={editVisibility}
                onChange={(e) => setEditVisibility(e.target.value)}
                displayEmpty
              >
                <MenuItem value="PUBLIC">Public</MenuItem>
                <MenuItem value="FRIENDS_ONLY">Friends Only</MenuItem>
                <MenuItem value="PRIVATE">Private</MenuItem>
              </Select>
            </FormControl>

            {/* Edit Mode Actions (Save / Cancel) */}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="contained"
                startIcon={<Save />}
                onClick={handleUpdate}
              >
                Save
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => {
                  // Exit edit mode and revert the input fields to the original display data
                  setIsEditing(false);
                  setEditContent(displayContent); 
                  setEditVisibility(displayVisibility); 
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          // Standard Read-Only Content Display
          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
            {displayContent}
          </Typography>
        )}
      </Box>

      <Divider />
      
      {/* Nested component handling all comment-related functionality for this specific post */}
      <CommentSection postId={post.id} />
    </Paper>
  );
};

export default PostItem;