import { Scene } from 'phaser';
import { io, Socket } from 'socket.io-client';
import { 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '@lastlight/shared-networking';

export class LobbyScene extends Scene {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private playerName: string = '';
  private roomId: string = '';
  private roomListContainer: Phaser.GameObjects.Container | null = null;
  private availableRooms: any[] = [];
  private selectedRoomId: string = '';

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
      this.availableRooms = rooms;
      this.updateRoomList();
    });

    this.socket.on('error', ({ message }) => {
      console.error('Server error:', message);
      this.showErrorMessage(message);
    });

    this.socket.on('room:player-joined', ({ player }) => {
      console.log('Player joined room:', player.name);
      // Refresh room list to show updated player count
      this.refreshRooms();
    });

    this.socket.on('room:player-left', ({ playerId }) => {
      console.log('Player left room:', playerId);
      // Refresh room list to show updated player count
      this.refreshRooms();
    });
  }

  private createUI() {
    const { width, height } = this.scale;

    // Player name input (simulated)
    this.add.text(width / 2, 220, 'Enter your name:', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Name input field (placeholder - would need proper input handling)
    const nameInput = this.add.rectangle(width / 2, 260, 300, 40, 0x333333, 0.8);
    const nameText = this.add.text(width / 2, 260, 'Player', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Create Room Button
    const createButton = this.add.rectangle(width / 2, 320, 200, 50, 0xff6b6b, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.createRoom())
      .on('pointerover', () => createButton.setAlpha(1))
      .on('pointerout', () => createButton.setAlpha(0.8));

    this.add.text(width / 2, 320, 'CREATE ROOM', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Refresh Rooms Button
    const refreshButton = this.add.rectangle(width / 2, 380, 200, 40, 0x4ecdc4, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.refreshRooms())
      .on('pointerover', () => refreshButton.setAlpha(1))
      .on('pointerout', () => refreshButton.setAlpha(0.8));

    this.add.text(width / 2, 380, 'REFRESH ROOMS', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Available Rooms Title
    this.add.text(width / 2, 430, 'Available Rooms:', {
      fontSize: '18px',
      color: '#4ecdc4',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Room list container
    this.roomListContainer = this.add.container(width / 2, 480);

    // Join Selected Room Button
    const joinButton = this.add.rectangle(width / 2, height - 80, 200, 50, 0x45b7d1, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.joinSelectedRoom())
      .on('pointerover', () => joinButton.setAlpha(1))
      .on('pointerout', () => joinButton.setAlpha(0.8));

    this.add.text(width / 2, height - 80, 'JOIN SELECTED', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // For now, set default values (in real implementation, these would be user inputs)
    this.playerName = 'Player' + Math.floor(Math.random() * 1000);
    nameText.setText(this.playerName);

    // Request initial room list
    this.refreshRooms();
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

  private refreshRooms() {
    if (!this.socket) return;
    
    console.log('Requesting room list...');
    this.socket.emit('room:list');
  }

  private updateRoomList() {
    if (!this.roomListContainer) return;

    // Clear existing room list
    this.roomListContainer.removeAll(true);

    if (this.availableRooms.length === 0) {
      const noRoomsText = this.add.text(0, 0, 'No rooms available', {
        fontSize: '16px',
        color: '#888888',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0.5);
      this.roomListContainer.add(noRoomsText);
      return;
    }

    // Create room list items
    this.availableRooms.forEach((room, index) => {
      const yPos = index * 60;
      const isJoinable = room.isJoinable;
      const bgColor = isJoinable ? 0x333333 : 0x222222;
      const textColor = isJoinable ? '#ffffff' : '#888888';
      
      // Room container
      const roomBg = this.add.rectangle(0, yPos, 400, 50, bgColor, 0.8);
      
      if (isJoinable) {
        roomBg
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.selectRoom(room.id))
          .on('pointerover', () => roomBg.setFillStyle(0x444444))
          .on('pointerout', () => {
            if (this.selectedRoomId !== room.id) {
              roomBg.setFillStyle(bgColor);
            }
          });
      }

      // Room name and info
      const roomText = this.add.text(-180, yPos - 8, room.name || `Room ${room.id}`, {
        fontSize: '16px',
        color: textColor,
        fontFamily: 'Arial, sans-serif'
      });

      const playersText = this.add.text(-180, yPos + 8, `Players: ${room.playerCount}/${room.maxPlayers}`, {
        fontSize: '12px',
        color: isJoinable ? '#cccccc' : '#666666',
        fontFamily: 'Arial, sans-serif'
      });

      let statusColor = '#888888';
      if (room.status === 'playing') {
        statusColor = '#ff6b6b';
      } else if (room.status === 'waiting' && isJoinable) {
        statusColor = '#4ecdc4';
      }

      const statusText = this.add.text(140, yPos, room.status || 'waiting', {
        fontSize: '14px',
        color: statusColor,
        fontFamily: 'Arial, sans-serif'
      });

      // Add full indicator if needed
      if (room.playerCount >= room.maxPlayers && room.status !== 'playing') {
        const fullText = this.add.text(140, yPos + 15, '(FULL)', {
          fontSize: '10px',
          color: '#ff6b6b',
          fontFamily: 'Arial, sans-serif'
        });
        this.roomListContainer.add(fullText);
      }

      // Add to container
      this.roomListContainer.add([roomBg, roomText, playersText, statusText]);

      // Highlight selected room
      if (this.selectedRoomId === room.id && isJoinable) {
        roomBg.setFillStyle(0x4ecdc4, 0.6);
      }
    });
  }

  private selectRoom(roomId: string) {
    this.selectedRoomId = roomId;
    this.updateRoomList(); // Refresh to show selection
    console.log('Selected room:', roomId);
  }

  private joinSelectedRoom() {
    if (!this.selectedRoomId) {
      this.showErrorMessage('Please select a room to join');
      return;
    }

    // Check if selected room is still joinable
    const selectedRoom = this.availableRooms.find(room => room.id === this.selectedRoomId);
    if (!selectedRoom) {
      this.showErrorMessage('Selected room no longer exists');
      this.selectedRoomId = '';
      this.refreshRooms();
      return;
    }

    if (!selectedRoom.isJoinable) {
      this.showErrorMessage('Room is not joinable (full or game started)');
      return;
    }

    if (!this.socket || !this.playerName) return;

    console.log('Joining selected room:', this.selectedRoomId);
    this.socket.emit('room:join', {
      roomId: this.selectedRoomId,
      playerName: this.playerName
    });
  }

  private showErrorMessage(message: string) {
    const { width, height } = this.scale;
    
    // Create error message overlay
    const errorBg = this.add.rectangle(width / 2, height / 2, 400, 150, 0x000000, 0.8);
    const errorText = this.add.text(width / 2, height / 2 - 20, message, {
      fontSize: '16px',
      color: '#ff6b6b',
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      wordWrap: { width: 350 }
    }).setOrigin(0.5);
    
    const okButton = this.add.rectangle(width / 2, height / 2 + 40, 100, 30, 0xff6b6b, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        errorBg.destroy();
        errorText.destroy();
        okButton.destroy();
        okText.destroy();
      });
    
    const okText = this.add.text(width / 2, height / 2 + 40, 'OK', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Auto-dismiss after 3 seconds
    this.time.delayedCall(3000, () => {
      if (errorBg.active) {
        errorBg.destroy();
        errorText.destroy();
        okButton.destroy();
        okText.destroy();
      }
    });
  }
}