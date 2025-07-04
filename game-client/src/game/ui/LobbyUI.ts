import { Scene } from 'phaser';

export class LobbyUI {
  private scene: Scene;
  private playerNameText: Phaser.GameObjects.Text | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  createUI(
    onCreateRoom: () => void,
    onRefreshRooms: () => void,
    onJoinSelected: () => void
  ): { playerNameText: Phaser.GameObjects.Text } {
    const { width, height } = this.scene.scale;

    // Title
    this.scene.add.text(width / 2, 100, 'LAST LIGHT', {
      fontSize: '48px',
      color: '#ff6b6b',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Subtitle
    this.scene.add.text(width / 2, 160, 'Deep Space Colony Ship', {
      fontSize: '18px',
      color: '#4ecdc4',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Player name section
    this.scene.add.text(width / 2, 220, 'Enter your name:', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Name input field (placeholder)
    this.scene.add.rectangle(width / 2, 260, 300, 40, 0x333333, 0.8);
    this.playerNameText = this.scene.add.text(width / 2, 260, 'Player', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Create Room Button
    const createButton = this.scene.add.rectangle(width / 2, 320, 200, 50, 0xff6b6b, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onCreateRoom)
      .on('pointerover', () => createButton.setAlpha(1))
      .on('pointerout', () => createButton.setAlpha(0.8));

    this.scene.add.text(width / 2, 320, 'CREATE ROOM', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Refresh Rooms Button
    const refreshButton = this.scene.add.rectangle(width / 2, 380, 200, 40, 0x4ecdc4, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onRefreshRooms)
      .on('pointerover', () => refreshButton.setAlpha(1))
      .on('pointerout', () => refreshButton.setAlpha(0.8));

    this.scene.add.text(width / 2, 380, 'REFRESH ROOMS', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Available Rooms Title
    this.scene.add.text(width / 2, 430, 'Available Rooms:', {
      fontSize: '18px',
      color: '#4ecdc4',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Join Selected Room Button
    const joinButton = this.scene.add.rectangle(width / 2, height - 80, 200, 50, 0x45b7d1, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onJoinSelected)
      .on('pointerover', () => joinButton.setAlpha(1))
      .on('pointerout', () => joinButton.setAlpha(0.8));

    this.scene.add.text(width / 2, height - 80, 'JOIN SELECTED', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    return { playerNameText: this.playerNameText };
  }

  showErrorMessage(message: string): void {
    const { width, height } = this.scene.scale;
    
    // Create error message overlay
    const errorBg = this.scene.add.rectangle(width / 2, height / 2, 400, 150, 0x000000, 0.8);
    const errorText = this.scene.add.text(width / 2, height / 2 - 20, message, {
      fontSize: '16px',
      color: '#ff6b6b',
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      wordWrap: { width: 350 }
    }).setOrigin(0.5);
    
    const okText = this.scene.add.text(width / 2, height / 2 + 40, 'OK', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    
    const okButton = this.scene.add.rectangle(width / 2, height / 2 + 40, 100, 30, 0xff6b6b, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        errorBg.destroy();
        errorText.destroy();
        okButton.destroy();
        okText.destroy();
      });

    // Auto-dismiss after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      if (errorBg.active) {
        errorBg.destroy();
        errorText.destroy();
        okButton.destroy();
        okText.destroy();
      }
    });
  }

  setPlayerName(name: string): void {
    if (this.playerNameText) {
      this.playerNameText.setText(name);
    }
  }
}