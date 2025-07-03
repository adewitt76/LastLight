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
  private otherPlayerNames: Map<string, Phaser.GameObjects.Text> = new Map();
  private walls: Phaser.Physics.Arcade.StaticGroup;
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
    // Load the astronaut sprite sheet
    this.load.spritesheet('astronaut', 'assets/p1_sprite_sheet.png', {
      frameWidth: 80,
      frameHeight: 80
    });
  }

  create() {
    const { width, height } = this.scale;

    // Create ship background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);
    
    // Add some basic ship rooms (rectangles)
    this.createShipLayout();

    // Create task areas
    this.createTaskAreas();

    // Create animations for all 8 directions
    this.createAnimations();

    // Setup input
    this.cursors = this.input.keyboard?.createCursorKeys() || null;
    this.wasd = this.input.keyboard?.addKeys('W,S,A,D') || null;

    // Create our player
    this.createPlayer();
    
    // Setup physics collisions after player is created
    this.setupCollisions();

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

  private createAnimations() {
    // Create walking animations for all 8 directions (clockwise from North)
    // Row 0: North (back view)
    this.anims.create({
      key: 'walk-north',
      frames: this.anims.generateFrameNumbers('astronaut', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Row 1: Northwest (back-left angle)
    this.anims.create({
      key: 'walk-northwest',
      frames: this.anims.generateFrameNumbers('astronaut', { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Row 2: West (left side view)
    this.anims.create({
      key: 'walk-west',
      frames: this.anims.generateFrameNumbers('astronaut', { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Row 3: Southwest (front-left angle)
    this.anims.create({
      key: 'walk-southwest',
      frames: this.anims.generateFrameNumbers('astronaut', { start: 12, end: 15 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Row 4: South (front view with visor)
    this.anims.create({
      key: 'walk-south',
      frames: this.anims.generateFrameNumbers('astronaut', { start: 16, end: 19 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Row 5: Southeast (front-right angle)
    this.anims.create({
      key: 'walk-southeast',
      frames: this.anims.generateFrameNumbers('astronaut', { start: 20, end: 23 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Row 6: East (right side view)
    this.anims.create({
      key: 'walk-east',
      frames: this.anims.generateFrameNumbers('astronaut', { start: 24, end: 27 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Row 7: Northeast (back-right angle)
    this.anims.create({
      key: 'walk-northeast',
      frames: this.anims.generateFrameNumbers('astronaut', { start: 28, end: 31 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Idle animations (first frame of each direction)
    this.anims.create({
      key: 'idle-north',
      frames: [{ key: 'astronaut', frame: 0 }],
      frameRate: 1
    });
    
    this.anims.create({
      key: 'idle-south',
      frames: [{ key: 'astronaut', frame: 16 }],
      frameRate: 1
    });
    
    this.anims.create({
      key: 'idle-west',
      frames: [{ key: 'astronaut', frame: 8 }],
      frameRate: 1
    });
    
    this.anims.create({
      key: 'idle-east',
      frames: [{ key: 'astronaut', frame: 24 }],
      frameRate: 1
    });
  }

  private createPlayer() {
    const { width, height } = this.scale;
    
    // Use center hub as default position (2400, 1600) - center of map
    const defaultX = 2400;
    const defaultY = 1600;
    const startX = (this.playerData?.position.x !== 4800) ? this.playerData?.position.x : defaultX;
    const startY = (this.playerData?.position.y !== 3200) ? this.playerData?.position.y : defaultY;

    // Create player sprite using the astronaut sprite sheet
    this.player = this.physics.add.sprite(startX, startY, 'astronaut');
    this.player.setDisplaySize(120, 120); // 1.5x larger than previous size
    
    // Set physics body properties
    this.player.body.setSize(25, 48); // Width 25 pixels, height reduced by half
    this.player.body.setCollideWorldBounds(true);
    
    // Start with idle south animation
    this.player.play('idle-south');
    
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
      'astronaut'
    );
    sprite.setDisplaySize(120, 120); // Same as main player - 1.5x larger
    
    // Set physics body properties
    sprite.body.setSize(25, 48); // Width 25 pixels, height reduced by half
    sprite.body.setCollideWorldBounds(true);
    
    // Start with idle south animation
    sprite.play('idle-south');
    
    // Set different tint for other players
    sprite.setTint(0xff6b6b); // Red tint
    
    // Add collision with walls if walls exist
    if (this.walls) {
      this.physics.add.collider(sprite, this.walls);
    }
    
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
    this.otherPlayerNames.set(playerData.id, nameText);

    // Update name position
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
      const nameText = this.otherPlayerNames.get(playerId);
      
      if (sprite) sprite.destroy();
      if (nameText) nameText.destroy();
      
      this.otherPlayers.delete(playerId);
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
    this.player.setVelocity(velocityX, velocityY);

    // Update animation based on movement direction
    if (moved) {
      this.updatePlayerAnimation(velocityX, velocityY);
    } else {
      // Stop animation when not moving but keep facing direction
      this.player.anims.stop();
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

  private updatePlayerAnimation(velocityX: number, velocityY: number) {
    if (!this.player) return;

    // Determine direction based on velocity
    const angle = Math.atan2(velocityY, velocityX);
    const degrees = (angle * 180) / Math.PI;
    
    // Convert angle to 8-direction animation
    let animKey = 'walk-south'; // default
    
    if (degrees >= -22.5 && degrees < 22.5) {
      animKey = 'walk-east';
    } else if (degrees >= 22.5 && degrees < 67.5) {
      animKey = 'walk-southeast';
    } else if (degrees >= 67.5 && degrees < 112.5) {
      animKey = 'walk-south';
    } else if (degrees >= 112.5 && degrees < 157.5) {
      animKey = 'walk-southwest';
    } else if (degrees >= 157.5 || degrees < -157.5) {
      animKey = 'walk-west';
    } else if (degrees >= -157.5 && degrees < -112.5) {
      animKey = 'walk-northwest';
    } else if (degrees >= -112.5 && degrees < -67.5) {
      animKey = 'walk-north';
    } else if (degrees >= -67.5 && degrees < -22.5) {
      animKey = 'walk-northeast';
    }

    // Only change animation if it's different from current
    if (this.player.anims.currentAnim?.key !== animKey) {
      this.player.play(animKey);
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
    // Initialize static physics group for walls
    this.walls = this.physics.add.staticGroup();
    const wallColor = 0x222222;
    
    // POWER SECTION MAZE (North-West) - 2 entrances minimum
    // Outer walls with entrance gaps
    this.createWallSegment(580, 500, 40, 200, wallColor); // Left wall (top half)
    this.createWallSegment(580, 750, 40, 150, wallColor); // Left wall (bottom half) - GAP for entrance
    this.createWallSegment(1020, 500, 40, 200, wallColor); // Right wall (top half)
    this.createWallSegment(1020, 750, 40, 150, wallColor); // Right wall (bottom half) - GAP for entrance
    this.createWallSegment(650, 380, 300, 40, wallColor); // Top wall (left)
    this.createWallSegment(950, 380, 100, 40, wallColor); // Top wall (right) - GAP for entrance
    this.createWallSegment(600, 820, 400, 40, wallColor); // Bottom wall
    
    // Internal maze walls in power section
    this.createWallSegment(720, 500, 40, 160, wallColor); // Internal vertical wall
    this.createWallSegment(880, 640, 40, 140, wallColor); // Internal vertical wall
    this.createWallSegment(740, 580, 100, 40, wallColor); // Internal horizontal wall
    
    // OXYGEN SECTION MAZE (North-East) - 2 entrances minimum
    // Outer walls with entrance gaps
    this.createWallSegment(3780, 500, 40, 200, wallColor); // Left wall (top half)
    this.createWallSegment(3780, 750, 40, 150, wallColor); // Left wall (bottom half) - GAP for entrance
    this.createWallSegment(4220, 500, 40, 200, wallColor); // Right wall (top half) 
    this.createWallSegment(4220, 750, 40, 150, wallColor); // Right wall (bottom half) - GAP for entrance
    this.createWallSegment(3850, 380, 300, 40, wallColor); // Top wall (left)
    this.createWallSegment(4150, 380, 100, 40, wallColor); // Top wall (right) - GAP for entrance
    this.createWallSegment(3800, 820, 400, 40, wallColor); // Bottom wall
    
    // Internal maze walls in oxygen section
    this.createWallSegment(3920, 500, 40, 160, wallColor); // Internal vertical wall
    this.createWallSegment(4080, 640, 40, 140, wallColor); // Internal vertical wall
    this.createWallSegment(3940, 580, 100, 40, wallColor); // Internal horizontal wall
    
    // COMMUNICATIONS SECTION MAZE (South) - 2 entrances minimum
    // Outer walls with entrance gaps
    this.createWallSegment(2180, 2700, 40, 200, wallColor); // Left wall (top half)
    this.createWallSegment(2180, 2950, 40, 150, wallColor); // Left wall (bottom half) - GAP for entrance
    this.createWallSegment(2620, 2700, 40, 200, wallColor); // Right wall (top half)
    this.createWallSegment(2620, 2950, 40, 150, wallColor); // Right wall (bottom half) - GAP for entrance
    this.createWallSegment(2200, 2580, 400, 40, wallColor); // Top wall
    this.createWallSegment(2250, 3020, 300, 40, wallColor); // Bottom wall (left)
    this.createWallSegment(2550, 3020, 100, 40, wallColor); // Bottom wall (right) - GAP for entrance
    
    // Internal maze walls in communications section
    this.createWallSegment(2320, 2700, 40, 160, wallColor); // Internal vertical wall
    this.createWallSegment(2480, 2840, 40, 140, wallColor); // Internal vertical wall
    this.createWallSegment(2340, 2780, 100, 40, wallColor); // Internal horizontal wall

    // CORRIDOR MAZE WALLS - Create strategic bottlenecks and alternate paths
    // Central hub protection walls
    this.createWallSegment(2300, 1400, 40, 200, wallColor); // Hub left barrier
    this.createWallSegment(2500, 1400, 40, 200, wallColor); // Hub right barrier
    this.createWallSegment(2200, 1500, 200, 40, wallColor); // Hub top barrier
    this.createWallSegment(2500, 1700, 200, 40, wallColor); // Hub bottom barrier
    
    // Main corridor divisions - create multiple paths
    this.createWallSegment(1600, 1000, 40, 400, wallColor); // West division wall
    this.createWallSegment(3200, 1000, 40, 400, wallColor); // East division wall
    this.createWallSegment(1000, 1800, 800, 40, wallColor); // Southwest horizontal wall
    this.createWallSegment(3000, 1800, 800, 40, wallColor); // Southeast horizontal wall
    
    // Secondary room connection walls - force specific routing
    this.createWallSegment(800, 1400, 40, 400, wallColor); // Medical bay isolation
    this.createWallSegment(4000, 1400, 40, 400, wallColor); // Storage bay isolation
    this.createWallSegment(1200, 2200, 40, 400, wallColor); // Cafeteria access control
    this.createWallSegment(3600, 2200, 40, 400, wallColor); // Engine room access control
    
    // Maze connectors - strategic chokepoints with alternate routes
    this.createWallSegment(1400, 1200, 200, 40, wallColor); // Northwest connector
    this.createWallSegment(3400, 1200, 200, 40, wallColor); // Northeast connector
    this.createWallSegment(1400, 2400, 200, 40, wallColor); // Southwest connector
    this.createWallSegment(3400, 2400, 200, 40, wallColor); // Southeast connector
  }
  
  private createWallSegment(x: number, y: number, width: number, height: number, color: number) {
    // Create visual wall
    const wallGraphic = this.add.rectangle(x, y, width, height, color);
    
    // Create physics wall using static sprite with proper sizing
    const wallBody = this.physics.add.staticSprite(x, y, null);
    wallBody.setVisible(false); // Hide the physics sprite
    
    // IMPORTANT: Set display size first, then body size
    wallBody.setDisplaySize(width, height);
    wallBody.body.setSize(width, height, true); // true = center the body
    wallBody.refreshBody(); // Apply changes to static body
    
    // Add to walls group
    this.walls.add(wallBody);
  }
  
  private setupCollisions() {
    if (this.player && this.walls) {
      // Player collides with walls
      this.physics.add.collider(this.player, this.walls);
      
      // Other players collide with walls too
      this.otherPlayers.forEach(otherPlayer => {
        if (otherPlayer.body) {
          this.physics.add.collider(otherPlayer, this.walls);
        }
      });
    }
  }

  private updateOtherPlayerVisuals(playerId: string) {
    const sprite = this.otherPlayers.get(playerId);
    const nameText = this.otherPlayerNames.get(playerId);
    
    if (sprite && nameText) {
      // Update name position
      nameText.setPosition(sprite.x, sprite.y - 30);
    }
  }
}