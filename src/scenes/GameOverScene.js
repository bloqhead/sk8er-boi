import { Leaderboard } from '../data/leaderboard.js'
import { LEVELS }      from '../data/levels.js'
import { layout }      from '../systems/Layout.js'
import { audio }       from '../audio/AudioManager.js'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene')
    this.initials  = ['A', 'A', 'A']
    this.cursorPos = 0
    this.phase     = 'entry'
  }

  init(data) {
    this.score    = data.score    || 0
    this.levelId  = data.level    || 1
    this.tricks   = data.tricks   || 0
    this.distance = data.distance || 0
    this.won      = data.won      || false
    this.initials  = ['A', 'A', 'A']
    this.cursorPos = 0
    this.phase     = 'entry'
  }

  create() {
    this._build()
    this.scale.on('resize', () => { this.children.removeAll(true); this._build() })
  }

  _build() {
    const L = layout(this)
    const { W, H, u, font } = L

    this.add.rectangle(0, 0, W, H, 0x0a0a0f).setOrigin(0)
    for (let i = 0; i < 60; i++) {
      const g = this.add.graphics()
      g.fillStyle(0xffffff, Math.random() * 0.25 + 0.05)
      g.fillRect(Math.random() * W | 0, Math.random() * H | 0, 1, 1)
    }

    // Title
    const titleStr   = this.won ? 'YOU WIN!!' : 'GAME OVER'
    const titleColor = this.won ? '#f5e642'   : '#ff2d78'
    this.add.text(W / 2, H * 0.07, titleStr, {
      fontFamily: "'Press Start 2P'",
      fontSize:   font.xl + 'px',
      color:      titleColor,
      stroke:     '#000',
      strokeThickness: Math.max(3, font.xl * 0.22),
    }).setOrigin(0.5)

    // Score
    this.add.text(W / 2, H * 0.22, 'SCORE: ' + this.score.toLocaleString(), {
      fontFamily: "'Press Start 2P'", fontSize: font.lg + 'px', color: '#f5e642',
    }).setOrigin(0.5)

    // Stats
    const level = LEVELS.find(l => l.id === this.levelId)
    const stats = [
      { label: 'LEVEL',    value: level?.name || 'LVL ' + this.levelId },
      { label: 'TRICKS',   value: String(this.tricks) },
      { label: 'DISTANCE', value: this.distance + 'm' },
    ]
    const statY = H * 0.34
    const statGap = font.md * 2.4
    stats.forEach((s, i) => {
      this.add.text(W * 0.12, statY + i * statGap, s.label + ':', {
        fontFamily: "'Press Start 2P'", fontSize: font.sm + 'px', color: '#888888',
      })
      this.add.text(W * 0.88, statY + i * statGap, s.value, {
        fontFamily: "'Press Start 2P'", fontSize: font.sm + 'px', color: '#ffffff',
      }).setOrigin(1, 0)
    })

    // Rank
    const rank = Leaderboard.getRank(this.score)
    this.add.text(W / 2, H * 0.57, 'RANK: #' + rank, {
      fontFamily: "'Press Start 2P'",
      fontSize:   font.md + 'px',
      color:      rank <= 3 ? '#f5e642' : '#aaaaaa',
    }).setOrigin(0.5)

    // Initials
    this.add.text(W / 2, H * 0.65, 'ENTER INITIALS:', {
      fontFamily: "'Press Start 2P'", fontSize: font.sm + 'px', color: '#00f5ff',
    }).setOrigin(0.5)

    this._initY = H * 0.73
    this._cw    = Math.min(60, W * 0.18)
    this._L     = L
    this._drawInitials()
    this._drawButtons(L)

    this.input.keyboard.removeAllListeners()
    this.input.keyboard.on('keydown', this._onKey, this)
  }

  _drawInitials() {
    if (this._initContainer) this._initContainer.destroy()
    this._initContainer = this.add.container(0, 0)
    const { W, font } = this._L
    const cw = this._cw, cy = this._initY, gap = 6

    this.initials.forEach((ch, i) => {
      const cx = W / 2 - cw + i * (cw + gap)
      const sel = i === this.cursorPos && this.phase === 'entry'
      const box = this.add.rectangle(cx, cy, cw, cw * 0.85, sel ? 0x111133 : 0x080818)
        .setStrokeStyle(sel ? 2 : 1, sel ? 0xf5e642 : 0x222255)
      const ltr = this.add.text(cx, cy, ch, {
        fontFamily: "'Press Start 2P'",
        fontSize:   Math.min(font.lg, cw * 0.55) + 'px',
        color:      sel ? '#f5e642' : '#ffffff',
      }).setOrigin(0.5)
      if (sel) this.tweens.add({ targets: ltr, alpha: 0.15, duration: 360, yoyo: true, repeat: -1 })
      this._initContainer.add([box, ltr])
    })

    const { u, font: f } = this._L
    this.add.text(this._L.W / 2, this._initY + this._cw + u * 0.3, '↑↓ CHANGE   → NEXT', {
      fontFamily: "'Press Start 2P'", fontSize: f.xs + 'px', color: '#333355',
    }).setOrigin(0.5)
  }

  _drawButtons(L) {
    if (this._btnContainer) this._btnContainer.destroy()
    this._btnContainer = this.add.container(0, 0)
    const { W, H, font, u } = L
    const by = H * 0.90

    const saveBtn = this.add.text(W / 2 - u * 4, by, 'SAVE', {
      fontFamily: "'Press Start 2P'",
      fontSize:   font.md + 'px',
      color:      '#39ff14',
      backgroundColor: '#001100',
      padding:    { x: u * 0.6, y: u * 0.3 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    saveBtn.on('pointerover', () => saveBtn.setColor('#fff'))
    saveBtn.on('pointerout',  () => saveBtn.setColor('#39ff14'))
    saveBtn.on('pointerdown', () => this._save())

    const menuBtn = this.add.text(W / 2 + u * 4, by, 'MENU', {
      fontFamily: "'Press Start 2P'",
      fontSize:   font.md + 'px',
      color:      '#ff2d78',
      backgroundColor: '#110000',
      padding:    { x: u * 0.6, y: u * 0.3 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    menuBtn.on('pointerover', () => menuBtn.setColor('#fff'))
    menuBtn.on('pointerout',  () => menuBtn.setColor('#ff2d78'))
    menuBtn.on('pointerdown', () => { audio.playMenuBeep(330); this.scene.start('MenuScene') })

    this._btnContainer.add([saveBtn, menuBtn])
  }

  _onKey(e) {
    if (this.phase !== 'entry') return
    const idx = LETTERS.indexOf(this.initials[this.cursorPos])
    switch (e.key) {
      case 'ArrowUp':
        this.initials[this.cursorPos] = LETTERS[(idx + 1) % LETTERS.length]
        audio.playMenuBeep(500); this._drawInitials(); break
      case 'ArrowDown':
        this.initials[this.cursorPos] = LETTERS[(idx - 1 + LETTERS.length) % LETTERS.length]
        audio.playMenuBeep(400); this._drawInitials(); break
      case 'ArrowRight': case 'Tab':
        if (this.cursorPos < 2) { this.cursorPos++; audio.playMenuBeep(440); this._drawInitials() }
        else this._save(); break
      case 'Enter': this._save(); break
      case 'ArrowLeft':
        if (this.cursorPos > 0) { this.cursorPos--; audio.playMenuBeep(440); this._drawInitials() } break
    }
  }

  _save() {
    if (this.phase === 'saved') return
    this.phase = 'saved'
    const ini = this.initials.join('')
    Leaderboard.save(ini, this.score, this.levelId, this.tricks)
    audio.playLevelUp()
    if (this._initContainer) this._initContainer.destroy()
    const { W, H, font } = this._L
    this.add.text(W / 2, H * 0.73, ini + ' - SAVED!', {
      fontFamily: "'Press Start 2P'",
      fontSize:   font.lg + 'px',
      color:      '#39ff14',
      stroke:     '#000',
      strokeThickness: 2,
    }).setOrigin(0.5)
    this.time.delayedCall(1200, () => this.scene.start('LeaderboardScene', { fromGame: true }))
  }
}
