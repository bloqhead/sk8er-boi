import Phaser from 'phaser'
import { BootScene }            from './scenes/BootScene.js'
import { PreloadScene }         from './scenes/PreloadScene.js'
import { MenuScene }            from './scenes/MenuScene.js'
import { GameScene }            from './scenes/GameScene.js'
import { HUDScene }             from './scenes/HUDScene.js'
import { LeaderboardScene }     from './scenes/LeaderboardScene.js'
import { GameOverScene }        from './scenes/GameOverScene.js'
import { LevelTransitionScene } from './scenes/LevelTransitionScene.js'
import { PauseScene }           from './scenes/PauseScene.js'

// ── Canvas sizing ─────────────────────────────────────────────────────────
// The arcade panel is a DOM flex sibling below the canvas container.
// We must subtract its height so the canvas doesn't extend under it.
function getCanvasHeight() {
  const panel = document.getElementById('arcade-panel')
  const panelH = (panel && panel.offsetHeight > 0) ? panel.offsetHeight : 0
  return window.innerHeight - panelH
}

function getCanvasWidth() {
  return window.innerWidth
}

const config = {
  type:            Phaser.AUTO,
  parent:          'game-container',
  backgroundColor: '#0a0a0f',
  scale: {
    mode:       Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
    width:      getCanvasWidth(),
    height:     getCanvasHeight(),
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 800 }, debug: false },
  },
  render: {
    pixelArt:        true,
    antialias:       false,
    antialiasGL:     false,
    roundPixels:     true,
    powerPreference: 'high-performance',
  },
  input: { activePointers: 4 },
  scene: [
    BootScene, PreloadScene, MenuScene,
    GameScene, HUDScene,
    LeaderboardScene, GameOverScene,
    LevelTransitionScene, PauseScene,
  ],
}

const game = new Phaser.Game(config)

// Resize handler — called whenever the panel appears/disappears
// or the browser viewport changes (rotation, resize, keyboard up/down)
function resizeGame() {
  const w = getCanvasWidth()
  const h = getCanvasHeight()
  game.scale.resize(w, h)
}

window.addEventListener('resize', resizeGame)

// Also expose so GameScene / MenuScene can trigger a resize when
// they show/hide the arcade panel
window._sk8_resizeGame = resizeGame

export default game
export { getCanvasWidth, getCanvasHeight }
