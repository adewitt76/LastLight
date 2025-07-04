import { Player, GameRoom, GameState, RoomSummary } from '@lastlight/shared-models';

// Client to Server Events
export interface ClientToServerEvents {
  // Room Management
  'room:create': (data: { roomName: string; playerName: string; maxPlayers: number }) => void;
  'room:join': (data: { roomId: string; playerName: string }) => void;
  'room:leave': () => void;
  'room:list': () => void;
  
  // Game Actions
  'game:start': () => void;
  'game:move': (data: { position: { x: number; y: number } }) => void;
  'game:request-positions': () => void;
  'game:complete-task': (data: { taskId: string }) => void;
  'game:task-interact': (data: { taskId: string }) => void;
  'game:emergency-meeting': () => void;
  'game:vote': (data: { targetPlayerId: string | null }) => void;
}

// Server to Client Events
export interface ServerToClientEvents {
  // Room Management
  'room:created': (data: { room: GameRoom; playerId: string }) => void;
  'room:joined': (data: { room: GameRoom; playerId: string }) => void;
  'room:left': () => void;
  'room:list': (data: { rooms: RoomSummary[] }) => void;
  'room:player-joined': (data: { player: Player }) => void;
  'room:player-left': (data: { playerId: string }) => void;
  'room:updated': (data: { room: GameRoom }) => void;
  
  // Game State
  'game:started': (data: { gameState: GameState }) => void;
  'game:state-update': (data: { gameState: GameState }) => void;
  'game:player-moved': (data: { playerId: string; position: { x: number; y: number } }) => void;
  'game:task-completed': (data: { taskId: string; playerId: string }) => void;
  'game:meeting-called': (data: { calledBy: string }) => void;
  'game:voting-started': () => void;
  'game:vote-cast': (data: { playerId: string; targetId: string | null }) => void;
  'game:ended': (data: { winner: 'crew' | 'decayers'; reason: string }) => void;
  
  // Errors
  'error': (data: { message: string; code?: string }) => void;
}

// Inter-server Events (for scaling later)
export interface InterServerEvents {
  ping: () => void;
}

// Socket Data (stored per connection)
export interface SocketData {
  playerId?: string;
  roomId?: string;
  playerName?: string;
}
