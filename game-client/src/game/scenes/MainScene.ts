import { Scene } from 'phaser';
import { Socket } from 'socket.io-client';
import { 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '@lastlight/shared-networking';
import { Player, GameRoom, Task, GameState } from '@lastlight/shared-models';

export class MainScene extends Scene {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private player: Phaser.Physics.Arcade.Sprite | null = null;
  private otherPlayers: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private otherPlayerGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private otherPlayerNames: Map<string, Phaser.GameObjects.Text> = new Map();
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: any = null;
  
  private playerData: Player | null = null;
  private room: GameRoom | null = null;
  private playerId: string = '';
  private playerName: string = '';
  private gameState: GameState | null = null;
  private taskAreas: Map<string, Phaser.GameObjects.Zone> = new Map();
  private currentTaskText: Phaser.GameObjects.Text | null = null;
  private tasksCompletedText: Phaser.GameObjects.Text | null = null;

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
    // Create player sprite using graphics instead of image
    this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P//PwAFBQIByc4d8gAAAABJRU5ErkJggg==');
  }

  create() {
    const { width, height } = this.scale;

    // Create ship background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);
    
    // Add some basic ship rooms (rectangles)
    this.createShipLayout();

    // Create task areas
    this.createTaskAreas();

    // Setup input
    this.cursors = this.input.keyboard?.createCursorKeys() || null;
    this.wasd = this.input.keyboard?.addKeys('W,S,A,D') || null;

    // Create our player
    this.createPlayer();

    // Create other players
    this.createOtherPlayers();

    // Setup socket listeners
    this.setupSocketListeners();

    // UI elements
    this.createUI();

    // Send initial position to other players
    if (this.player && this.socket) {
      this.socket.emit('game:move', {
        position: { x: this.player.x, y: this.player.y }
      });
    }
  }

  private createShipLayout() {
    const { width, height } = this.scale;

    // Create a large map - 2x larger for good isolation with playability
    this.physics.world.setBounds(0, 0, 4800, 3200);
    
    // Set camera to follow the player
    this.cameras.main.setBounds(0, 0, 4800, 3200);

    // Central Hub - Starting area (center of map)
    const centerX = 2400;
    const centerY = 1600;
    this.add.rectangle(centerX, centerY, 400, 300, 0x555555);
    this.add.text(centerX, centerY, 'CENTRAL HUB', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(centerX, centerY + 30, 'Command Center', { fontSize: '16px', color: '#cccccc' }).setOrigin(0.5);

    // Main corridors from center hub
    // North corridor to power
    this.add.rectangle(centerX, centerY - 400, 120, 800, 0x444444);
    // South corridor to comms
    this.add.rectangle(centerX, centerY + 400, 120, 800, 0x444444);
    // East corridor to oxygen
    this.add.rectangle(centerX + 600, centerY, 1200, 120, 0x444444);
    // West corridor 
    this.add.rectangle(centerX - 600, centerY, 1200, 120, 0x444444);

    // POWER SECTION (North-West)
    const powerSectionX = 800;
    const powerSectionY = 600;
    this.createIsolatedSection(powerSectionX, powerSectionY, 'POWER CORE', 'Reactor Systems', 0xff4444);
    
    // Connecting corridors to power
    this.add.rectangle(1600, 600, 1600, 80, 0x444444);
    this.add.rectangle(2340, 1100, 80, 1000, 0x444444);

    // OXYGEN SECTION (North-East)  
    const oxygenSectionX = 4000;
    const oxygenSectionY = 600;
    this.createIsolatedSection(oxygenSectionX, oxygenSectionY, 'LIFE SUPPORT', 'Atmosphere Control', 0x44ff44);
    
    // Connecting corridors to oxygen
    this.add.rectangle(3200, 600, 1600, 80, 0x444444);
    this.add.rectangle(2460, 1100, 80, 1000, 0x444444);

    // COMMUNICATIONS SECTION (South)
    const commsSectionX = 2400;
    const commsSectionY = 2800;
    this.createIsolatedSection(commsSectionX, commsSectionY, 'COMMUNICATIONS', 'Signal Processing', 0x4444ff);
    
    // Direct corridor south
    this.add.rectangle(centerX, centerY + 600, 80, 1200, 0x444444);

    // Additional sections for navigation and atmosphere
    this.createAtmosphericRoom(1200, 1600, 'Medical Bay', 0x666666);
    this.createAtmosphericRoom(3600, 1600, 'Storage Bay', 0x666666);
    this.createAtmosphericRoom(800, 2400, 'Cafeteria', 0x666666);
    this.createAtmosphericRoom(4000, 2400, 'Engine Room', 0x666666);
    this.createAtmosphericRoom(2400, 800, 'Navigation', 0x666666);
    this.createAtmosphericRoom(400, 1600, 'Security', 0x666666);
    this.createAtmosphericRoom(4400, 1600, 'Laboratory', 0x666666);

    // Add walls/barriers for better navigation
    this.createWalls();
  }

  private createPlayer() {
    const { width, height } = this.scale;
    
    // Create player sprite using graphics instead of image
    // Use center hub as default position (2400, 1600) - center of map
    const defaultX = 2400;
    const defaultY = 1600;
    const startX = (this.playerData?.position.x !== 4800) ? this.playerData?.position.x : defaultX;
    const startY = (this.playerData?.position.y !== 3200) ? this.playerData?.position.y : defaultY;

    // Create a rectangle shape for the player
    this.player = this.physics.add.sprite(startX, startY, null);
    this.player.setDisplaySize(20, 20);
    
    // Create a graphics object for the player appearance
    const graphics = this.add.graphics();
    graphics.fillStyle(0x4ecdc4); // Cyan color
    graphics.fillRect(startX - 10, startY - 10, 20, 20);
    
    // Make the graphics follow the player
    this.physics.world.on('worldstep', () => {
      if (this.player) {
        graphics.clear();
        graphics.fillStyle(0x4ecdc4);
        graphics.fillRect(this.player.x - 10, this.player.y - 10, 20, 20);
      }
    });
    
    // Set collision bounds
    this.player.setCollideWorldBounds(true);
    
    // Set camera to follow this player
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(0.75); // Good zoom level for this map size
    
    // Add player name label
    const nameText = this.add.text(startX, startY - 30, this.playerName, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);

    // Make name follow player
    this.physics.world.on('worldstep', () => {
      if (this.player) {
        nameText.setPosition(this.player.x, this.player.y - 30);
      }
    });
  }

  private createOtherPlayers() {
    if (!this.room) return;

    this.room.players.forEach(playerData => {
      if (playerData.id !== this.playerId) {
        this.createOtherPlayer(playerData);
      }
    });
    
    // Request current positions of all players from server
    if (this.socket) {
      this.socket.emit('game:request-positions');
    }
  }

  private createOtherPlayer(playerData: Player) {
    const sprite = this.physics.add.sprite(
      playerData.position.x, 
      playerData.position.y, 
      null
    );
    sprite.setDisplaySize(20, 20);
    
    // Create graphics for other players
    const graphics = this.add.graphics();
    
    // Add name label
    const nameText = this.add.text(
      playerData.position.x, 
      playerData.position.y - 30, 
      playerData.name, {
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 }
      }
    ).setOrigin(0.5);

    // Store references
    this.otherPlayers.set(playerData.id, sprite);
    this.otherPlayerGraphics.set(playerData.id, graphics);
    this.otherPlayerNames.set(playerData.id, nameText);

    // Update graphics and name position
    this.updateOtherPlayerVisuals(playerData.id);
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('room:player-joined', ({ player }) => {
      console.log('Player joined:', player.name);
      this.createOtherPlayer(player);
      
      // Send our current position to the new player
      if (this.player && this.socket) {
        this.socket.emit('game:move', {
          position: { x: this.player.x, y: this.player.y }
        });
      }
    });

    this.socket.on('room:player-left', ({ playerId }) => {
      console.log('Player left:', playerId);
      const sprite = this.otherPlayers.get(playerId);
      const graphics = this.otherPlayerGraphics.get(playerId);
      const nameText = this.otherPlayerNames.get(playerId);
      
      if (sprite) sprite.destroy();
      if (graphics) graphics.destroy();
      if (nameText) nameText.destroy();
      
      this.otherPlayers.delete(playerId);
      this.otherPlayerGraphics.delete(playerId);
      this.otherPlayerNames.delete(playerId);
    });

    this.socket.on('game:player-moved', ({ playerId, position }) => {
      if (playerId === this.playerId) return; // Don't update our own position

      const sprite = this.otherPlayers.get(playerId);
      if (sprite) {
        // Smooth movement using tweens
        this.tweens.add({
          targets: sprite,
          x: position.x,
          y: position.y,
          duration: 100,
          ease: 'Linear',
          onUpdate: () => {
            this.updateOtherPlayerVisuals(playerId);
          }
        });
      }
    });

    this.socket.on('game:started', ({ gameState }) => {
      console.log('Game started!', gameState);
      this.gameState = gameState;
      this.updateTaskUI();
    });

    this.socket.on('game:task-completed', ({ taskId, playerId }) => {
      console.log('Task completed:', taskId, 'by', playerId);
      if (this.gameState) {
        const task = this.gameState.tasks.find(t => t.id === taskId);
        if (task) {
          task.isCompleted = true;
        }
        this.updateTaskUI();
      }
    });

    this.socket.on('game:updated', ({ gameState }) => {
      this.gameState = gameState;
      this.updateTaskUI();
    });

    this.socket.on('game:ended', ({ winner, reason }) => {
      console.log('Game ended:', winner, reason);
      this.showGameEndScreen(winner, reason);
    });
  }

  private createUI() {
    const { width, height } = this.scale;

    // Room info - fixed to camera
    const roomInfoText = this.add.text(10, 10, `Room: ${this.room?.id || 'Unknown'}`, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0); // Fixed to camera

    const playersText = this.add.text(10, 40, `Players: ${this.room?.players.length || 0}/${this.room?.maxPlayers || 0}`, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0); // Fixed to camera

    // Controls info - fixed to camera
    this.add.text(10, height - 60, 'Controls:', {
      fontSize: '14px',
      color: '#cccccc'
    }).setScrollFactor(0);

    this.add.text(10, height - 40, 'WASD or Arrow Keys to move', {
      fontSize: '12px',
      color: '#cccccc'
    }).setScrollFactor(0);

    this.add.text(10, height - 20, 'Space for Emergency Meeting', {
      fontSize: '12px',
      color: '#cccccc'
    }).setScrollFactor(0);

    // Add start game button for host (if game not started) - fixed to camera
    if (this.room?.hostPlayerId === this.playerId && !this.room?.isStarted) {
      const startButton = this.add.rectangle(width - 120, height - 50, 100, 40, 0xff6b6b, 0.8)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.startGame())
        .on('pointerover', () => startButton.setAlpha(1))
        .on('pointerout', () => startButton.setAlpha(0.8))
        .setScrollFactor(0); // Fixed to camera

      this.add.text(width - 120, height - 50, 'START GAME', {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0.5).setScrollFactor(0); // Fixed to camera
    }

    // Task UI - fixed to camera
    this.tasksCompletedText = this.add.text(width - 10, 10, 'Tasks: 0/0', {
      fontSize: '16px',
      color: '#4ecdc4',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setOrigin(1, 0).setScrollFactor(0); // Fixed to camera

    this.currentTaskText = this.add.text(width / 2, height - 40, '', {
      fontSize: '14px',
      color: '#ffeb3b',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setScrollFactor(0); // Fixed to camera

    this.updateTaskUI();
  }

  update() {
    if (!this.player || !this.cursors) return;

    const speed = 200;
    let moved = false;

    // Reset velocity
    this.player.setVelocity(0);

    // Movement controls
    if (this.cursors.left?.isDown || this.wasd?.A?.isDown) {
      this.player.setVelocityX(-speed);
      moved = true;
    } else if (this.cursors.right?.isDown || this.wasd?.D?.isDown) {
      this.player.setVelocityX(speed);
      moved = true;
    }

    if (this.cursors.up?.isDown || this.wasd?.W?.isDown) {
      this.player.setVelocityY(-speed);
      moved = true;
    } else if (this.cursors.down?.isDown || this.wasd?.S?.isDown) {
      this.player.setVelocityY(speed);
      moved = true;
    }

    // Send position update to server if moved
    if (moved && this.socket) {
      this.socket.emit('game:move', {
        position: { x: this.player.x, y: this.player.y }
      });
    }

    // Check for task interaction (E key)
    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey('E'), 250)) {
      this.checkTaskInteraction();
    }
  }

  private createTaskAreas() {
    // Task areas match the new isolated sections
    const taskConfigs = [
      { id: 'power', x: 800, y: 600, type: 'power' as const },
      { id: 'oxygen', x: 4000, y: 600, type: 'oxygen' as const },
      { id: 'communications', x: 2400, y: 2800, type: 'communications' as const },
    ];

    taskConfigs.forEach(config => {
      const zone = this.add.zone(config.x, config.y, 400, 300);
      zone.setRectangleDropZone(400, 300);
      this.taskAreas.set(config.id, zone);

      // Add task indicator - visible and clear
      const indicator = this.add.circle(config.x, config.y - 80, 20, 0xffeb3b);
      indicator.setStrokeStyle(3, 0xffffff);
      
      // Make indicator blink
      this.tweens.add({
        targets: indicator,
        alpha: 0.3,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });

      // Add task area outline for clarity
      const outline = this.add.rectangle(config.x, config.y, 400, 300, 0xffeb3b, 0.1);
      outline.setStrokeStyle(2, 0xffeb3b, 0.3);
    });
  }

  private checkTaskInteraction() {
    if (!this.player || !this.gameState) return;

    for (const [taskId, zone] of this.taskAreas.entries()) {
      if (zone.getBounds().contains(this.player.x, this.player.y)) {
        const task = this.gameState.tasks.find(t => t.id === taskId);
        if (task && !task.isCompleted) {
          this.performTask(task);
          break;
        }
      }
    }
  }

  private performTask(task: Task) {
    if (!this.socket) return;

    // Show task completion animation
    this.showTaskProgress(task);

    // Emit task completion to server
    this.socket.emit('game:complete-task', {
      taskId: task.id
    });
  }

  private showTaskProgress(task: Task) {
    const { width, height } = this.scale;

    // Create progress bar - fixed to camera
    const progressBg = this.add.rectangle(width / 2, height / 2, 300, 40, 0x000000, 0.8)
      .setScrollFactor(0);
    const progressBar = this.add.rectangle(width / 2 - 140, height / 2, 0, 30, 0x4ecdc4)
      .setScrollFactor(0);
    const progressText = this.add.text(width / 2, height / 2, `Completing ${task.type}...`, {
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0);

    // Animate progress
    this.tweens.add({
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

  private updateTaskUI() {
    if (!this.gameState || !this.tasksCompletedText) return;

    const completedTasks = this.gameState.tasks.filter(t => t.isCompleted).length;
    const totalTasks = this.gameState.tasks.length;
    
    this.tasksCompletedText.setText(`Tasks: ${completedTasks}/${totalTasks}`);

    // Update current task hint
    if (this.currentTaskText) {
      const nearbyTask = this.getNearbyTask();
      if (nearbyTask) {
        this.currentTaskText.setText(`Press E to complete ${nearbyTask.type} task`);
        this.currentTaskText.setVisible(true);
      } else {
        this.currentTaskText.setVisible(false);
      }
    }
  }

  private getNearbyTask(): Task | null {
    if (!this.player || !this.gameState) return null;

    for (const [taskId, zone] of this.taskAreas.entries()) {
      if (zone.getBounds().contains(this.player.x, this.player.y)) {
        const task = this.gameState.tasks.find(t => t.id === taskId);
        if (task && !task.isCompleted) {
          return task;
        }
      }
    }
    return null;
  }

  private showGameEndScreen(winner: string, reason: string) {
    const { width, height } = this.scale;

    // Create overlay - fixed to camera
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
      .setScrollFactor(0);
    
    // Title - fixed to camera
    const titleColor = winner === 'crew' ? '#4ecdc4' : '#ff6b6b';
    const titleText = winner === 'crew' ? 'VICTORY!' : 'DEFEAT!';
    
    this.add.text(width / 2, height / 2 - 100, titleText, {
      fontSize: '48px',
      color: titleColor,
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setScrollFactor(0);

    // Reason - fixed to camera
    this.add.text(width / 2, height / 2 - 30, reason, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setScrollFactor(0);

    // Return to lobby button - fixed to camera
    const returnButton = this.add.rectangle(width / 2, height / 2 + 50, 200, 50, 0x4ecdc4, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.returnToLobby();
      })
      .on('pointerover', () => returnButton.setAlpha(1))
      .on('pointerout', () => returnButton.setAlpha(0.8))
      .setScrollFactor(0);

    this.add.text(width / 2, height / 2 + 50, 'RETURN TO LOBBY', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setScrollFactor(0);
  }

  private startGame() {
    if (!this.socket) return;
    
    console.log('Starting game...');
    this.socket.emit('game:start');
  }

  private returnToLobby() {
    if (this.socket) {
      console.log('Leaving room...');
      this.socket.emit('room:leave');
    }
    this.scene.start('LobbyScene');
  }

  private createIsolatedSection(x: number, y: number, title: string, subtitle: string, accentColor: number) {
    // Large isolated room
    this.add.rectangle(x, y, 400, 300, 0x333333);
    this.add.rectangle(x, y, 380, 280, 0x555555); // Inner area
    
    // Title and subtitle
    this.add.text(x, y - 40, title, { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(x, y - 10, subtitle, { fontSize: '14px', color: '#cccccc' }).setOrigin(0.5);
    
    // Accent elements
    this.add.rectangle(x - 150, y - 100, 100, 20, accentColor);
    this.add.rectangle(x + 150, y - 100, 100, 20, accentColor);
    this.add.rectangle(x - 150, y + 100, 100, 20, accentColor);
    this.add.rectangle(x + 150, y + 100, 100, 20, accentColor);
    
    // Add some detail elements
    this.add.circle(x - 120, y, 30, accentColor, 0.3);
    this.add.circle(x + 120, y, 30, accentColor, 0.3);
  }

  private createAtmosphericRoom(x: number, y: number, name: string, color: number) {
    // Medium sized room for atmosphere/navigation
    this.add.rectangle(x, y, 250, 180, color);
    this.add.text(x, y, name, { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
    
    // Add some detail
    this.add.rectangle(x - 80, y - 50, 60, 20, 0x888888);
    this.add.rectangle(x + 80, y - 50, 60, 20, 0x888888);
  }

  private createWalls() {
    // Add strategic walls to create more isolated areas and interesting navigation
    const wallColor = 0x222222;
    
    // Walls around power section (north-west)
    this.add.rectangle(600, 600, 40, 400, wallColor);
    this.add.rectangle(1000, 600, 40, 400, wallColor);
    this.add.rectangle(800, 400, 400, 40, wallColor);
    this.add.rectangle(800, 800, 400, 40, wallColor);
    
    // Walls around oxygen section (north-east)
    this.add.rectangle(3800, 600, 40, 400, wallColor);
    this.add.rectangle(4200, 600, 40, 400, wallColor);
    this.add.rectangle(4000, 400, 400, 40, wallColor);
    this.add.rectangle(4000, 800, 400, 40, wallColor);
    
    // Walls around communications section (south)
    this.add.rectangle(2200, 2800, 40, 400, wallColor);
    this.add.rectangle(2600, 2800, 40, 400, wallColor);
    this.add.rectangle(2400, 2600, 400, 40, wallColor);
    this.add.rectangle(2400, 3000, 400, 40, wallColor);

    // Additional barrier walls for maze-like navigation
    this.add.rectangle(1800, 1200, 40, 800, wallColor);
    this.add.rectangle(3000, 1200, 40, 800, wallColor);
    this.add.rectangle(1200, 2000, 40, 800, wallColor);
    this.add.rectangle(3600, 2000, 40, 800, wallColor);
  }

  private updateOtherPlayerVisuals(playerId: string) {
    const sprite = this.otherPlayers.get(playerId);
    const graphics = this.otherPlayerGraphics.get(playerId);
    const nameText = this.otherPlayerNames.get(playerId);
    
    if (sprite && graphics && nameText) {
      // Update graphics position
      graphics.clear();
      graphics.fillStyle(0xff6b6b); // Red color for other players
      graphics.fillRect(sprite.x - 10, sprite.y - 10, 20, 20);
      
      // Update name position
      nameText.setPosition(sprite.x, sprite.y - 30);
    }
  }
}