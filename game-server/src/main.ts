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
import { GameRoom, Player, GameState, Task } from '@lastlight/shared-models';
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
    position: { x: 2400, y: 1600 }, // Start in center hub
    role: 'crewmate',
    isAlive: true,
    infectionLevel: 0
  };
}

function createInitialTasks(): Task[] {
  return [
    {
      id: 'power',
      roomId: 'power-room',
      type: 'power',
      isCompleted: false
    },
    {
      id: 'oxygen',
      roomId: 'oxygen-room',
      type: 'oxygen',
      isCompleted: false
    },
    {
      id: 'communications',
      roomId: 'comms-room',
      type: 'communications',
      isCompleted: false
    }
  ];
}

function resetRoom(room: GameRoom) {
  // Reset room state
  room.isStarted = false;
  room.gameState = null;
  
  // Keep players in the room but reset their state
  room.players.forEach(player => {
    player.position = { x: 2400, y: 1600 }; // Reset to center hub
    player.role = 'crewmate';
    player.isAlive = true;
    player.infectionLevel = 0;
  });
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
    
    // Send current positions of all existing players to the new player
    room.players.forEach(existingPlayer => {
      if (existingPlayer.id !== playerId) {
        socket.emit('game:player-moved', { 
          playerId: existingPlayer.id, 
          position: existingPlayer.position 
        });
      }
    });
    
    // If game is in progress, send game state to new player
    if (room.isStarted && room.gameState) {
      socket.emit('game:started', { gameState: room.gameState });
    }
    
    console.log(`${playerName} joined room: ${roomId}`);
  });

  socket.on('room:leave', () => {
    console.log(`Player ${socket.data.playerName} manually left room ${socket.data.roomId}`);
    handlePlayerLeave(socket);
  });

  socket.on('room:list', () => {
    const roomList = Array.from(gameRooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers,
      status: room.isStarted ? 'playing' : 'waiting',
      isJoinable: !room.isStarted && room.players.length < room.maxPlayers
    }));
    
    socket.emit('room:list', { rooms: roomList });
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
    
    if (room.players.length < 1) {
      socket.emit('error', { message: 'Need at least 1 player', code: 'NOT_ENOUGH_PLAYERS' });
      return;
    }
    
    // Create initial game state
    const gameState: GameState = {
      id: uuidv4(),
      players: room.players,
      rooms: [], // Will be populated later
      entropyMeter: 0,
      phase: 'playing',
      tasks: createInitialTasks(),
      maxPlayers: room.maxPlayers,
      hostPlayerId: room.hostPlayerId
    };
    
    room.gameState = gameState;
    room.isStarted = true;
    
    io.to(roomId).emit('game:started', { gameState });
    
    // Send current positions to all players when game starts
    room.players.forEach(player => {
      io.to(roomId).emit('game:player-moved', { 
        playerId: player.id, 
        position: player.position 
      });
    });
    
    console.log(`Game started in room: ${roomId}`);
  });

  // Game Events
  socket.on('game:move', ({ position }) => {
    const { playerId, roomId } = socket.data;
    
    if (!playerId || !roomId) return;
    
    const room = gameRooms.get(roomId);
    if (!room) return;
    
    // Update player position in room players array (always available)
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.position = position;
      socket.to(roomId).emit('game:player-moved', { playerId, position });
    }
    
    // Also update in game state if game is started
    if (room.gameState) {
      const gamePlayer = room.gameState.players.find(p => p.id === playerId);
      if (gamePlayer) {
        gamePlayer.position = position;
      }
    }
  });

  socket.on('game:request-positions', () => {
    const { playerId, roomId } = socket.data;
    
    if (!playerId || !roomId) return;
    
    const room = gameRooms.get(roomId);
    if (!room) return;
    
    // Send positions of all other players
    room.players.forEach(player => {
      if (player.id !== playerId) {
        socket.emit('game:player-moved', { 
          playerId: player.id, 
          position: player.position 
        });
      }
    });
  });

  socket.on('game:complete-task', ({ taskId }) => {
    const { playerId, roomId } = socket.data;
    
    if (!playerId || !roomId) return;
    
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState) return;
    
    // Find and complete the task
    const task = room.gameState.tasks.find(t => t.id === taskId);
    if (task && !task.isCompleted) {
      task.isCompleted = true;
      task.assignedPlayerId = playerId;
      
      // Broadcast task completion
      io.to(roomId).emit('game:task-completed', { taskId, playerId });
      
      // Check win condition
      const allTasksCompleted = room.gameState.tasks.every(t => t.isCompleted);
      if (allTasksCompleted) {
        room.gameState.phase = 'ended';
        io.to(roomId).emit('game:ended', { 
          winner: 'crew', 
          reason: 'All tasks completed' 
        });

        // Reset room after game ends (5 second delay)
        setTimeout(() => {
          resetRoom(room);
          
          // Broadcast updated room list
          const roomList = Array.from(gameRooms.values()).map(room => ({
            id: room.id,
            name: room.name,
            playerCount: room.players.length,
            maxPlayers: room.maxPlayers,
            status: room.isStarted ? 'playing' : 'waiting',
            isJoinable: !room.isStarted && room.players.length < room.maxPlayers
          }));
          
          io.emit('room:list', { rooms: roomList });
          console.log(`Room ${roomId} reset after game completion`);
        }, 5000);
      }
      
      console.log(`Task ${taskId} completed by ${playerId} in room ${roomId}`);
    }
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

    // Broadcast updated room list to all players in lobby
    const roomList = Array.from(gameRooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers,
      status: room.isStarted ? 'playing' : 'waiting',
      isJoinable: !room.isStarted && room.players.length < room.maxPlayers
    }));
    
    io.emit('room:list', { rooms: roomList });
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