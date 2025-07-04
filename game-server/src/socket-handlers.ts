import { Socket, Server } from 'socket.io';
import { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData 
} from '@lastlight/shared-networking';
import { RoomManager } from './room-manager.js';
import { GameManager } from './game-manager.js';
import { v4 as uuidv4 } from 'uuid';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class SocketHandlers {
  constructor(
    private io: TypedServer,
    private roomManager: RoomManager,
    private gameManager: GameManager
  ) {}

  handleConnection(socket: TypedSocket): void {
    console.log(`Player connected: ${socket.id}`);

    this.setupRoomHandlers(socket);
    this.setupGameHandlers(socket);
    this.setupDisconnectHandler(socket);
  }

  private setupRoomHandlers(socket: TypedSocket): void {
    socket.on('room:create', ({ roomName, playerName, maxPlayers }) => {
      const playerId = uuidv4();
      const roomId = this.roomManager.generateRoomId();
      const player = this.roomManager.createPlayer(playerId, playerName);
      const room = this.roomManager.createGameRoom(roomId, roomName, playerId, maxPlayers);
      
      room.players.push(player);
      this.roomManager.addRoom(roomId, room);
      this.roomManager.addPlayerConnection(playerId, socket.id);
      
      socket.data.playerId = playerId;
      socket.data.roomId = roomId;
      socket.data.playerName = playerName;
      
      socket.join(roomId);
      socket.emit('room:created', { room, playerId });
      
      console.log(`Room created: ${roomId} by ${playerName}`);
    });

    socket.on('room:join', ({ roomId, playerName }) => {
      const room = this.roomManager.getRoom(roomId);
      
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
      const player = this.roomManager.createPlayer(playerId, playerName);
      
      room.players.push(player);
      this.roomManager.addPlayerConnection(playerId, socket.id);
      
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
      this.handlePlayerLeave(socket);
    });

    socket.on('room:list', () => {
      const roomList = this.roomManager.getRoomSummaries();
      socket.emit('room:list', { rooms: roomList });
    });
  }

  private setupGameHandlers(socket: TypedSocket): void {
    socket.on('game:start', () => {
      const { playerId, roomId } = socket.data;
      
      if (!playerId || !roomId) {
        socket.emit('error', { message: 'Not in a room', code: 'NOT_IN_ROOM' });
        return;
      }
      
      const room = this.roomManager.getRoom(roomId);
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
      
      const gameState = this.gameManager.createGameState(room);
      room.gameState = gameState;
      room.isStarted = true;
      
      this.io.to(roomId).emit('game:started', { gameState });
      
      // Send current positions to all players when game starts
      room.players.forEach(player => {
        this.io.to(roomId).emit('game:player-moved', { 
          playerId: player.id, 
          position: player.position 
        });
      });
      
      console.log(`Game started in room: ${roomId}`);
    });

    socket.on('game:move', ({ position }) => {
      const { playerId, roomId } = socket.data;
      
      if (!playerId || !roomId) return;
      
      const room = this.roomManager.getRoom(roomId);
      if (!room) return;
      
      this.gameManager.updatePlayerPosition(room, playerId, position);
      socket.to(roomId).emit('game:player-moved', { playerId, position });
    });

    socket.on('game:request-positions', () => {
      const { playerId, roomId } = socket.data;
      
      if (!playerId || !roomId) return;
      
      const room = this.roomManager.getRoom(roomId);
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
      
      const room = this.roomManager.getRoom(roomId);
      if (!room || !room.gameState) return;
      
      const taskCompleted = this.gameManager.completeTask(room.gameState, taskId, playerId);
      if (taskCompleted) {
        // Broadcast task completion
        this.io.to(roomId).emit('game:task-completed', { taskId, playerId });
        
        // Check win condition
        const winResult = this.gameManager.checkWinCondition(room.gameState);
        if (winResult.hasWon) {
          room.gameState.phase = 'ended';
          this.io.to(roomId).emit('game:ended', { 
            winner: winResult.winner!, 
            reason: winResult.reason! 
          });

          // Reset room after game ends (5 second delay)
          setTimeout(() => {
            this.roomManager.resetRoom(room);
            
            // Broadcast updated room list
            const roomList = this.roomManager.getRoomSummaries();
            this.io.emit('room:list', { rooms: roomList });
            console.log(`Room ${roomId} reset after game completion`);
          }, 5000);
        }
        
        console.log(`Task ${taskId} completed by ${playerId} in room ${roomId}`);
      }
    });
  }

  private setupDisconnectHandler(socket: TypedSocket): void {
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      this.handlePlayerLeave(socket);
    });
  }

  private handlePlayerLeave(socket: TypedSocket): void {
    const { playerId, roomId } = socket.data;
    
    if (!playerId || !roomId) return;
    
    const room = this.roomManager.getRoom(roomId);
    if (!room) return;
    
    // Remove player from room
    room.players = room.players.filter(p => p.id !== playerId);
    this.roomManager.removePlayerConnection(playerId);
    
    socket.leave(roomId);
    socket.to(roomId).emit('room:player-left', { playerId });
    
    // If room is empty or host left, clean up
    if (room.players.length === 0) {
      this.roomManager.deleteRoom(roomId);
      console.log(`Room deleted: ${roomId}`);
    } else if (room.hostPlayerId === playerId) {
      // Transfer host to next player
      room.hostPlayerId = room.players[0].id;
      socket.to(roomId).emit('room:updated', { room });
      console.log(`Host transferred in room: ${roomId}`);
    }

    // Broadcast updated room list to all players in lobby
    const roomList = this.roomManager.getRoomSummaries();
    this.io.emit('room:list', { rooms: roomList });
  }
}