import { Types } from 'phaser';
import { MainScene } from './scenes/MainScene';
import { LobbyScene } from './scenes/LobbyScene';

export const GameConfig: Types.Core.GameConfig = {
  title: 'Last Light',
  version: '0.2.0',
  width: 1024,
  height: 768,
  type: Phaser.AUTO,
  parent: 'app', // This should match the container in index.html
  backgroundColor: '#1a1a2e',
  scene: [LobbyScene, MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // Top-down game, no gravity
      debug: true // Temporarily enable to see collision boxes
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 800,
      height: 600
    },
    max: {
      width: 1600,
      height: 1200
    }
  }
};
