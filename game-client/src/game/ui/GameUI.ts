import { Scene } from 'phaser';
import { GameRoom, Task } from '@lastlight/shared-models';

export interface GameUICallbacks {
  onStartGame: () => void;
  onReturnToLobby: () => void;
}

export class GameUI {
  private scene: Scene;
  private room: GameRoom | null = null;
  private tasksCompletedText: Phaser.GameObjects.Text | null = null;
  private currentTaskText: Phaser.GameObjects.Text | null = null;
  private callbacks: GameUICallbacks;

  constructor(scene: Scene, callbacks: GameUICallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
  }

  setRoom(room: GameRoom | null): void {
    this.room = room;
  }

  createUI(playerId: string): void {
    const { width, height } = this.scene.scale;

    // Room info - fixed to camera
    this.scene.add.text(10, 10, `Room: ${this.room?.id || 'Unknown'}`, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0); // Fixed to camera

    this.scene.add.text(10, 40, `Players: ${this.room?.players.length || 0}/${this.room?.maxPlayers || 0}`, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0); // Fixed to camera

    // Controls info - fixed to camera
    this.scene.add.text(10, height - 60, 'Controls:', {
      fontSize: '14px',
      color: '#cccccc'
    }).setScrollFactor(0);

    this.scene.add.text(10, height - 40, 'WASD or Arrow Keys to move', {
      fontSize: '12px',
      color: '#cccccc'
    }).setScrollFactor(0);

    this.scene.add.text(10, height - 20, 'Space for Emergency Meeting', {
      fontSize: '12px',
      color: '#cccccc'
    }).setScrollFactor(0);

    // Add start game button for host (if game not started) - fixed to camera
    if (this.room?.hostPlayerId === playerId && !this.room?.isStarted) {
      const startButton = this.scene.add.rectangle(width - 120, height - 50, 100, 40, 0xff6b6b, 0.8)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.callbacks.onStartGame())
        .on('pointerover', () => startButton.setAlpha(1))
        .on('pointerout', () => startButton.setAlpha(0.8))
        .setScrollFactor(0); // Fixed to camera

      this.scene.add.text(width - 120, height - 50, 'START GAME', {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0.5).setScrollFactor(0); // Fixed to camera
    }

    // Task UI - fixed to camera
    this.tasksCompletedText = this.scene.add.text(width - 10, 10, 'Tasks: 0/0', {
      fontSize: '16px',
      color: '#4ecdc4',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setOrigin(1, 0).setScrollFactor(0); // Fixed to camera

    this.currentTaskText = this.scene.add.text(width / 2, height - 40, '', {
      fontSize: '14px',
      color: '#ffeb3b',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setScrollFactor(0); // Fixed to camera
  }

  updateTaskUI(completedTasks: number, totalTasks: number, nearbyTask: Task | null): void {
    if (this.tasksCompletedText) {
      this.tasksCompletedText.setText(`Tasks: ${completedTasks}/${totalTasks}`);
    }

    // Update current task hint
    if (this.currentTaskText) {
      if (nearbyTask) {
        this.currentTaskText.setText(`Press E to complete ${nearbyTask.type} task`);
        this.currentTaskText.setVisible(true);
      } else {
        this.currentTaskText.setVisible(false);
      }
    }
  }

  showGameEndScreen(winner: string, reason: string): void {
    const { width, height } = this.scene.scale;

    // Create overlay - fixed to camera
    this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
      .setScrollFactor(0);
    
    // Title - fixed to camera
    const titleColor = winner === 'crew' ? '#4ecdc4' : '#ff6b6b';
    const titleText = winner === 'crew' ? 'VICTORY!' : 'DEFEAT!';
    
    this.scene.add.text(width / 2, height / 2 - 100, titleText, {
      fontSize: '48px',
      color: titleColor,
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setScrollFactor(0);

    // Reason - fixed to camera
    this.scene.add.text(width / 2, height / 2 - 30, reason, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setScrollFactor(0);

    // Return to lobby button - fixed to camera
    const returnButton = this.scene.add.rectangle(width / 2, height / 2 + 50, 200, 50, 0x4ecdc4, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.callbacks.onReturnToLobby();
      })
      .on('pointerover', () => returnButton.setAlpha(1))
      .on('pointerout', () => returnButton.setAlpha(0.8))
      .setScrollFactor(0);

    this.scene.add.text(width / 2, height / 2 + 50, 'RETURN TO LOBBY', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setScrollFactor(0);
  }
}