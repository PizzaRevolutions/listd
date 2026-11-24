import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

let io: SocketIOServer | null = null;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export function initWebSocketServer(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // JWT Authentication Middleware for WebSockets
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; username: string };
      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch (err) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    if (!userId) return;

    // Join user's private notification and message room
    socket.join(`user:${userId}`);
    console.log(`🔌 [WebSocket] User connected: ${socket.username} (${userId})`);

    // Handle typing notification
    socket.on('typing', ({ receiverId, isTyping }: { receiverId: string; isTyping: boolean }) => {
      io?.to(`user:${receiverId}`).emit('user_typing', {
        senderId: userId,
        username: socket.username,
        isTyping,
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [WebSocket] User disconnected: ${socket.username}`);
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}
