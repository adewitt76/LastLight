import { Scene } from 'phaser';

export class WallCollisionManager {
  private scene: Scene;
  private walls!: Phaser.Physics.Arcade.StaticGroup;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  createWalls(): Phaser.Physics.Arcade.StaticGroup {
    // Initialize static physics group for walls
    this.walls = this.scene.physics.add.staticGroup();
    const wallColor = 0x222222;
    
    // POWER SECTION MAZE (North-West) - 2 entrances minimum
    this.createPowerSectionWalls(wallColor);
    
    // OXYGEN SECTION MAZE (North-East) - 2 entrances minimum
    this.createOxygenSectionWalls(wallColor);
    
    // COMMUNICATIONS SECTION MAZE (South) - 2 entrances minimum
    this.createCommunicationsSectionWalls(wallColor);

    // CORRIDOR MAZE WALLS - Create strategic bottlenecks and alternate paths
    this.createCorridorWalls(wallColor);

    return this.walls;
  }

  setupCollisions(player: Phaser.Physics.Arcade.Sprite, otherPlayers: Map<string, Phaser.Physics.Arcade.Sprite>): void {
    if (player && this.walls) {
      // Player collides with walls
      this.scene.physics.add.collider(player, this.walls);
      
      // Other players collide with walls too
      otherPlayers.forEach(otherPlayer => {
        if (otherPlayer.body) {
          this.scene.physics.add.collider(otherPlayer, this.walls);
        }
      });
    }
  }

  addCollisionForPlayer(player: Phaser.Physics.Arcade.Sprite): void {
    if (this.walls && player.body) {
      this.scene.physics.add.collider(player, this.walls);
    }
  }

  private createPowerSectionWalls(wallColor: number): void {
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
  }

  private createOxygenSectionWalls(wallColor: number): void {
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
  }

  private createCommunicationsSectionWalls(wallColor: number): void {
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
  }

  private createCorridorWalls(wallColor: number): void {
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
  
  private createWallSegment(x: number, y: number, width: number, height: number, color: number): void {
    // Create visual wall
    this.scene.add.rectangle(x, y, width, height, color);
    
    // Create physics wall using static sprite with proper sizing
    const wallBody = this.scene.physics.add.staticSprite(x, y, '');
    wallBody.setVisible(false); // Hide the physics sprite
    
    // IMPORTANT: Set display size first, then body size
    wallBody.setDisplaySize(width, height);
    if (wallBody.body) {
      (wallBody.body as Phaser.Physics.Arcade.StaticBody).setSize(width, height, true); // true = center the body
      wallBody.refreshBody(); // Apply changes to static body
    }
    
    // Add to walls group
    this.walls.add(wallBody);
  }
}