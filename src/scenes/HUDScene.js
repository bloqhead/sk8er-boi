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

    // ── Level progress — thin strip at very top of screen ─────────────
    // 4px tall, full width, sits above everything else, depth 100
    const stripH = Math.max(4, u * 0.3) | 0
    this.add.rectangle(0, 0, W, stripH, 0x111122, 0.9).setOrigin(0).setDepth(100)
    this._progressFg  = this.add.rectangle(0, 0, 0, stripH, 0x39ff14).setOrigin(0).setDepth(101)
    this._progressBarW = W

    // Level name — sits just below the progress strip, small
    this._levelLabel = this.add.text(W / 2, stripH + 2, this._levelName, {
      fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#ff2d78',
    }).setOrigin(0.5, 0).setDepth(100)

    // ── Score (top left) ──────────────────────────────────────────────
    const scorePillH = font.sm + u * 0.7
    const scorePillW = Math.min(W * 0.52, 210)
    this.add.rectangle(0, stripH + font.xs + 4, scorePillW, scorePillH, 0x000000, 0.65)
      .setOrigin(0).setDepth(100)
    this._scoreText = this.add.text(u * 0.4, stripH + font.xs + 4 + u * 0.2,
      'SCORE: ' + this.score.toLocaleString(), {
      fontFamily: "'Press Start 2P'", fontSize: font.sm + 'px', color: '#f5e642',
    }).setDepth(100)

    // ── Speed (top centre-right, small) ──────────────────────────────
    this._speedText = this.add.text(W / 2, stripH + font.xs + 6, '', {
      fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#00f5ff',
    }).setOrigin(0.5, 0).setDepth(100)

    // ── Pause button (top right) ──────────────────────────────────────
    const pauseBtn = this.add.text(W - u * 0.3, stripH + 3, '⏸', {
      fontFamily: 'Arial',
      fontSize:   Math.max(12, u * 0.9) + 'px',
      color:      '#666688',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(102)
    pauseBtn.on('pointerover', () => pauseBtn.setColor('#ffffff'))
    pauseBtn.on('pointerout',  () => pauseBtn.setColor('#666688'))
    pauseBtn.on('pointerdown', () => {
      const gs = this.scene.get('GameScene')
      if (gs) {
        this.scene.scene.launch('PauseScene')
        this.scene.scene.pause('GameScene')
        this.scene.scene.pause('HUDScene')
      }
    })

    // ── Lives (hearts, top right below pause) ─────────────────────────
    const hSize = Math.max(7, u * 0.65)
    const hGap  = hSize * 1.55
    this._hearts = []
    for (let i = 0; i < GAME_CONSTANTS.LIVES; i++) {
      const hx = W - u * 0.3 - i * hGap
      const hy = stripH + font.xs + 6 + u * 0.2
      const h  = this.add.image(hx, hy, i < this.lives ? 'heart_full' : 'heart_empty')
        .setOrigin(1, 0).setScale(hSize / 7).setDepth(100)
      this._hearts.push(h)
    }

    // ── OLLIE CHARGE METER — arc, bottom left ─────────────────────────
    const safeBottom = groundY - u * 0.3
    const meterR  = Math.max(14, u * 1.2)
    const meterX  = u * 1.0 + meterR
    const meterY  = safeBottom - meterR - u * 0.5

    this._chargeGfx = this.add.graphics().setDepth(100)
    this._meterX    = meterX
    this._meterY    = meterY
    this._meterR    = meterR

    this.add.text(meterX, meterY + meterR + 2, 'OLLIE', {
      fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#ff2d78',
    }).setOrigin(0.5, 0).setDepth(100)

    this._chargePct = this.add.text(meterX, meterY, '', {
      fontFamily: "'Press Start 2P'", fontSize: Math.max(5, font.xs) + 'px', color: '#ffffff',
    }).setOrigin(0.5, 0.5).setDepth(100)

    this._drawChargeMeter(0)

    // ── Trick popup ───────────────────────────────────────────────────
    this._trickText = this.add.text(W / 2, H * 0.35, '', {
      fontFamily: "'Press Start 2P'",
      fontSize:   font.lg + 'px',
      color:      '#00f5ff',
      stroke:     '#000000',
      strokeThickness: Math.max(2, font.lg * 0.2),
    }).setOrigin(0.5).setAlpha(0).setDepth(100)
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
