import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http"; // 1. ADDED: Import Node's native http module
import { Server } from "socket.io"; // 2. ADDED: Import Socket.IO

import pool from "./config/db";
import authRoutes from "./routes/authRoutes";
import postRoutes from "./routes/postRoutes";
import friendRoutes from "./routes/friendRoutes";
import userRoutes from "./routes/userRoutes";
import commentRoutes from "./routes/commentRoutes"; 
import messageRoutes from "./routes/messageRoutes"; 
import cookieParser from "cookie-parser";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173', // הכתובת המדויקת של אפליקציית הריאקט שלך
  credentials: true // קריטי! אומר לדפדפן: "אני מרשה לאתר הזה לשלוח לי עוגיות"
}));
app.use(cookieParser())
app.use(express.json()); // Parse incoming JSON requests

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/messages", messageRoutes);
app.use('/api/users', userRoutes);

// ==========================================
// SOCKET.IO REAL-TIME SETUP
// ==========================================

// 3. ADDED: Create an HTTP server that wraps the Express app
const server = http.createServer(app);

// 4. ADDED: Initialize Socket.IO with CORS settings for React
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // URL of your React app (Update if different)
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// 5. ADDED: Listen for socket connections
io.on("connection", (socket) => {
  console.log(`[Socket.IO]: User connected with ID: ${socket.id}`);

  // When a user logs in / loads the app, they send their DB ID to join a private room
  socket.on("register_user", (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined their private room.`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.IO]: User disconnected: ${socket.id}`);
  });
});

// ==========================================
// START SERVER
// ==========================================

// 6. CHANGED: Use server.listen instead of app.listen!
server.listen(PORT, () => {
  console.log(`[Server]: Running at http://localhost:${PORT}`);
});