import { Socket } from 'socket.io-client';
import { 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '@lastlight/shared-networking';
import { Player, GameState } from '@lastlight/shared-models';

export interface GameSocketCallbacks {
  onPlayerJoined: (player: Player) => void;
  onPlayerLeft: (playerId: string) => void;
  onPlayerMoved: (playerId: string, position: { x: number; y: number }) => void;
  onGameStarted: (gameState: GameState) => void;
  onTaskCompleted: (taskId: string, playerId: string) => void;
  onGameEnded: (winner: string, reason: string) => void;
}

export class GameSocketManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  private callbacks: GameSocketCallbacks;
  private playerId: string;

  constructor(
    socket: Socket<ServerToClientEvents, ClientToServerEvents>, 
    callbacks: GameSocketCallbacks,
    playerId: string
  ) {
    this.socket = socket;
    this.callbacks = callbacks;
    this.playerId = playerId;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.socket.on('room:player-joined', ({ player }) => {
      console.log('Player joined:', player.name);
      this.callbacks.onPlayerJoined(player);
      
      // Send our current position to the new player (handled in MainScene)
    });

    this.socket.on('room:player-left', ({ playerId }) => {
      console.log('Player left:', playerId);
      this.callbacks.onPlayerLeft(playerId);
    });

    this.socket.on('game:player-moved', ({ playerId, position }) => {
      this.callbacks.onPlayerMoved(playerId, position);
    });

    this.socket.on('game:started', ({ gameState }) => {
      console.log('Game started!', gameState);
      this.callbacks.onGameStarted(gameState);
    });

    this.socket.on('game:task-completed', ({ taskId, playerId }) => {
      console.log('Task completed:', taskId, 'by', playerId);
      this.callbacks.onTaskCompleted(taskId, playerId);
    });

    this.socket.on('game:ended', ({ winner, reason }) => {
      console.log('Game ended:', winner, reason);
      this.callbacks.onGameEnded(winner, reason);
    });
  }

  emitMove(position: { x: number; y: number }): void {
    this.socket.emit('game:move', { position });
  }

  emitTaskComplete(taskId: string): void {
    this.socket.emit('game:complete-task', { taskId });
  }

  emitGameStart(): void {
    this.socket.emit('game:start');
  }

  emitLeaveRoom(): void {
    this.socket.emit('room:leave');
  }

  requestPlayerPositions(): void {
    this.socket.emit('game:request-positions');
  }

  sendCurrentPosition(position: { x: number; y: number }): void {
    this.socket.emit('game:move', { position });
  }
}