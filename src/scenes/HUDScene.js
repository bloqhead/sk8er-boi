import { GAME_CONSTANTS } from '../data/levels.js'
import { layout }         from '../systems/Layout.js'

export class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene')
    this.score      = 0
    this.lives      = GAME_CONSTANTS.LIVES
    this._levelName = ''
    this._charge    = 0
  }

  create() {
    this._build()

    const game = this.scene.get('GameScene')
    game.events.on('score-update', score => { this.score = score; this._updateScore() })
    game.events.on('lives-update', lives => { this.lives = lives; this._updateHearts() })
    game.events.on('trick',        name  => this._showTrick(name))
    game.events.on('level-start',  lv    => { this._levelName = lv.name; if (this._levelLabel) this._levelLabel.setText(lv.name) })
    game.events.on('speed',        spd   => { if (this._speedText) this._speedText.setText((spd | 0) + ' km/h') })
    game.events.on('progress',     p     => this._updateProgress(p))
    game.events.on('charge',       c     => this._updateCharge(c))
    game.events.on('resize',       ()    => { this.children.removeAll(true); this._build() })
  }

  _build() {
    const L = layout(this)
    const { W, H, u, font, groundY } = L
    const safeBottom = groundY - u * 0.3

    // ── Score (top left, pill background) ────────────────────────────
    const scorePillW = Math.min(W * 0.52, 210)
    this.add.rectangle(0, 0, scorePillW, font.sm + u * 0.8, 0x000000, 0.65).setOrigin(0)
    this._scoreText = this.add.text(u * 0.4, u * 0.25, 'SCORE: ' + this.score.toLocaleString(), {
      fontFamily: "'Press Start 2P'", fontSize: font.sm + 'px', color: '#f5e642',
    })

    // ── Pause button (top right, beside hearts) ───────────────────────
    const pauseBtn = this.add.text(W - u * 0.3, u * 0.25, '⏸', {
      fontFamily: 'Arial',
      fontSize:   Math.max(12, u * 0.9) + 'px',
      color:      '#888888',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(50)
    pauseBtn.on('pointerover', () => pauseBtn.setColor('#ffffff'))
    pauseBtn.on('pointerout',  () => pauseBtn.setColor('#888888'))
    pauseBtn.on('pointerdown', () => {
      const gs = this.scene.get('GameScene')
      if (gs) {
        this.scene.scene.launch('PauseScene')
        this.scene.scene.pause('GameScene')
        this.scene.scene.pause('HUDScene')
      }
    })
    const hSize = Math.max(8, u * 0.7)
    const hGap  = hSize * 1.6
    this._hearts = []
    for (let i = 0; i < GAME_CONSTANTS.LIVES; i++) {
      const hx = W - u * 0.4 - i * hGap
      const h  = this.add.image(hx, u * 0.55, i < this.lives ? 'heart_full' : 'heart_empty')
        .setOrigin(1, 0).setScale(hSize / 7)
      this._hearts.push(h)
    }

    // ── Level name (top centre) ───────────────────────────────────────
    this._levelLabel = this.add.text(W / 2, u * 0.25, this._levelName, {
      fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#ff2d78',
    }).setOrigin(0.5, 0)

    this._speedText = this.add.text(W / 2, u * 0.25 + font.xs + 3, '', {
      fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#00f5ff',
    }).setOrigin(0.5, 0)

    // ── Level progress bar (above safe zone) ──────────────────────────
    const barH  = Math.max(4, u * 0.35)
    const barW  = W * 0.45
    const barX  = (W - barW) / 2
    const barY  = safeBottom - barH / 2 - u * 0.2

    this.add.text(barX, barY - barH / 2 - font.xs - 2, 'LEVEL PROGRESS', {
      fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#333355',
    })
    this.add.rectangle(barX, barY, barW, barH, 0x111122).setOrigin(0, 0.5)
    this._progressFg  = this.add.rectangle(barX, barY, 0, barH, 0x39ff14).setOrigin(0, 0.5)
    this._progressBarW = barW

    // ── OLLIE CHARGE METER — prominent arc near player ─────────────────
    // Drawn as a circular arc around a label, lives above the progress bar
    const meterR  = Math.max(16, u * 1.4)    // arc radius
    const meterX  = u * 1.2 + meterR
    const meterY  = safeBottom - meterR - barH - u * 1.8

    // Background ring
    this._chargeGfx = this.add.graphics()
    this._meterX    = meterX
    this._meterY    = meterY
    this._meterR    = meterR

    // "OLLIE" label below the arc
    this.add.text(meterX, meterY + meterR + 4, 'OLLIE', {
      fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#ff2d78',
    }).setOrigin(0.5, 0)

    // Percentage text in centre of arc
    this._chargePct = this.add.text(meterX, meterY, '0%', {
      fontFamily: "'Press Start 2P'", fontSize: Math.max(5, font.xs) + 'px', color: '#ffffff',
    }).setOrigin(0.5, 0.5)

    // Draw initial state
    this._drawChargeMeter(0)

    // ── Trick popup ───────────────────────────────────────────────────
    this._trickText = this.add.text(W / 2, H * 0.35, '', {
      fontFamily: "'Press Start 2P'",
      fontSize:   font.lg + 'px',
      color:      '#00f5ff',
      stroke:     '#000000',
      strokeThickness: Math.max(2, font.lg * 0.2),
    }).setOrigin(0.5).setAlpha(0)
    this._trickY = H * 0.28
  }

  _drawChargeMeter(pct) {
    if (!this._chargeGfx) return
    const gfx = this._chargeGfx
    gfx.clear()

    const { _meterX: cx, _meterY: cy, _meterR: r } = this

    // Background ring (dark)
    gfx.lineStyle(Math.max(3, r * 0.28), 0x221122, 1)
    gfx.beginPath()
    gfx.arc(cx, cy, r, -Math.PI / 2, Math.PI * 1.5, false)
    gfx.strokePath()

    if (pct > 0) {
      // Color shifts from pink → orange → yellow as charge builds
      const color = pct > 0.75 ? 0xf5e642 : pct > 0.45 ? 0xff8800 : 0xff2d78
      gfx.lineStyle(Math.max(3, r * 0.28), color, 1)
      gfx.beginPath()
      const endAngle = -Math.PI / 2 + pct * Math.PI * 2
      gfx.arc(cx, cy, r, -Math.PI / 2, endAngle, false)
      gfx.strokePath()

      // Glow dot at tip
      const tipX = cx + Math.cos(endAngle) * r
      const tipY = cy + Math.sin(endAngle) * r
      gfx.fillStyle(color, 1)
      gfx.fillCircle(tipX, tipY, r * 0.18)
    }
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
    this._charge = c
    this._drawChargeMeter(c)
    if (this._chargePct) {
      this._chargePct.setText(c > 0 ? Math.round(c * 100) + '%' : '')
      const color = c > 0.75 ? '#f5e642' : c > 0.45 ? '#ff8800' : '#ff2d78'
      this._chargePct.setColor(color)
    }
  }

  _showTrick(name) {
    if (!this._trickText) return
    this._trickText.setText(name).setAlpha(1).setScale(1.3).setY(this.scale.height * 0.35)
    this.tweens.killTweensOf(this._trickText)
    this.tweens.add({
      targets: this._trickText, alpha: 0, scaleX: 1, scaleY: 1,
      y: this._trickY, duration: 850, ease: 'Cubic.Out',
    })
  }
}
