import Phaser from 'phaser'
import { BootScene }            from './scenes/BootScene.js'
import { PreloadScene }         from './scenes/PreloadScene.js'
import { MenuScene }            from './scenes/MenuScene.js'
import { GameScene }            from './scenes/GameScene.js'
import { HUDScene }             from './scenes/HUDScene.js'
import { LeaderboardScene }     from './scenes/LeaderboardScene.js'
import { GameOverScene }        from './scenes/GameOverScene.js'
import { LevelTransitionScene } from './scenes/LevelTransitionScene.js'
import { PauseScene }          from './scenes/PauseScene.js'

// RESIZE mode: canvas always fills the full viewport, no black bars.
// Scenes use this.scale.width / this.scale.height for all layout.
// Base unit: 1px in game = 1 real CSS pixel at 1× DPR.
// On mobile portrait a 390×844 phone gets a 390×844 game canvas.
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0a0a0f',
  scale: {
    mode:       Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
    width:  window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false,
    },
  },
  render: {
    pixelArt:      true,
    antialias:     false,
    antialiasGL:   false,
    roundPixels:   true,
    powerPreference: 'high-performance',
  },
  input: { activePointers: 4 },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    GameScene,
    HUDScene,
    LeaderboardScene,
    GameOverScene,
    LevelTransitionScene,
    PauseScene,
  ],
}

const game = new Phaser.Game(config)
export default game
