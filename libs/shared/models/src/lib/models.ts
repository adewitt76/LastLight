export interface Player {
  id: string;
  name: string;
  position: { x: number; y: number };
  role: 'crewmate' | 'decayer';
  isAlive: boolean;
  infectionLevel: number; // 0-100
}

export interface Room {
  id: string;
  decayLevel: number; // 0-100
  lighting: number; // 0-100 (100 = full light)
  hasSpores: boolean;
  isAccessible: boolean;
}

export interface Task {
  id: string;
  roomId: string;
  type: 'power' | 'oxygen' | 'communications' | 'decontamination';
  isCompleted: boolean;
  assignedPlayerId?: string;
}

export interface GameState {
  id: string;
  players: Player[];
  rooms: Room[];
  entropyMeter: number; // 0-100 (100 = game over)
  phase: 'lobby' | 'playing' | 'meeting' | 'voting' | 'ended';
  tasks: Task[];
  maxPlayers: number;
  hostPlayerId: string;
}

export interface GameRoom {
  id: string;
  name: string;
  players: Player[];
  gameState: GameState | null;
  isStarted: boolean;
  maxPlayers: number;
  hostPlayerId: string;
}
