import { Scene } from 'phaser';
import { io, Socket } from 'socket.io-client';
import { 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '@./shared/networking';

export class LobbyScene extends Scene {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private playerName: string = '';
  private roomId: string = '';

  constructor() {
    super({ key: 'LobbyScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f0f23);

    // Title
    this.add.text(width / 2, 100, 'LAST LIGHT', {
      fontSize: '48px',
      color: '#ff6b6b',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, 160, 'Deep Space Colony Ship', {
      fontSize: '18px',
      color: '#4ecdc4',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Connect to server
    this.connectToServer();

    // Create UI elements
    this.createUI();
  }

  private connectToServer() {
    const serverUrl = 'http://localhost:3001';
    this.socket = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('room:created', ({ room, playerId }) => {
      console.log('Room created:', room.id);
      this.scene.start('MainScene', { 
        socket: this.socket, 
        room, 
        playerId,
        playerName: this.playerName 
      });
    });

    this.socket.on('room:joined', ({ room, playerId }) => {
      console.log('Joined room:', room.id);
      this.scene.start('MainScene', { 
        socket: this.socket, 
        room, 
        playerId,
        playerName: this.playerName 
      });
    });

    this.socket.on('room:list', ({ rooms }) => {
      console.log('Available rooms:', rooms);
      // TODO: Update room list UI
    });

    this.socket.on('error', ({ message }) => {
      console.error('Server error:', message);
      // TODO: Show error message to user
    });
  }

  private createUI() {
    const { width, height } = this.scale;

    // Player name input (simulated)
    this.add.text(width / 2, 250, 'Enter your name:', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Name input field (placeholder - would need proper input handling)
    const nameInput = this.add.rectangle(width / 2, 290, 300, 40, 0x333333, 0.8);
    const nameText = this.add.text(width / 2, 290, 'Player', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Create Room Button
    const createButton = this.add.rectangle(width / 2 - 100, 380, 180, 50, 0xff6b6b, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.createRoom())
      .on('pointerover', () => createButton.setAlpha(1))
      .on('pointerout', () => createButton.setAlpha(0.8));

    this.add.text(width / 2 - 100, 380, 'CREATE ROOM', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Join Room Button
    const joinButton = this.add.rectangle(width / 2 + 100, 380, 180, 50, 0x4ecdc4, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.joinRoom())
      .on('pointerover', () => joinButton.setAlpha(1))
      .on('pointerout', () => joinButton.setAlpha(0.8));

    this.add.text(width / 2 + 100, 380, 'JOIN ROOM', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Room ID input (simulated)
    this.add.text(width / 2, 450, 'Room ID (for joining):', {
      fontSize: '16px',
      color: '#cccccc',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    const roomInput = this.add.rectangle(width / 2, 480, 200, 30, 0x333333, 0.8);
    const roomText = this.add.text(width / 2, 480, 'ABC123', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // For now, set default values (in real implementation, these would be user inputs)
    this.playerName = 'Player' + Math.floor(Math.random() * 1000);
    this.roomId = 'ABC123';
    nameText.setText(this.playerName);
  }

  private createRoom() {
    if (!this.socket || !this.playerName) return;

    console.log('Creating room...');
    this.socket.emit('room:create', {
      roomName: `${this.playerName}'s Room`,
      playerName: this.playerName,
      maxPlayers: 6
    });
  }

  private joinRoom() {
    if (!this.socket || !this.playerName || !this.roomId) return;

    console.log('Joining room:', this.roomId);
    this.socket.emit('room:join', {
      roomId: this.roomId,
      playerName: this.playerName
    });
  }
}