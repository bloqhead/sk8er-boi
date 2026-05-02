import { GAME_CONSTANTS } from '../data/levels.js'
import { GAME_W, GAME_H } from '../main.js'

export class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene')
    this.score = 0
    this.lives = GAME_CONSTANTS.LIVES
  }

  create() {
    // All coords are in fixed game space (480×270)
    const gw = GAME_W, gh = GAME_H

    // ── Score (top left) ──────────────────────────────────────────────
    this.add.rectangle(0, 0, 110, 14, 0x000000, 0.55).setOrigin(0)
    this.scoreText = this.add.text(4, 3, 'SCORE: 0', {
      fontFamily: "'Press Start 2P'", fontSize: '6px', color: '#f5e642'
    })

    // ── Lives (top right — hearts) ────────────────────────────────────
    this.hearts = []
    for (let i = 0; i < GAME_CONSTANTS.LIVES; i++) {
      const hx = gw - 6 - i * 10
      const h = this.add.image(hx, 6, 'heart_full').setOrigin(1, 0.5)
      this.hearts.push(h)
    }

    // ── Level name (top center) ───────────────────────────────────────
    this.levelLabel = this.add.text(gw / 2, 3, '', {
      fontFamily: "'Press Start 2P'", fontSize: '5px', color: '#ff2d78'
    }).setOrigin(0.5, 0)

    // ── Speed (small, top center-right) ──────────────────────────────
    this.speedText = this.add.text(gw - 6, 12, '', {
      fontFamily: "'Press Start 2P'", fontSize: '4px', color: '#00f5ff'
    }).setOrigin(1, 0)

    // ── Level progress bar (bottom) ───────────────────────────────────
    const barW = gw * 0.50, barX = (gw - barW) / 2
    this.add.text(gw / 2, gh - 12, 'LEVEL', {
      fontFamily: "'Press Start 2P'", fontSize: '4px', color: '#444444'
    }).setOrigin(0.5, 1)
    this.add.rectangle(barX, gh - 5, barW, 4, 0x222222).setOrigin(0, 0.5)
    this.progressFg = this.add.rectangle(barX, gh - 5, 0, 4, 0x39ff14).setOrigin(0, 0.5)

    // ── Ollie charge bar (bottom left) ───────────────────────────────
    this.add.text(4, gh - 12, 'OLLIE', {
      fontFamily: "'Press Start 2P'", fontSize: '4px', color: '#ff2d78'
    })
    this.add.rectangle(4, gh - 5, 60, 4, 0x222222).setOrigin(0, 0.5)
    this.chargeFg = this.add.rectangle(4, gh - 5, 0, 4, 0xff2d78).setOrigin(0, 0.5)

    // ── Trick popup ───────────────────────────────────────────────────
    this.trickText = this.add.text(gw / 2, gh * 0.38, '', {
      fontFamily: "'Press Start 2P'", fontSize: '9px', color: '#00f5ff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0)

    // ── Event wiring ──────────────────────────────────────────────────
    const game = this.scene.get('GameScene')
    game.events.on('score-update', score => {
      this.score = score
      this.scoreText.setText('SCORE: ' + score.toLocaleString())
    })
    game.events.on('lives-update', lives => {
      this.lives = lives
      this.hearts.forEach((h, i) => h.setTexture(i < lives ? 'heart_full' : 'heart_empty'))
    })
    game.events.on('trick', name => this._showTrick(name))
    game.events.on('level-start', lv => this.levelLabel.setText(lv.name))
    game.events.on('speed', spd => this.speedText.setText(Math.floor(spd) + 'km/h'))
    game.events.on('progress', p => {
      this.progressFg.width = p * GAME_W * 0.50
      this.progressFg.setFillStyle(p > 0.8 ? 0xf5e642 : p > 0.5 ? 0x00f5ff : 0x39ff14)
    })
    game.events.on('charge', c => {
      this.chargeFg.width = c * 60
      this.chargeFg.setFillStyle(c > 0.7 ? 0xf5e642 : c > 0.4 ? 0xff6600 : 0xff2d78)
    })
  }

  _showTrick(name) {
    this.trickText.setText(name).setAlpha(1).setScale(1.4).setY(GAME_H * 0.38)
    this.tweens.killTweensOf(this.trickText)
    this.tweens.add({
      targets: this.trickText,
      alpha: 0, scaleX: 1, scaleY: 1,
      y: GAME_H * 0.30,
      duration: 800, ease: 'Cubic.Out'
    })
  }
}
