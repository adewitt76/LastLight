import { Scene } from 'phaser';
import { RoomSummary } from '@lastlight/shared-models';

export class RoomListManager {
  private scene: Scene;
  private roomListContainer: Phaser.GameObjects.Container;
  private availableRooms: RoomSummary[] = [];
  private selectedRoomId: string = '';

  constructor(scene: Scene) {
    this.scene = scene;
    const { width } = scene.scale;
    this.roomListContainer = scene.add.container(width / 2, 480);
  }

  updateRooms(rooms: RoomSummary[]): void {
    this.availableRooms = rooms;
    this.updateRoomListDisplay();
  }

  selectRoom(roomId: string): void {
    this.selectedRoomId = roomId;
    this.updateRoomListDisplay(); // Refresh to show selection
    console.log('Selected room:', roomId);
  }

  getSelectedRoom(): RoomSummary | null {
    return this.availableRooms.find(room => room.id === this.selectedRoomId) || null;
  }

  getSelectedRoomId(): string {
    return this.selectedRoomId;
  }

  clearSelection(): void {
    this.selectedRoomId = '';
    this.updateRoomListDisplay();
  }

  private updateRoomListDisplay(): void {
    // Clear existing room list
    this.roomListContainer.removeAll(true);

    if (this.availableRooms.length === 0) {
      const noRoomsText = this.scene.add.text(0, 0, 'No rooms available', {
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
      const roomBg = this.scene.add.rectangle(0, yPos, 400, 50, bgColor, 0.8);
      
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
      const roomText = this.scene.add.text(-180, yPos - 8, room.name || `Room ${room.id}`, {
        fontSize: '16px',
        color: textColor,
        fontFamily: 'Arial, sans-serif'
      });

      const playersText = this.scene.add.text(-180, yPos + 8, `Players: ${room.playerCount}/${room.maxPlayers}`, {
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

      const statusText = this.scene.add.text(140, yPos, room.status || 'waiting', {
        fontSize: '14px',
        color: statusColor,
        fontFamily: 'Arial, sans-serif'
      });

      // Add to container
      this.roomListContainer.add([roomBg, roomText, playersText, statusText]);

      // Add full indicator if needed
      if (room.playerCount >= room.maxPlayers && room.status !== 'playing') {
        const fullText = this.scene.add.text(140, yPos + 15, '(FULL)', {
          fontSize: '10px',
          color: '#ff6b6b',
          fontFamily: 'Arial, sans-serif'
        });
        this.roomListContainer.add(fullText);
      }

      // Highlight selected room
      if (this.selectedRoomId === room.id && isJoinable) {
        roomBg.setFillStyle(0x4ecdc4, 0.6);
      }
    });
  }
}