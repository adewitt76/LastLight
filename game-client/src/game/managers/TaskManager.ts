import { Scene } from 'phaser';
import { Task, GameState } from '@lastlight/shared-models';

export interface TaskManagerCallbacks {
  onTaskComplete: (taskId: string) => void;
}

export class TaskManager {
  private scene: Scene;
  private taskAreas: Map<string, Phaser.GameObjects.Zone> = new Map();
  private callbacks: TaskManagerCallbacks;
  private gameState: GameState | null = null;

  constructor(scene: Scene, callbacks: TaskManagerCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
  }

  setGameState(gameState: GameState | null): void {
    this.gameState = gameState;
  }

  createTaskAreas(): void {
    // Task areas match the isolated sections
    const taskConfigs = [
      { id: 'power', x: 800, y: 600, type: 'power' as const },
      { id: 'oxygen', x: 4000, y: 600, type: 'oxygen' as const },
      { id: 'communications', x: 2400, y: 2800, type: 'communications' as const },
    ];

    taskConfigs.forEach(config => {
      const zone = this.scene.add.zone(config.x, config.y, 400, 300);
      zone.setRectangleDropZone(400, 300);
      this.taskAreas.set(config.id, zone);

      // Add task indicator - visible and clear
      const indicator = this.scene.add.circle(config.x, config.y - 80, 20, 0xffeb3b);
      indicator.setStrokeStyle(3, 0xffffff);
      
      // Make indicator blink
      this.scene.tweens.add({
        targets: indicator,
        alpha: 0.3,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });

      // Add task area outline for clarity
      const outline = this.scene.add.rectangle(config.x, config.y, 400, 300, 0xffeb3b, 0.1);
      outline.setStrokeStyle(2, 0xffeb3b, 0.3);
    });
  }

  checkTaskInteraction(player: Phaser.Physics.Arcade.Sprite): void {
    if (!player || !this.gameState) return;

    for (const [taskId, zone] of Array.from(this.taskAreas.entries())) {
      if (zone.getBounds().contains(player.x, player.y)) {
        const task = this.gameState.tasks.find(t => t.id === taskId);
        if (task && !task.isCompleted) {
          this.performTask(task);
          break;
        }
      }
    }
  }

  getNearbyTask(player: Phaser.Physics.Arcade.Sprite): Task | null {
    if (!player || !this.gameState) return null;

    for (const [taskId, zone] of Array.from(this.taskAreas.entries())) {
      if (zone.getBounds().contains(player.x, player.y)) {
        const task = this.gameState.tasks.find(t => t.id === taskId);
        if (task && !task.isCompleted) {
          return task;
        }
      }
    }
    return null;
  }

  getCompletedTasksCount(): { completed: number; total: number } {
    if (!this.gameState) return { completed: 0, total: 0 };
    
    const completedTasks = this.gameState.tasks.filter(t => t.isCompleted).length;
    const totalTasks = this.gameState.tasks.length;
    
    return { completed: completedTasks, total: totalTasks };
  }

  private performTask(task: Task): void {
    // Show task completion animation
    this.showTaskProgress(task);

    // Emit task completion to callback
    this.callbacks.onTaskComplete(task.id);
  }

  private showTaskProgress(task: Task): void {
    const { width, height } = this.scene.scale;

    // Create progress bar - fixed to camera
    const progressBg = this.scene.add.rectangle(width / 2, height / 2, 300, 40, 0x000000, 0.8)
      .setScrollFactor(0);
    const progressBar = this.scene.add.rectangle(width / 2 - 140, height / 2, 0, 30, 0x4ecdc4)
      .setScrollFactor(0);
    const progressText = this.scene.add.text(width / 2, height / 2, `Completing ${task.type}...`, {
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0);

    // Animate progress
    this.scene.tweens.add({
      targets: progressBar,
      width: 280,
      duration: 2000,
      ease: 'Linear',
      onComplete: () => {
        // Clean up
        progressBg.destroy();
        progressBar.destroy();
        progressText.destroy();
      }
    });
  }
}