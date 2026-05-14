import { useState, useEffect } from "react";
import { 
  Box, Grid, Paper, Typography, Avatar, TextField, 
  IconButton, List, ListItem, ListItemAvatar, ListItemText, 
  CircularProgress, Divider, ListItemButton 
} from "@mui/material";
import { Send } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import api from "../api/axiosConfig";
import { io } from "socket.io-client";

/**
 * Initialize the Socket.io connection outside the component lifecycle.
 * This ensures a single persistent connection is maintained across component re-renders.
 */
const socket = io("http://localhost:5000");

/**
 * Interface representing the structure of a Contact object.
 */
interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
}

/**
 * Interface representing the structure of a Message object.
 */
interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
}

/**
 * Messages Component
 * Handles the private messaging interface, including contact selection,
 * paginated chat history retrieval, and real-time messaging via WebSockets.
 */
const Messages = () => {
  const { user } = useAuth();
  
  /**
   * Contacts State Management
   * Tracks the user's available contacts and the currently selected (active) contact.
   */
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  
  /**
   * Messages State Management
   * Manages the array of messages for the active chat and the current input field value.
   */
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  /**
   * Pagination State Management
   * Controls the loading of historical messages as the user scrolls up.
   */
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /**
   * 1. Initial Setup: Load Contacts and Register Socket Room
   * When the component mounts or the authenticated user changes, register the user's ID
   * with the WebSocket server to join a private room, and fetch their contact list.
   */
  useEffect(() => {
    if (user) {
      socket.emit("register_user", user.id); // Join private room for receiving directed messages
    }

    const fetchContacts = async () => {
      try {
        const res = await api.get("/messages/contacts");
        setContacts(res.data);
      } catch (err) {
        console.error("Failed to load contacts", err);
      }
    };
    fetchContacts();
  }, [user]);

  /**
   * 2. Load Message History
   * Fetches paginated chat history whenever the active contact or the requested page changes.
   */
  useEffect(() => {
    if (!activeContact) return;

    const fetchMessages = async () => {
      try {
        setLoadingHistory(true);
        const res = await api.get(`/messages/history/${activeContact.id}?page=${page}&limit=20`);
        
        // Disable further pagination if the returned payload has fewer items than the requested limit
        if (res.data.length < 20) setHasMore(false);

        if (page === 1) {
          // Initial load for the selected contact
          setMessages(res.data);
        } else {
          // Append older messages to the existing array without overwriting
          setMessages(prev => [...prev, ...res.data]); 
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchMessages();
  }, [activeContact, page]);

  /**
   * Handles the selection of a new contact from the sidebar.
   * Resets all pagination and message states to prepare for the new conversation.
   * 
   * @param {Contact} contact - The newly selected contact object.
   */
  const handleContactSelect = (contact: Contact) => {
    setActiveContact(contact);
    setPage(1);
    setHasMore(true);
    setMessages([]);
  };

  /**
   * 3. Real-Time Socket Listener
   * Subscribes to incoming private messages to update the UI dynamically.
   */
  useEffect(() => {
    const handlePrivateMessage = (msg: Message) => {
      // Validate that the incoming message belongs to the currently active conversation
      if (
        activeContact && 
        (msg.sender_id === activeContact.id || msg.receiver_id === activeContact.id)
      ) {
        setMessages((prev) => {
          // Prevent rendering duplicate messages
          if (prev.some((m) => m.id === msg.id)) return prev;
          
          // Prepend the new message to the array. 
          // Note: The UI uses 'column-reverse', so index 0 visually appears at the bottom.
          return [msg, ...prev]; 
        });
      }
    };

    socket.on("private_message", handlePrivateMessage);
    
    // Cleanup function to prevent memory leaks and duplicate event bindings
    return () => {
      socket.off("private_message", handlePrivateMessage);
    };
  }, [activeContact]);

  /**
   * 4. Send Message Handler
   * Transmits the user's drafted message to the server via the API.
   */
  const handleSendMessage = async () => {
    // Prevent submission of empty strings or if no contact is selected
    if (!newMessage.trim() || !activeContact) return;
    
    try {
      await api.post("/messages/send", {
        receiverId: activeContact.id,
        content: newMessage
      });
      
      // Note: We intentionally avoid manually updating the local state here. 
      // The server will broadcast the message back via WebSockets, ensuring absolute consistency.
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4, height: '75vh' }}>
      <Paper elevation={3} sx={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
        
        {/* --- LEFT PANEL: Contacts List --- */}
        <Box sx={{ width: '30%', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6">Messaging</Typography>
          </Box>
          <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
            {contacts.map((contact) => (
              <Box key={contact.id}>
                <ListItem disablePadding>
                  <ListItemButton 
                    selected={activeContact?.id === contact.id}
                    onClick={() => handleContactSelect(contact)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        {contact.first_name[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={`${contact.first_name} ${contact.last_name}`} />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </Box>
            ))}
            
            {/* Fallback UI when the user has no available contacts */}
            {contacts.length === 0 && (
              <Typography sx={{ p: 2, color: 'text.secondary', textAlign: 'center' }}>
                No friends to message yet.
              </Typography>
            )}
          </List>
        </Box>

        {/* --- RIGHT PANEL: Chat Window --- */}
        <Box sx={{ width: '70%', display: 'flex', flexDirection: 'column', bgcolor: '#f3f2ef' }}>
          {activeContact ? (
            <>
              {/* Chat Header: Displays the currently selected contact's information */}
              <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>{activeContact.first_name[0].toUpperCase()}</Avatar>
                <Typography variant="subtitle1" sx={{fontWeight:"bold"}}>
                  {activeContact.first_name} {activeContact.last_name}
                </Typography>
              </Box>

              {/* Chat Messages Area */}
              {/* Uses CSS flex-direction: 'column-reverse' to naturally anchor messages to the bottom and auto-scroll upwards */}
              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column-reverse' }}>
                
                {/* Due to 'column-reverse', iterating through the array renders index 0 at the visual bottom */}
                {messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <Box 
                      key={msg.id} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: isMine ? 'flex-end' : 'flex-start',
                        mb: 1
                      }}
                    >
                      <Box 
                        sx={{ 
                          maxWidth: '70%', 
                          p: 1.5, 
                          borderRadius: 2,
                          bgcolor: isMine ? 'primary.main' : 'white',
                          color: isMine ? 'white' : 'text.primary',
                          boxShadow: 1
                        }}
                      >
                        <Typography variant="body2">{msg.content}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, opacity: 0.7, fontSize: '0.65rem' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}

                {/* Pagination Trigger: Allows users to load older messages at the top of the chat history */}
                {hasMore && (
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <IconButton onClick={() => setPage(p => p + 1)} disabled={loadingHistory}>
                      {loadingHistory ? <CircularProgress size={20} /> : <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}>Load older messages</Typography>}
                    </IconButton>
                  </Box>
                )}
              </Box>

              {/* Message Input Area */}
              <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Write a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  sx={{ bgcolor: '#f3f2ef', borderRadius: 1 }}
                />
                <IconButton color="primary" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send />
                </IconButton>
              </Box>
            </>
          ) : (
            /* Empty State UI displayed before a user selects a contact */
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">Select a conversation to start messaging</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Messages;