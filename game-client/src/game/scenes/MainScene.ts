import { Scene } from 'phaser';
import { Socket } from 'socket.io-client';
import { 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '@lastlight/shared-networking';
import { Player, GameRoom, GameState } from '@lastlight/shared-models';
import { ShipLayoutManager } from '../managers/ShipLayoutManager.js';
import { PlayerManager } from '../managers/PlayerManager.js';
import { TaskManager, TaskManagerCallbacks } from '../managers/TaskManager.js';
import { GameSocketManager, GameSocketCallbacks } from '../managers/GameSocketManager.js';
import { GameUI, GameUICallbacks } from '../ui/GameUI.js';
import { WallCollisionManager } from '../managers/WallCollisionManager.js';

export class MainScene extends Scene implements TaskManagerCallbacks, GameSocketCallbacks, GameUICallbacks {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: any = null;
  
  private playerData: Player | null = null;
  private room: GameRoom | null = null;
  private playerId: string = '';
  private playerName: string = '';
  private gameState: GameState | null = null;

  // Managers
  private shipLayoutManager!: ShipLayoutManager;
  private playerManager!: PlayerManager;
  private taskManager!: TaskManager;
  private gameSocketManager!: GameSocketManager;
  private gameUI!: GameUI;
  private wallCollisionManager!: WallCollisionManager;

  constructor() {
    super({ key: 'MainScene' });
  }

  init(data: any) {
    this.socket = data.socket;
    this.room = data.room;
    this.playerId = data.playerId;
    this.playerName = data.playerName;
    
    // Find our player data
    this.playerData = this.room?.players.find(p => p.id === this.playerId) || null;
  }

  preload() {
    // Load the astronaut sprite sheet
    this.load.spritesheet('astronaut', 'assets/sprites/p1_sprite_sheet.png', {
      frameWidth: 80,
      frameHeight: 80
    });
  }

  create() {
    const { width, height } = this.scale;

    // Create ship background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);
    
    // Initialize managers
    this.shipLayoutManager = new ShipLayoutManager(this);
    this.playerManager = new PlayerManager(this);
    this.taskManager = new TaskManager(this, this);
    this.gameUI = new GameUI(this, this);
    this.wallCollisionManager = new WallCollisionManager(this);

    if (this.socket) {
      this.gameSocketManager = new GameSocketManager(this.socket, this, this.playerId);
    }

    // Initialize player manager with data
    this.playerManager.initialize(this.playerData, this.playerId, this.playerName);

    // Create ship layout and walls
    this.shipLayoutManager.createShipLayout();
    this.wallCollisionManager.createWalls();

    // Create task areas
    this.taskManager.createTaskAreas();

    // Create animations and player
    this.playerManager.createAnimations();
    const player = this.playerManager.createPlayer();
    
    // Setup physics collisions
    this.wallCollisionManager.setupCollisions(player, this.playerManager.getOtherPlayers());

    // Create other players and request positions
    this.createOtherPlayers();
    this.gameSocketManager?.requestPlayerPositions();

    // Setup input
    this.cursors = this.input.keyboard?.createCursorKeys() || null;
    this.wasd = this.input.keyboard?.addKeys('W,S,A,D') || null;

    // Create UI
    this.gameUI.setRoom(this.room);
    this.gameUI.createUI(this.playerId);

    // Send initial position to other players
    const playerSprite = this.playerManager.getPlayer();
    if (playerSprite && this.gameSocketManager) {
      this.gameSocketManager.sendCurrentPosition({ x: playerSprite.x, y: playerSprite.y });
    }
  }

  // Callback implementations
  // TaskManagerCallbacks
  onTaskComplete(taskId: string): void {
    this.gameSocketManager?.emitTaskComplete(taskId);
  }

  // GameSocketCallbacks
  onPlayerJoined(player: Player): void {
    this.playerManager.createOtherPlayer(player);
    this.wallCollisionManager.addCollisionForPlayer(this.playerManager.getOtherPlayers().get(player.id)!);
    
    // Send our current position to the new player
    const playerSprite = this.playerManager.getPlayer();
    if (playerSprite && this.gameSocketManager) {
      this.gameSocketManager.sendCurrentPosition({ x: playerSprite.x, y: playerSprite.y });
    }
  }

  onPlayerLeft(playerId: string): void {
    this.playerManager.removeOtherPlayer(playerId);
  }

  onPlayerMoved(playerId: string, position: { x: number; y: number }): void {
    this.playerManager.moveOtherPlayer(playerId, position);
  }

  onGameStarted(gameState: GameState): void {
    this.gameState = gameState;
    this.taskManager.setGameState(gameState);
    this.updateTaskUI();
  }

  onTaskCompleted(taskId: string, playerId: string): void {
    if (this.gameState) {
      const task = this.gameState.tasks.find(t => t.id === taskId);
      if (task) {
        task.isCompleted = true;
      }
      this.updateTaskUI();
    }
  }

  onGameEnded(winner: string, reason: string): void {
    this.gameUI.showGameEndScreen(winner, reason);
  }

  // GameUICallbacks
  onStartGame(): void {
    this.gameSocketManager?.emitGameStart();
  }

  onReturnToLobby(): void {
    this.gameSocketManager?.emitLeaveRoom();
    this.scene.start('LobbyScene');
  }

  private createOtherPlayers(): void {
    if (!this.room) return;

    this.room.players.forEach(playerData => {
      if (playerData.id !== this.playerId) {
        this.playerManager.createOtherPlayer(playerData);
        const otherPlayer = this.playerManager.getOtherPlayers().get(playerData.id);
        if (otherPlayer) {
          this.wallCollisionManager.addCollisionForPlayer(otherPlayer);
        }
      }
    });
  }

  private updateTaskUI(): void {
    const { completed, total } = this.taskManager.getCompletedTasksCount();
    const nearbyTask = this.taskManager.getNearbyTask(this.playerManager.getPlayer()!);
    this.gameUI.updateTaskUI(completed, total, nearbyTask);
  }

  override update(): void {
    const player = this.playerManager.getPlayer();
    if (!player || !this.cursors) return;

    const speed = 200;
    let moved = false;
    let velocityX = 0;
    let velocityY = 0;

    // Movement controls
    if (this.cursors.left?.isDown || this.wasd?.A?.isDown) {
      velocityX = -speed;
      moved = true;
    } else if (this.cursors.right?.isDown || this.wasd?.D?.isDown) {
      velocityX = speed;
      moved = true;
    }

    if (this.cursors.up?.isDown || this.wasd?.W?.isDown) {
      velocityY = -speed;
      moved = true;
    } else if (this.cursors.down?.isDown || this.wasd?.S?.isDown) {
      velocityY = speed;
      moved = true;
    }

    // Apply velocity
    player.setVelocity(velocityX, velocityY);

    // Update animation based on movement direction
    if (moved) {
      this.playerManager.updatePlayerAnimation(velocityX, velocityY);
    } else {
      // Stop animation when not moving but keep facing direction
      this.playerManager.stopPlayerAnimation();
    }

    // Send position update to server if moved
    if (moved && this.gameSocketManager) {
      this.gameSocketManager.emitMove({ x: player.x, y: player.y });
    }

    // Check for task interaction (E key)
    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey('E'), 250)) {
      this.taskManager.checkTaskInteraction(player);
    }
  }
}