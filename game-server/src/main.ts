import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData 
} from '@lastlight/shared-networking';
import { RoomManager } from './room-manager.js';
import { GameManager } from './game-manager.js';
import { SocketHandlers } from './socket-handlers.js';

const app = express();
const server = createServer(app);

// Configure CORS for Express
app.use(cors({
  origin: ["http://localhost:4200", "http://127.0.0.1:4200"],
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"]
}));

// Socket.io server with TypeScript types
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: ["http://localhost:4200", "http://127.0.0.1:4200"],
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  }
});

// Initialize managers
const roomManager = new RoomManager();
const gameManager = new GameManager();
const socketHandlers = new SocketHandlers(io, roomManager, gameManager);

// Socket.io connection handling
io.on('connection', (socket) => {
  socketHandlers.handleConnection(socket);
});

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ 
    status: 'ok', 
    rooms: roomManager.roomCount,
    connections: roomManager.connectionCount 
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Game server running on port ${PORT}`);
});