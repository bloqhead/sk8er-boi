import { GAME_CONSTANTS } from '../data/levels.js'
import { layout }         from '../systems/Layout.js'

export class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene')
    this.score = 0
    this.lives = GAME_CONSTANTS.LIVES
    this._levelName = ''
  }

  create() {
    this._build()

    // Wire game events
    const game = this.scene.get('GameScene')
    game.events.on('score-update', score => { this.score = score; this._updateScore() })
    game.events.on('lives-update', lives => { this.lives = lives; this._updateHearts() })
    game.events.on('trick',        name  => this._showTrick(name))
    game.events.on('level-start',  lv    => { this._levelName = lv.name; if (this._levelLabel) this._levelLabel.setText(lv.name) })
    game.events.on('speed',        spd   => { if (this._speedText) this._speedText.setText((spd | 0) + '') })
    game.events.on('progress',     p     => this._updateProgress(p))
    game.events.on('charge',       c     => this._updateCharge(c))
    game.events.on('resize',       L     => { this.children.removeAll(true); this._build() })
  }

  _build() {
    const L = layout(this)
    const { W, H, u, font, btnR, btnPad, isPortrait, groundY } = L

    // Avoid covering touch buttons — stop bars above touchBarH zone
    const safeBottom = groundY + u  // bottom of HUD-safe zone

    // ── Score ─────────────────────────────────────────────────────────
    const scoreBgW = Math.min(W * 0.55, 220)
    this.add.rectangle(0, 0, scoreBgW, font.sm + u, 0x000000, 0.6).setOrigin(0)
    this._scoreText = this.add.text(u * 0.4, u * 0.2, 'SCORE: ' + this.score.toLocaleString(), {
      fontFamily: "'Press Start 2P'", fontSize: font.sm + 'px', color: '#f5e642',
    })

    // ── Lives (hearts, top right) ─────────────────────────────────────
    const hSize = Math.max(8, u * 0.7)
    const hGap  = hSize + u * 0.4
    this._hearts = []
    for (let i = 0; i < GAME_CONSTANTS.LIVES; i++) {
      const hx = W - u * 0.4 - i * hGap
      const h  = this.add.image(hx, u * 0.5, i < this.lives ? 'heart_full' : 'heart_empty')
        .setOrigin(1, 0).setScale(hSize / 7)
      this._hearts.push(h)
    }

    // ── Level name + speed (top centre) ──────────────────────────────
    this._levelLabel = this.add.text(W / 2, u * 0.2, this._levelName, {
      fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#ff2d78',
    }).setOrigin(0.5, 0)

    this._speedText = this.add.text(W / 2, u * 0.2 + font.xs + 2, '', {
      fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#00f5ff',
    }).setOrigin(0.5, 0)

    // ── Level progress bar (just above touch zone) ────────────────────
    const barY  = safeBottom - u * 0.6
    const barW  = W * 0.50
    const barH  = Math.max(4, u * 0.35)
    const barX  = (W - barW) / 2

    this.add.text(barX, barY - font.xs - 2, 'LEVEL', {
      fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#333355',
    })
    this.add.rectangle(barX, barY, barW, barH, 0x111122).setOrigin(0, 0.5)
    this._progressFg = this.add.rectangle(barX, barY, 0, barH, 0x39ff14).setOrigin(0, 0.5)
    this._progressBarW = barW

    // ── Ollie charge bar (bottom left) ───────────────────────────────
    const chargeW = Math.min(80, W * 0.18)
    const chargeY = barY
    this.add.text(u * 0.3, chargeY - font.xs - 2, 'OLLIE', {
      fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#ff2d78',
    })
    this.add.rectangle(u * 0.3, chargeY, chargeW, barH, 0x111122).setOrigin(0, 0.5)
    this._chargeFg = this.add.rectangle(u * 0.3, chargeY, 0, barH, 0xff2d78).setOrigin(0, 0.5)
    this._chargeBarW = chargeW

    // ── Trick popup ───────────────────────────────────────────────────
    this._trickText = this.add.text(W / 2, H * 0.35, '', {
      fontFamily: "'Press Start 2P'",
      fontSize:   font.lg + 'px',
      color:      '#00f5ff',
      stroke:     '#000000',
      strokeThickness: Math.max(2, font.lg * 0.2),
    }).setOrigin(0.5).setAlpha(0)

    this._trickTargetY = H * 0.28
  }

  _updateScore() {
    this._scoreText?.setText('SCORE: ' + this.score.toLocaleString())
  }

  _updateHearts() {
    this._hearts?.forEach((h, i) => h.setTexture(i < this.lives ? 'heart_full' : 'heart_empty'))
  }

  _updateProgress(p) {
    if (!this._progressFg) return
    this._progressFg.width = p * this._progressBarW
    this._progressFg.setFillStyle(p > 0.8 ? 0xf5e642 : p > 0.5 ? 0x00f5ff : 0x39ff14)
  }

  _updateCharge(c) {
    if (!this._chargeFg) return
    this._chargeFg.width = c * this._chargeBarW
    this._chargeFg.setFillStyle(c > 0.7 ? 0xf5e642 : c > 0.4 ? 0xff6600 : 0xff2d78)
  }

  _showTrick(name) {
    if (!this._trickText) return
    this._trickText.setText(name).setAlpha(1).setScale(1.3)
      .setY(this.scale.height * 0.35)
    this.tweens.killTweensOf(this._trickText)
    this.tweens.add({
      targets: this._trickText,
      alpha: 0, scaleX: 1, scaleY: 1,
      y: this._trickTargetY,
      duration: 850, ease: 'Cubic.Out',
    })
  }
}
