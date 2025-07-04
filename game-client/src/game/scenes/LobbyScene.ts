import { Scene } from 'phaser';
import { LobbyUI } from '../ui/LobbyUI.js';
import { LobbySocketManager, LobbySocketCallbacks } from '../managers/LobbySocketManager.js';
import { RoomListManager } from '../managers/RoomListManager.js';
import { GameRoom, Player } from '@lastlight/shared-models';

export class LobbyScene extends Scene implements LobbySocketCallbacks {
  private lobbyUI!: LobbyUI;
  private socketManager!: LobbySocketManager;
  private roomListManager!: RoomListManager;
  private playerName: string = '';

  constructor() {
    super({ key: 'LobbyScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f0f23);

    // Initialize managers
    this.lobbyUI = new LobbyUI(this);
    this.socketManager = new LobbySocketManager(this);
    this.roomListManager = new RoomListManager(this);

    // Create UI
    this.lobbyUI.createUI(
      () => this.createRoom(),
      () => this.refreshRooms(),
      () => this.joinSelectedRoom()
    );

    // Set initial player name
    this.playerName = 'Player' + Math.floor(Math.random() * 1000);
    this.lobbyUI.setPlayerName(this.playerName);

    // Connect to server and request initial room list
    this.socketManager.connect();
    this.refreshRooms();
  }

  // LobbySocketCallbacks implementation
  onRoomCreated(room: GameRoom, playerId: string): void {
    this.scene.start('MainScene', { 
      socket: this.socketManager.getSocket(), 
      room, 
      playerId,
      playerName: this.playerName 
    });
  }

  onRoomJoined(room: GameRoom, playerId: string): void {
    this.scene.start('MainScene', { 
      socket: this.socketManager.getSocket(), 
      room, 
      playerId,
      playerName: this.playerName 
    });
  }

  onRoomList(rooms: any[]): void {
    this.roomListManager.updateRooms(rooms);
  }

  onError(message: string): void {
    this.lobbyUI.showErrorMessage(message);
  }

  onPlayerJoined(player: Player): void {
    // Refresh room list to show updated player count
    this.refreshRooms();
  }

  onPlayerLeft(playerId: string): void {
    // Refresh room list to show updated player count
    this.refreshRooms();
  }

  // Action handlers
  private createRoom(): void {
    this.socketManager.createRoom(`${this.playerName}'s Room`, this.playerName, 6);
  }

  private refreshRooms(): void {
    this.socketManager.requestRoomList();
  }

  private joinSelectedRoom(): void {
    const selectedRoomId = this.roomListManager.getSelectedRoomId();
    
    if (!selectedRoomId) {
      this.lobbyUI.showErrorMessage('Please select a room to join');
      return;
    }

    const selectedRoom = this.roomListManager.getSelectedRoom();
    if (!selectedRoom) {
      this.lobbyUI.showErrorMessage('Selected room no longer exists');
      this.roomListManager.clearSelection();
      this.refreshRooms();
      return;
    }

    if (!selectedRoom.isJoinable) {
      this.lobbyUI.showErrorMessage('Room is not joinable (full or game started)');
      return;
    }

    this.socketManager.joinRoom(selectedRoomId, this.playerName);
  }
}