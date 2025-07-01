import { Scene } from 'phaser';
import { Socket } from 'socket.io-client';
import { 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '@./shared/networking';
import { Player, GameRoom } from '@./shared/models';

export class MainScene extends Scene {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private player: Phaser.Physics.Arcade.Sprite | null = null;
  private otherPlayers: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: any = null;
  
  private playerData: Player | null = null;
  private room: GameRoom | null = null;
  private playerId: string = '';
  private playerName: string = '';

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
  }

  private createShipLayout() {
    const { width, height } = this.scale;

    // Main corridor (horizontal)
    this.add.rectangle(width / 2, height / 2, width * 0.8, 80, 0x444444);

    // Rooms
    const roomWidth = 150;
    const roomHeight = 120;
    const roomColor = 0x666666;

    // Top rooms
    this.add.rectangle(200, 200, roomWidth, roomHeight, roomColor);
    this.add.rectangle(400, 200, roomWidth, roomHeight, roomColor);
    this.add.rectangle(600, 200, roomWidth, roomHeight, roomColor);
    this.add.rectangle(800, 200, roomWidth, roomHeight, roomColor);

    // Bottom rooms
    this.add.rectangle(200, 560, roomWidth, roomHeight, roomColor);
    this.add.rectangle(400, 560, roomWidth, roomHeight, roomColor);
    this.add.rectangle(600, 560, roomWidth, roomHeight, roomColor);
    this.add.rectangle(800, 560, roomWidth, roomHeight, roomColor);

    // Room labels
    this.add.text(200, 200, 'Power', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(400, 200, 'O2', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(600, 200, 'Comms', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(800, 200, 'Nav', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);

    this.add.text(200, 560, 'Medical', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(400, 560, 'Cafeteria', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(600, 560, 'Storage', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(800, 560, 'Engine', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
  }

  private createPlayer() {
    const { width, height } = this.scale;
    
    // Create player sprite using graphics instead of image
    const startX = this.playerData?.position.x || width / 2;
    const startY = this.playerData?.position.y || height / 2;

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
    graphics.fillStyle(0xff6b6b); // Red color for other players
    graphics.fillRect(playerData.position.x - 10, playerData.position.y - 10, 20, 20);
    
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

    // Store reference
    this.otherPlayers.set(playerData.id, sprite);

    // Make name follow player
    this.physics.world.on('worldstep', () => {
      nameText.setPosition(sprite.x, sprite.y - 30);
    });
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('room:player-joined', ({ player }) => {
      console.log('Player joined:', player.name);
      this.createOtherPlayer(player);
    });

    this.socket.on('room:player-left', ({ playerId }) => {
      console.log('Player left:', playerId);
      const sprite = this.otherPlayers.get(playerId);
      if (sprite) {
        sprite.destroy();
        this.otherPlayers.delete(playerId);
      }
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
          ease: 'Linear'
        });
      }
    });

    this.socket.on('game:started', ({ gameState }) => {
      console.log('Game started!', gameState);
      // TODO: Handle game start
    });
  }

  private createUI() {
    const { width, height } = this.scale;

    // Room info
    this.add.text(10, 10, `Room: ${this.room?.id || 'Unknown'}`, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });

    this.add.text(10, 40, `Players: ${this.room?.players.length || 0}/${this.room?.maxPlayers || 0}`, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });

    // Controls info
    this.add.text(10, height - 60, 'Controls:', {
      fontSize: '14px',
      color: '#cccccc'
    });

    this.add.text(10, height - 40, 'WASD or Arrow Keys to move', {
      fontSize: '12px',
      color: '#cccccc'
    });

    this.add.text(10, height - 20, 'Space for Emergency Meeting', {
      fontSize: '12px',
      color: '#cccccc'
    });
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
  }
}