import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData 
} from '@./shared/networking';
import { GameRoom, Player, GameState } from '@./shared/models';
import { v4 as uuidv4 } from 'uuid';

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

// In-memory storage (replace with Redis later)
const gameRooms = new Map<string, GameRoom>();
const playerConnections = new Map<string, string>(); // playerId -> socketId

// Utility functions
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    position: { x: 0, y: 0 },
    role: 'crewmate',
    isAlive: true,
    infectionLevel: 0
  };
}

function createGameRoom(id: string, name: string, hostPlayerId: string, maxPlayers: number): GameRoom {
  return {
    id,
    name,
    players: [],
    gameState: null,
    isStarted: false,
    maxPlayers,
    hostPlayerId
  };
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Room Management
  socket.on('room:create', ({ roomName, playerName, maxPlayers }) => {
    const playerId = uuidv4();
    const roomId = generateRoomId();
    const player = createPlayer(playerId, playerName);
    const room = createGameRoom(roomId, roomName, playerId, maxPlayers);
    
    room.players.push(player);
    gameRooms.set(roomId, room);
    playerConnections.set(playerId, socket.id);
    
    socket.data.playerId = playerId;
    socket.data.roomId = roomId;
    socket.data.playerName = playerName;
    
    socket.join(roomId);
    socket.emit('room:created', { room, playerId });
    
    console.log(`Room created: ${roomId} by ${playerName}`);
  });

  socket.on('room:join', ({ roomId, playerName }) => {
    const room = gameRooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found', code: 'ROOM_NOT_FOUND' });
      return;
    }
    
    if (room.players.length >= room.maxPlayers) {
      socket.emit('error', { message: 'Room is full', code: 'ROOM_FULL' });
      return;
    }
    
    if (room.isStarted) {
      socket.emit('error', { message: 'Game already started', code: 'GAME_STARTED' });
      return;
    }
    
    const playerId = uuidv4();
    const player = createPlayer(playerId, playerName);
    
    room.players.push(player);
    playerConnections.set(playerId, socket.id);
    
    socket.data.playerId = playerId;
    socket.data.roomId = roomId;
    socket.data.playerName = playerName;
    
    socket.join(roomId);
    socket.emit('room:joined', { room, playerId });
    socket.to(roomId).emit('room:player-joined', { player });
    
    console.log(`${playerName} joined room: ${roomId}`);
  });

  socket.on('room:leave', () => {
    handlePlayerLeave(socket);
  });

  socket.on('room:list', () => {
    const availableRooms = Array.from(gameRooms.values())
      .filter(room => !room.isStarted && room.players.length < room.maxPlayers);
    socket.emit('room:list', { rooms: availableRooms });
  });

  // Game Actions
  socket.on('game:start', () => {
    const { playerId, roomId } = socket.data;
    
    if (!playerId || !roomId) {
      socket.emit('error', { message: 'Not in a room', code: 'NOT_IN_ROOM' });
      return;
    }
    
    const room = gameRooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found', code: 'ROOM_NOT_FOUND' });
      return;
    }
    
    if (room.hostPlayerId !== playerId) {
      socket.emit('error', { message: 'Only host can start game', code: 'NOT_HOST' });
      return;
    }
    
    if (room.players.length < 4) {
      socket.emit('error', { message: 'Need at least 4 players', code: 'NOT_ENOUGH_PLAYERS' });
      return;
    }
    
    // Create initial game state
    const gameState: GameState = {
      id: uuidv4(),
      players: room.players,
      rooms: [], // Will be populated later
      entropyMeter: 0,
      phase: 'playing',
      tasks: [], // Will be populated later
      maxPlayers: room.maxPlayers,
      hostPlayerId: room.hostPlayerId
    };
    
    room.gameState = gameState;
    room.isStarted = true;
    
    io.to(roomId).emit('game:started', { gameState });
    console.log(`Game started in room: ${roomId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    handlePlayerLeave(socket);
  });

  function handlePlayerLeave(socket: any) {
    const { playerId, roomId } = socket.data;
    
    if (!playerId || !roomId) return;
    
    const room = gameRooms.get(roomId);
    if (!room) return;
    
    // Remove player from room
    room.players = room.players.filter(p => p.id !== playerId);
    playerConnections.delete(playerId);
    
    socket.leave(roomId);
    socket.to(roomId).emit('room:player-left', { playerId });
    
    // If room is empty or host left, clean up
    if (room.players.length === 0) {
      gameRooms.delete(roomId);
      console.log(`Room deleted: ${roomId}`);
    } else if (room.hostPlayerId === playerId) {
      // Transfer host to next player
      room.hostPlayerId = room.players[0].id;
      socket.to(roomId).emit('room:updated', { room });
      console.log(`Host transferred in room: ${roomId}`);
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    rooms: gameRooms.size,
    connections: playerConnections.size 
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Game server running on port ${PORT}`);
});