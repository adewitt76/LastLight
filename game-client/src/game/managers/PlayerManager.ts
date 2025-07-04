import { Scene } from 'phaser';
import { Player } from '@lastlight/shared-models';

export class PlayerManager {
  private scene: Scene;
  private player: Phaser.Physics.Arcade.Sprite | null = null;
  private otherPlayers: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private otherPlayerNames: Map<string, Phaser.GameObjects.Text> = new Map();
  private playerData: Player | null = null;
  private playerId: string = '';
  private playerName: string = '';

  constructor(scene: Scene) {
    this.scene = scene;
  }

  initialize(playerData: Player | null, playerId: string, playerName: string): void {
    this.playerData = playerData;
    this.playerId = playerId;
    this.playerName = playerName;
  }

  createAnimations(): void {
    // Create walking animations for all 8 directions (clockwise from North)
    // Row 0: North (back view)
    this.scene.anims.create({
      key: 'walk-north',
      frames: this.scene.anims.generateFrameNumbers('astronaut', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Row 1: Northwest (back-left angle)
    this.scene.anims.create({
      key: 'walk-northwest',
      frames: this.scene.anims.generateFrameNumbers('astronaut', { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Row 2: West (left side view)
    this.scene.anims.create({
      key: 'walk-west',
      frames: this.scene.anims.generateFrameNumbers('astronaut', { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Row 3: Southwest (front-left angle)
    this.scene.anims.create({
      key: 'walk-southwest',
      frames: this.scene.anims.generateFrameNumbers('astronaut', { start: 12, end: 15 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Row 4: South (front view with visor)
    this.scene.anims.create({
      key: 'walk-south',
      frames: this.scene.anims.generateFrameNumbers('astronaut', { start: 16, end: 19 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Row 5: Southeast (front-right angle)
    this.scene.anims.create({
      key: 'walk-southeast',
      frames: this.scene.anims.generateFrameNumbers('astronaut', { start: 20, end: 23 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Row 6: East (right side view)
    this.scene.anims.create({
      key: 'walk-east',
      frames: this.scene.anims.generateFrameNumbers('astronaut', { start: 24, end: 27 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Row 7: Northeast (back-right angle)
    this.scene.anims.create({
      key: 'walk-northeast',
      frames: this.scene.anims.generateFrameNumbers('astronaut', { start: 28, end: 31 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Idle animations (first frame of each direction)
    this.scene.anims.create({
      key: 'idle-north',
      frames: [{ key: 'astronaut', frame: 0 }],
      frameRate: 1
    });
    
    this.scene.anims.create({
      key: 'idle-south',
      frames: [{ key: 'astronaut', frame: 16 }],
      frameRate: 1
    });
    
    this.scene.anims.create({
      key: 'idle-west',
      frames: [{ key: 'astronaut', frame: 8 }],
      frameRate: 1
    });
    
    this.scene.anims.create({
      key: 'idle-east',
      frames: [{ key: 'astronaut', frame: 24 }],
      frameRate: 1
    });
  }

  createPlayer(): Phaser.Physics.Arcade.Sprite {
    // Use center hub as default position (2400, 1600) - center of map
    const defaultX = 2400;
    const defaultY = 1600;
    const startX = (this.playerData?.position.x !== 4800) ? this.playerData?.position.x ?? defaultX : defaultX;
    const startY = (this.playerData?.position.y !== 3200) ? this.playerData?.position.y ?? defaultY : defaultY;

    // Create player sprite using the astronaut sprite sheet
    this.player = this.scene.physics.add.sprite(startX, startY, 'astronaut');
    this.player.setDisplaySize(120, 120); // 1.5x larger than previous size
    
    // Set physics body properties
    if (this.player.body && 'setSize' in this.player.body) {
      this.player.body.setSize(25, 48); // Width 25 pixels, height reduced by half
      (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    }
    
    // Start with idle south animation
    this.player.play('idle-south');
    
    // Set camera to follow this player
    this.scene.cameras.main.startFollow(this.player);
    this.scene.cameras.main.setZoom(0.75); // Good zoom level for this map size
    
    // Add player name label
    const nameText = this.scene.add.text(startX, startY - 30, this.playerName, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);

    // Make name follow player
    this.scene.physics.world.on('worldstep', () => {
      if (this.player) {
        nameText.setPosition(this.player.x, this.player.y - 30);
      }
    });

    return this.player;
  }

  createOtherPlayer(playerData: Player): void {
    const sprite = this.scene.physics.add.sprite(
      playerData.position.x, 
      playerData.position.y, 
      'astronaut'
    );
    sprite.setDisplaySize(120, 120); // Same as main player - 1.5x larger
    
    // Set physics body properties
    if (sprite.body && 'setSize' in sprite.body) {
      sprite.body.setSize(25, 48); // Width 25 pixels, height reduced by half
      (sprite.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    }
    
    // Start with idle south animation
    sprite.play('idle-south');
    
    // Set different tint for other players
    sprite.setTint(0xff6b6b); // Red tint
    
    // Add name label
    const nameText = this.scene.add.text(
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

  removeOtherPlayer(playerId: string): void {
    const sprite = this.otherPlayers.get(playerId);
    const nameText = this.otherPlayerNames.get(playerId);
    
    if (sprite) sprite.destroy();
    if (nameText) nameText.destroy();
    
    this.otherPlayers.delete(playerId);
    this.otherPlayerNames.delete(playerId);
  }

  moveOtherPlayer(playerId: string, position: { x: number; y: number }): void {
    if (playerId === this.playerId) return; // Don't update our own position

    const sprite = this.otherPlayers.get(playerId);
    if (sprite) {
      // Smooth movement using tweens
      this.scene.tweens.add({
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
  }

  updatePlayerAnimation(velocityX: number, velocityY: number): void {
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

  stopPlayerAnimation(): void {
    if (this.player) {
      this.player.anims.stop();
    }
  }

  getPlayer(): Phaser.Physics.Arcade.Sprite | null {
    return this.player;
  }

  getOtherPlayers(): Map<string, Phaser.Physics.Arcade.Sprite> {
    return this.otherPlayers;
  }

  private updateOtherPlayerVisuals(playerId: string): void {
    const sprite = this.otherPlayers.get(playerId);
    const nameText = this.otherPlayerNames.get(playerId);
    
    if (sprite && nameText) {
      // Update name position
      nameText.setPosition(sprite.x, sprite.y - 30);
    }
  }
}