import { Scene } from 'phaser';

export class ShipLayoutManager {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  createShipLayout(): void {
    // Create a large map - 2x larger for good isolation with playability
    this.scene.physics.world.setBounds(0, 0, 4800, 3200);
    
    // Set camera bounds
    this.scene.cameras.main.setBounds(0, 0, 4800, 3200);

    // Central Hub - Starting area (center of map)
    const centerX = 2400;
    const centerY = 1600;
    this.scene.add.rectangle(centerX, centerY, 400, 300, 0x555555);
    this.scene.add.text(centerX, centerY, 'CENTRAL HUB', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    this.scene.add.text(centerX, centerY + 30, 'Command Center', { fontSize: '16px', color: '#cccccc' }).setOrigin(0.5);

    // Main corridors from center hub
    this.createCorridors(centerX, centerY);

    // Create major sections
    this.createPowerSection();
    this.createOxygenSection();
    this.createCommunicationsSection();

    // Create atmospheric rooms
    this.createAtmosphericRooms();
  }

  private createCorridors(centerX: number, centerY: number): void {
    // North corridor to power
    this.scene.add.rectangle(centerX, centerY - 400, 120, 800, 0x444444);
    // South corridor to comms
    this.scene.add.rectangle(centerX, centerY + 400, 120, 800, 0x444444);
    // East corridor to oxygen
    this.scene.add.rectangle(centerX + 600, centerY, 1200, 120, 0x444444);
    // West corridor 
    this.scene.add.rectangle(centerX - 600, centerY, 1200, 120, 0x444444);
  }

  private createPowerSection(): void {
    const powerSectionX = 800;
    const powerSectionY = 600;
    this.createIsolatedSection(powerSectionX, powerSectionY, 'POWER CORE', 'Reactor Systems', 0xff4444);
    
    // Connecting corridors to power
    this.scene.add.rectangle(1600, 600, 1600, 80, 0x444444);
    this.scene.add.rectangle(2340, 1100, 80, 1000, 0x444444);
  }

  private createOxygenSection(): void {
    const oxygenSectionX = 4000;
    const oxygenSectionY = 600;
    this.createIsolatedSection(oxygenSectionX, oxygenSectionY, 'LIFE SUPPORT', 'Atmosphere Control', 0x44ff44);
    
    // Connecting corridors to oxygen
    this.scene.add.rectangle(3200, 600, 1600, 80, 0x444444);
    this.scene.add.rectangle(2460, 1100, 80, 1000, 0x444444);
  }

  private createCommunicationsSection(): void {
    const commsSectionX = 2400;
    const commsSectionY = 2800;
    this.createIsolatedSection(commsSectionX, commsSectionY, 'COMMUNICATIONS', 'Signal Processing', 0x4444ff);
    
    // Direct corridor south
    this.scene.add.rectangle(2400, 1600 + 600, 80, 1200, 0x444444);
  }

  private createAtmosphericRooms(): void {
    this.createAtmosphericRoom(1200, 1600, 'Medical Bay', 0x666666);
    this.createAtmosphericRoom(3600, 1600, 'Storage Bay', 0x666666);
    this.createAtmosphericRoom(800, 2400, 'Cafeteria', 0x666666);
    this.createAtmosphericRoom(4000, 2400, 'Engine Room', 0x666666);
    this.createAtmosphericRoom(2400, 800, 'Navigation', 0x666666);
    this.createAtmosphericRoom(400, 1600, 'Security', 0x666666);
    this.createAtmosphericRoom(4400, 1600, 'Laboratory', 0x666666);
  }

  private createIsolatedSection(x: number, y: number, title: string, subtitle: string, accentColor: number): void {
    // Large isolated room
    this.scene.add.rectangle(x, y, 400, 300, 0x333333);
    this.scene.add.rectangle(x, y, 380, 280, 0x555555); // Inner area
    
    // Title and subtitle
    this.scene.add.text(x, y - 40, title, { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
    this.scene.add.text(x, y - 10, subtitle, { fontSize: '14px', color: '#cccccc' }).setOrigin(0.5);
    
    // Accent elements
    this.scene.add.rectangle(x - 150, y - 100, 100, 20, accentColor);
    this.scene.add.rectangle(x + 150, y - 100, 100, 20, accentColor);
    this.scene.add.rectangle(x - 150, y + 100, 100, 20, accentColor);
    this.scene.add.rectangle(x + 150, y + 100, 100, 20, accentColor);
    
    // Add some detail elements
    this.scene.add.circle(x - 120, y, 30, accentColor, 0.3);
    this.scene.add.circle(x + 120, y, 30, accentColor, 0.3);
  }

  private createAtmosphericRoom(x: number, y: number, name: string, color: number): void {
    // Medium sized room for atmosphere/navigation
    this.scene.add.rectangle(x, y, 250, 180, color);
    this.scene.add.text(x, y, name, { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
    
    // Add some detail
    this.scene.add.rectangle(x - 80, y - 50, 60, 20, 0x888888);
    this.scene.add.rectangle(x + 80, y - 50, 60, 20, 0x888888);
  }
}