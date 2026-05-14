import { useState, useEffect } from 'react';
import { 
  Box, Typography, Avatar, TextField, IconButton, 
  CircularProgress, Stack, Button 
} from '@mui/material';
import { Send, Edit, Save, Cancel, DeleteOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { io } from "socket.io-client";

/**
 * Initialize the Socket.io connection outside the component lifecycle.
 * This prevents creating multiple socket instances upon component re-renders.
 */
const socket = io("http://localhost:5000"); 

/**
 * Interface representing the structure of a Comment object.
 */
interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author: {
    first_name: string;
    last_name: string;
    username: string;
  };
}

/**
 * CommentSection Component
 * Displays and manages comments for a specific post, including real-time updates via WebSockets.
 * 
 * @param {string} postId - The unique identifier of the post.
 */
const CommentSection = ({ postId }: { postId: string }) => {
  // State management for the comment list and input fields
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  
  // State management for loading indicators
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // State management for inline editing functionality
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * 1. Initial Data Fetching
   * Retrieves the existing comments for the post when the component mounts or when the postId changes.
   */
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/comments/${postId}`);
        setComments(response.data);
      } catch (err) {
        console.error("Failed to fetch comments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [postId]);

  /**
   * 2. Real-Time WebSockets Listeners
   * Subscribes to socket events to handle creating, updating, and deleting comments in real-time.
   */
  useEffect(() => {
    const handleNewComment = (newComment: any) => {
      // Validate that the broadcasted comment belongs to the currently viewed post
      if (newComment.post_id === postId) {
        setComments((prev) => {
          // Prevent appending duplicate comments to the state
          if (prev.some((c) => c.id === newComment.id)) return prev;
          // Append the newly created comment to the end of the list
          return [...prev, newComment]; 
        });
      }
    };

    const handleUpdateComment = (updatedComment: any) => {
      // Validate post scope before updating the specific comment in the state
      if (updatedComment.post_id === postId) {
        setComments((prev) => 
          prev.map((c) => (c.id === updatedComment.id ? updatedComment : c))
        );
      }
    };

    const handleDeleteComment = ({ id, postId: deletedPostId }: { id: string, postId: string }) => {
      // Validate post scope and remove the deleted comment from the local state
      if (deletedPostId === postId) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    };

    // Attach socket event listeners
    socket.on("new_comment", handleNewComment);
    socket.on("update_comment", handleUpdateComment);
    socket.on("delete_comment", handleDeleteComment);

    // Cleanup function: remove listeners on unmount to prevent memory leaks
    return () => {
      socket.off("new_comment", handleNewComment);
      socket.off("update_comment", handleUpdateComment);
      socket.off("delete_comment", handleDeleteComment);
    };
  }, [postId]);

  /**
   * 3. Event Handlers
   */

  /**
   * Submits a newly authored comment to the server.
   */
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      setSubmitting(true);
      await api.post("/comments", { postId, content: newComment });
      
      // Note: We avoid an additional API fetch here. 
      // The local UI will be updated automatically via the "new_comment" socket event broadcast.
      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Submits the updated content of an existing comment to the server.
   * @param {string} commentId - The ID of the comment being edited.
   */
  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await api.put(`/comments/${commentId}`, { content: editContent });
      
      // Close the inline editing mode locally. 
      // The actual content update across the UI is handled globally by the real-time socket event.
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update comment", err);
    }
  };

  /**
   * Requests the deletion of a specific comment after user confirmation.
   * @param {string} commentId - The ID of the comment to be deleted.
   */
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await api.delete(`/comments/${commentId}`);
      
      // Note: The UI removal is handled globally by the 'delete_comment' socket broadcast.
    } catch (err) {
      console.error("Failed to delete comment", err);
      alert("Failed to delete comment");
    }
  };

  return (
    <Box sx={{ p: 2, bgcolor: "#f9f9f9", borderTop: "1px solid #eee" }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: 'text.secondary' }}>
        Comments
      </Typography>

      {loading ? (
        <CircularProgress size={20} sx={{ display: 'block', mx: 'auto', my: 2 }} />
      ) : (
        <Stack spacing={2} sx={{ mb: 2 }}>
          {comments.map((comment) => (
            <Box key={comment.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Avatar 
                onClick={() => navigate(`/profile/${comment.author.username}`)}
                sx={{ width: 32, height: 32, fontSize: '0.8rem', cursor: 'pointer', bgcolor: 'secondary.light' }}
              >
                {comment.author.first_name[0].toUpperCase()}
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ bgcolor: "#eee", p: 1.5, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography 
                      variant="caption" 
                      onClick={() => navigate(`/profile/${comment.author.username}`)}
                      sx={{ fontWeight: "bold", cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {comment.author.first_name} {comment.author.last_name}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>

                  {editingId === comment.id ? (
                    <Box sx={{ mt: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        size="small"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        sx={{ bgcolor: 'white' }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                        <IconButton size="small" color="primary" onClick={() => handleUpdateComment(comment.id)}>
                          <Save fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setEditingId(null)}>
                          <Cancel fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.4 }}>
                      {comment.content}
                    </Typography>
                  )}
                </Box>

                {/* Conditional rendering for authorization-dependent actions (Edit/Delete) */}
                {user?.id === comment.author_id && editingId !== comment.id && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, ml: 1 }}>
                    <Button 
                      size="small" 
                      startIcon={<Edit sx={{ fontSize: '0.8rem !important' }} />}
                      onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                      sx={{ fontSize: '0.65rem', textTransform: 'none', color: 'text.secondary', p: 0, minWidth: 'auto' }}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      startIcon={<DeleteOutlined sx={{ fontSize: '0.8rem !important' }} />}
                      onClick={() => handleDeleteComment(comment.id)}
                      sx={{ fontSize: '0.65rem', textTransform: 'none', p: 0, minWidth: 'auto' }}
                    >
                      Delete
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={submitting}
          sx={{ bgcolor: 'white' }}
        />
        <IconButton color="primary" onClick={handleAddComment} disabled={!newComment.trim() || submitting}>
          {submitting ? <CircularProgress size={24} /> : <Send />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default CommentSection;