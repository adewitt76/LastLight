import { GameState, Task, GameRoom } from '@lastlight/shared-models';
import { v4 as uuidv4 } from 'uuid';

export class GameManager {
  createInitialTasks(): Task[] {
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

  createGameState(room: GameRoom): GameState {
    return {
      id: uuidv4(),
      players: room.players,
      rooms: [], // Will be populated later
      entropyMeter: 0,
      phase: 'playing',
      tasks: this.createInitialTasks(),
      maxPlayers: room.maxPlayers,
      hostPlayerId: room.hostPlayerId
    };
  }

  completeTask(gameState: GameState, taskId: string, playerId: string): boolean {
    const task = gameState.tasks.find(t => t.id === taskId);
    if (task && !task.isCompleted) {
      task.isCompleted = true;
      task.assignedPlayerId = playerId;
      return true;
    }
    return false;
  }

  checkWinCondition(gameState: GameState): { hasWon: boolean; winner?: 'crew' | 'decayers'; reason?: string } {
    const allTasksCompleted = gameState.tasks.every(t => t.isCompleted);
    if (allTasksCompleted) {
      return {
        hasWon: true,
        winner: 'crew',
        reason: 'All tasks completed'
      };
    }
    return { hasWon: false };
  }

  updatePlayerPosition(room: GameRoom, playerId: string, position: { x: number; y: number }): void {
    // Update player position in room players array (always available)
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.position = position;
    }
    
    // Also update in game state if game is started
    if (room.gameState) {
      const gamePlayer = room.gameState.players.find(p => p.id === playerId);
      if (gamePlayer) {
        gamePlayer.position = position;
      }
    }
  }
}