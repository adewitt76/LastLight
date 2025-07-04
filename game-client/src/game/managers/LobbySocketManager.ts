import { io, Socket } from 'socket.io-client';
import { 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '@lastlight/shared-networking';
import { GameRoom, Player } from '@lastlight/shared-models';

export interface LobbySocketCallbacks {
  onRoomCreated: (room: GameRoom, playerId: string) => void;
  onRoomJoined: (room: GameRoom, playerId: string) => void;
  onRoomList: (rooms: any[]) => void;
  onError: (message: string) => void;
  onPlayerJoined: (player: Player) => void;
  onPlayerLeft: (playerId: string) => void;
}

export class LobbySocketManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private callbacks: LobbySocketCallbacks;

  constructor(callbacks: LobbySocketCallbacks) {
    this.callbacks = callbacks;
  }

  connect(): void {
    const serverUrl = 'http://localhost:3001';
    this.socket = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('room:created', ({ room, playerId }) => {
      console.log('Room created:', room.id);
      this.callbacks.onRoomCreated(room, playerId);
    });

    this.socket.on('room:joined', ({ room, playerId }) => {
      console.log('Joined room:', room.id);
      this.callbacks.onRoomJoined(room, playerId);
    });

    this.socket.on('room:list', ({ rooms }) => {
      console.log('Available rooms:', rooms);
      this.callbacks.onRoomList(rooms);
    });

    this.socket.on('error', ({ message }) => {
      console.error('Server error:', message);
      this.callbacks.onError(message);
    });

    this.socket.on('room:player-joined', ({ player }) => {
      console.log('Player joined room:', player.name);
      this.callbacks.onPlayerJoined(player);
    });

    this.socket.on('room:player-left', ({ playerId }) => {
      console.log('Player left room:', playerId);
      this.callbacks.onPlayerLeft(playerId);
    });
  }

  createRoom(roomName: string, playerName: string, maxPlayers: number = 6): void {
    if (!this.socket) return;

    console.log('Creating room...');
    this.socket.emit('room:create', {
      roomName,
      playerName,
      maxPlayers
    });
  }

  joinRoom(roomId: string, playerName: string): void {
    if (!this.socket) return;

    console.log('Joining room:', roomId);
    this.socket.emit('room:join', {
      roomId,
      playerName
    });
  }

  requestRoomList(): void {
    if (!this.socket) return;
    
    console.log('Requesting room list...');
    this.socket.emit('room:list');
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}