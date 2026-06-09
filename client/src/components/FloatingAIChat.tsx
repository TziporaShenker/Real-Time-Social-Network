import { useState } from 'react';
import {
  Box,
  Fab,
  Paper,
  Typography,
  TextField,
  IconButton,
  Collapse,
} from '@mui/material';
import { SmartToy, Close, Send } from '@mui/icons-material';
import { useAI } from '../context/AIContext';
import API from '../api/axiosConfig'; // שימוש ב-Instance של הפרויקט שלך

const FloatingAIChat = () => {
  const { activePostId } = useAI();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
  
    // הוספת הודעת המשתמש לצ'אט באופן מיידי
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    
    // הוספת הודעת טעינה זמנית מה-AI
    setMessages((prev) => [...prev, { role: 'assistant', text: 'Thinking...' }]);
  
    try {
      // קריאה לשרת ה-Node.js שלנו (הכתובת היחסית מתווספת ל-axiosConfig)
      const response = await API.post('/ai/suggest-comment', {
        prompt: trimmed,
        postId: activePostId
      });
  
      // עדכון הודעת הטעינה האחרונה בתשובה האמיתית מ-Gemini שחזרה מהשרת
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = { role: 'assistant', text: response.data.reply };
        }
        return updated;
      });
  
    } catch (error) {
      console.error('Error fetching AI reply:', error);
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = { role: 'assistant', text: 'Sorry, I encountered an error. Please try again.' };
        }
        return updated;
      });
    }
  };

  return (
    <>
      <Collapse in={open}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 88,
            right: 24,
            width: 360,
            maxWidth: 'calc(100vw - 48px)',
            height: 420,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
            zIndex: 1300,
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToy fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                AI Assistant
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'inherit' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ px: 2, py: 1, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              {activePostId
                ? `Active post: ${activePostId.slice(0, 8)}…`
                : 'No post in focus — scroll the feed'}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Ask me anything about the post you're reading.
              </Typography>
            ) : (
              messages.map((msg, i) => (
                <Box
                  key={i}
                  sx={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.200',
                    color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  }}
                >
                  <Typography variant="body2">{msg.text}</Typography>
                </Box>
              ))
            )}
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Ask about this post…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <IconButton color="primary" onClick={handleSend} disabled={!input.trim()}>
              <Send />
            </IconButton>
          </Box>
        </Paper>
      </Collapse>

      <Fab
        color="primary"
        aria-label="AI assistant"
        onClick={() => setOpen((prev) => !prev)}
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}
      >
        {open ? <Close /> : <SmartToy />}
      </Fab>
    </>
  );
};

export default FloatingAIChat;