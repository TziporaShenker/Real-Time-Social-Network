import { useState, useEffect } from "react";
import { Box, CircularProgress, Typography, Button, Stack } from "@mui/material";
import api from "../api/axiosConfig";
import PostItem from "./PostItem";
import { io } from "socket.io-client"; 

/**
 * Initialize the Socket.io connection outside the component lifecycle.
 * This ensures a single persistent connection is maintained across component re-renders.
 */
const socket = io("http://localhost:5000"); 

/**
 * Props interface for the PostList component.
 */
interface PostListProps {
  /** Optional user ID used to filter the feed (e.g., when viewing a specific user's profile) */
  userId?: string;
}

/**
 * PostList Component
 * Fetches and displays a paginated feed of posts. Supports real-time updates via WebSockets
 * for new, edited, and deleted posts.
 * 
 * @param {PostListProps} props - The component props.
 */
const PostList = ({ userId }: PostListProps) => {
  // State management for posts data and UI loading indicators
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State management for pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  /**
   * Fetches a specific page of posts from the server.
   * 
   * @param {number} pageNum - The page number to retrieve.
   */
  const fetchPosts = async (pageNum: number) => {
    try {
      if (pageNum === 1) setLoading(true);
      
      const response = await api.get("/posts", { 
        params: { 
          author_id: userId,
          page: pageNum,
          limit: 10 
        } 
      });

      // Disable further pagination if the returned payload has fewer items than the limit
      if (response.data.length < 10) setHasMore(false);
      
      // If loading the first page, replace the state; otherwise, append new posts
      if (pageNum === 1) {
        setPosts(response.data);
      } else {
        setPosts(prev => [...prev, ...response.data]);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initial Data Fetching
   * Triggers a fetch for the first page of posts when the component mounts or the userId changes.
   */
  useEffect(() => {
    fetchPosts(1);
  }, [userId]);

  /**
   * Real-Time WebSockets Listeners
   * Subscribes to global post events (create, update, delete) to keep the feed synchronized.
   */
  useEffect(() => {
    const handleNewPost = (newPost: any) => {
      // Restrict incoming real-time posts to the specific user if viewing a profile page
      if (userId && newPost.author_id !== userId) return;

      setPosts((prev) => {
        // Prevent duplicate entries in the local state
        if (prev.some((p) => p.id === newPost.id)) return prev;
        // Prepend the newly created post to the top of the feed
        return [newPost, ...prev];
      });
    };

    const handleUpdatePost = (updatedPost: any) => {
      // Find the modified post in the state and update its content/visibility
      setPosts((prev) => 
        prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
      );
    };

    const handleDeletePost = ({ id }: { id: string }) => {
      // Remove the deleted post from the local state
      setPosts((prev) => prev.filter((p) => p.id !== id));
    };

    // Attach socket event listeners
    socket.on("new_post", handleNewPost);
    socket.on("update_post", handleUpdatePost);
    socket.on("delete_post", handleDeletePost);

    // Cleanup function: remove listeners on component unmount to prevent memory leaks
    return () => {
      socket.off("new_post", handleNewPost);
      socket.off("update_post", handleUpdatePost);
      socket.off("delete_post", handleDeletePost);
    };
  }, [userId]);

  /**
   * Local Deletion Handler
   * Optimistically removes a post from the local state when triggered directly by a child PostItem.
   * 
   * @param {string} id - The ID of the post to remove.
   */
  const handleDeleteFromList = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  /**
   * Increments the current page and fetches the next batch of posts.
   */
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  // Display a full-screen spinner only during the initial load
  if (loading && page === 1) return <Box sx={{ textAlign: "center", mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Stack spacing={0}>
        {posts.map((post) => (
          <PostItem 
            key={post.id} 
            post={post} 
            onDelete={handleDeleteFromList} 
          />
        ))}
      </Stack>

      {/* Pagination control allowing the user to load more posts manually */}
      {hasMore && (
        <Box sx={{ textAlign: 'center', mt: 2, mb: 4 }}>
          <Button onClick={loadMore} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Load More"}
          </Button>
        </Box>
      )}

      {/* End of feed indicator */}
      {!hasMore && posts.length > 0 && (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ my: 4 }}>
          You've reached the end of the feed.
        </Typography>
      )}
    </Box>
  );
};

export default PostList;