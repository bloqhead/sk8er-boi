import { layout } from '../systems/Layout.js'
import { audio }  from '../audio/AudioManager.js'

export class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene') }

  create() {
    // Hide arcade panel on non-game screens
    const _p = document.getElementById('arcade-panel'); if (_p) _p.style.display = 'none'
    const { W, H, u, font } = layout(this)

    // Semi-transparent overlay
    this.add.rectangle(0, 0, W, H, 0x000000, 0.72).setOrigin(0)

    // Scanlines for retro feel
    for (let y = 0; y < H; y += 4) {
      this.add.rectangle(0, y, W, 2, 0x000000, 0.18).setOrigin(0)
    }

    // PAUSED title
    const title = this.add.text(W / 2, H * 0.28, 'PAUSED', {
      fontFamily: "'Press Start 2P'",
      fontSize:   font.xl + 'px',
      color:      '#f5e642',
      stroke:     '#000000',
      strokeThickness: Math.max(3, font.xl * 0.22),
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title, alpha: { from: 1, to: 0.4 },
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    })

    // Menu items
    const items = [
      { label: 'RESUME',      action: () => this._resume() },
      { label: 'RESTART',     action: () => this._restart() },
      { label: 'MAIN MENU',   action: () => this._menu() },
    ]

    const menuY   = H * 0.50
    const menuGap = Math.max(28, u * 2.8)

    items.forEach((item, i) => {
      const y  = menuY + i * menuGap
      const bg = this.add.rectangle(W / 2, y, Math.min(W * 0.6, 240), menuGap * 0.75, 0x111122, 0.8)
        .setInteractive({ useHandCursor: true })
      const t = this.add.text(W / 2, y, item.label, {
        fontFamily: "'Press Start 2P'",
        fontSize:   font.md + 'px',
        color:      i === 0 ? '#39ff14' : '#cccccc',
      }).setOrigin(0.5)

      bg.on('pointerover', () => { t.setColor('#f5e642'); bg.setFillStyle(0x221133) })
      bg.on('pointerout',  () => { t.setColor(i === 0 ? '#39ff14' : '#cccccc'); bg.setFillStyle(0x111122) })
      bg.on('pointerdown', () => item.action())
    })

    // Controls hint
    this.add.text(W / 2, H * 0.82, 'P / ESC  TO RESUME', {
      fontFamily: "'Press Start 2P'",
      fontSize:   font.xs + 'px',
      color:      '#333355',
    }).setOrigin(0.5)

    // Pause button in HUD also shows P hint
    this.input.keyboard.on('keydown-P',   () => this._resume())
    this.input.keyboard.on('keydown-ESC', () => this._resume())
  }

  _resume() {
    this.scene.resume('GameScene')
    this.scene.resume('HUDScene')
    this.scene.stop('PauseScene')
  }

  _restart() {
    this.scene.stop('PauseScene')
    this.scene.stop('HUDScene')
    const gs = this.scene.get('GameScene')
    const levelId = gs?.levelId || 1
    this.scene.stop('GameScene')
    this.scene.start('GameScene', { levelId })
    this.scene.launch('HUDScene')
  }

  _menu() {
    this.scene.stop('PauseScene')
    this.scene.stop('HUDScene')
    this.scene.stop('GameScene')
    this.scene.start('MenuScene')
  }
}
