import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { PreloadScene } from './scenes/PreloadScene.js'
import { MenuScene } from './scenes/MenuScene.js'
import { GameScene } from './scenes/GameScene.js'
import { HUDScene } from './scenes/HUDScene.js'
import { LeaderboardScene } from './scenes/LeaderboardScene.js'
import { GameOverScene } from './scenes/GameOverScene.js'
import { LevelTransitionScene } from './scenes/LevelTransitionScene.js'

// ─── Fixed internal resolution ───────────────────────────────────────────────
// The game world always runs at 480×270. Phaser scales it up (FIT mode)
// to fill the window — crisp pixel art, stable coordinates everywhere.
export const GAME_W = 480
export const GAME_H = 270

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0a0a0f',
  width: GAME_W,
  height: GAME_H,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H,
    expandParent: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  render: {
    pixelArt: true,
    antialias: false,
    antialiasGL: false,
    roundPixels: true,
    powerPreference: 'high-performance'
  },
  input: {
    activePointers: 4
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    GameScene,
    HUDScene,
    LeaderboardScene,
    GameOverScene,
    LevelTransitionScene
  ]
}

const game = new Phaser.Game(config)
export default game
