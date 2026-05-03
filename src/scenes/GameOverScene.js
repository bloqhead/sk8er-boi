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
    this._L = L

    // Background + scanlines
    this.add.rectangle(0, 0, W, H, 0x080510).setOrigin(0)
    for (let y = 0; y < H; y += 4) {
      this.add.rectangle(0, y, W, 2, 0x000000, 0.12).setOrigin(0)
    }
    for (let i = 0; i < 50; i++) {
      const g = this.add.graphics()
      g.fillStyle(0xffffff, Math.random() * 0.18 + 0.04)
      g.fillRect(Math.random() * W | 0, Math.random() * H | 0, 1, 1)
    }

    // Title
    const titleColor = this.won ? '#f5e642' : '#ff2d78'
    this.add.text(W / 2, H * 0.05, this.won ? 'YOU WIN!!' : 'GAME OVER', {
      fontFamily: "'Press Start 2P'",
      fontSize:   font.xl + 'px',
      color:      titleColor,
      stroke:     '#000',
      strokeThickness: Math.max(3, font.xl * 0.22),
    }).setOrigin(0.5)

    // Score
    this.add.text(W / 2, H * 0.17, 'SCORE: ' + this.score.toLocaleString(), {
      fontFamily: "'Press Start 2P'", fontSize: font.lg + 'px', color: '#f5e642',
    }).setOrigin(0.5)

    // Stats
    const level = LEVELS.find(l => l.id === this.levelId)
    const stats = [
      { label: 'LEVEL',    value: level?.name || 'LVL ' + this.levelId },
      { label: 'TRICKS',   value: String(this.tricks) },
      { label: 'DISTANCE', value: this.distance + 'm' },
    ]
    const statGap = Math.max(14, font.md * 2.0)
    stats.forEach((s, i) => {
      const y = H * 0.28 + i * statGap
      this.add.text(W * 0.12, y, s.label + ':', {
        fontFamily: "'Press Start 2P'", fontSize: font.sm + 'px', color: '#888888',
      })
      this.add.text(W * 0.88, y, s.value, {
        fontFamily: "'Press Start 2P'", fontSize: font.sm + 'px', color: '#ffffff',
      }).setOrigin(1, 0)
    })

    // Rank
    const rank = Leaderboard.getRank(this.score)
    this.add.text(W / 2, H * 0.48, 'RANK: #' + rank, {
      fontFamily: "'Press Start 2P'", fontSize: font.md + 'px',
      color: rank <= 3 ? '#f5e642' : '#aaaaaa',
    }).setOrigin(0.5)

    // Initials header
    this.add.text(W / 2, H * 0.555, '── ENTER INITIALS ──', {
      fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#333366',
    }).setOrigin(0.5)

    // Layout constants for initials widget
    // Slot is taller to give room for arrows above and below
    this._slotCW = Math.min(72, Math.floor(W * 0.22))
    this._slotH  = Math.min(52, Math.floor(W * 0.16))
    this._slotY  = H * 0.67

    this._drawInitialsWithControls()
    this._drawButtons()

    this.input.keyboard.removeAllListeners()
    this.input.keyboard.on('keydown', this._onKey, this)
  }

  _drawInitialsWithControls() {
    if (this._initContainer) this._initContainer.destroy()
    this._initContainer = this.add.container(0, 0)

    const { W, H, font, u } = this._L
    const cw   = this._slotCW
    const ch   = this._slotH
    const cy   = this._slotY
    const gap  = Math.max(8, u * 0.5)

    const totalW = 3 * cw + 2 * gap
    const startX = (W - totalW) / 2 + cw / 2

    // Arrow button metrics — generous tap targets
    const arrowSize  = Math.max(font.lg, 14)
    const arrowPadX  = Math.max(16, cw * 0.4)
    const arrowPadY  = Math.max(10, u * 0.5)
    const arrowUpY   = cy - ch / 2 - arrowPadY - arrowSize / 2
    const arrowDnY   = cy + ch / 2 + arrowPadY + arrowSize / 2

    this.initials.forEach((ch_, i) => {
      const cx  = startX + i * (cw + gap)
      const sel = i === this.cursorPos && this.phase === 'entry'

      // Slot box
      const box = this.add.graphics()
      box.fillStyle(sel ? 0x180030 : 0x0a0818, 1)
      box.lineStyle(sel ? 2.5 : 1, sel ? 0xf5e642 : 0x222255, 1)
      box.fillRoundedRect(-cw/2, -ch/2, cw, ch, 4)
      box.strokeRoundedRect(-cw/2, -ch/2, cw, ch, 4)
      box.x = cx; box.y = cy
      this._initContainer.add(box)

      // Letter
      const fontSize = Math.min(font.lg, Math.floor(cw * 0.55))
      const ltr = this.add.text(cx, cy, ch_, {
        fontFamily: "'Press Start 2P'",
        fontSize:   fontSize + 'px',
        color:      sel ? '#f5e642' : '#dddddd',
      }).setOrigin(0.5)
      if (sel) this.tweens.add({ targets: ltr, alpha: 0.15, duration: 350, yoyo: true, repeat: -1 })
      this._initContainer.add(ltr)

      // ▲ UP — tap target is a large invisible rectangle + visible label
      const upHitW  = cw * 1.1
      const upHitH  = Math.max(40, arrowPadY * 2 + arrowSize)
      const upHit   = this.add.rectangle(cx, arrowUpY, upHitW, upHitH, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
      const upLabel = this.add.text(cx, arrowUpY, '▲', {
        fontFamily: "'Press Start 2P'",
        fontSize:   arrowSize + 'px',
        color:      sel ? '#f5e642' : '#444488',
      }).setOrigin(0.5)

      upHit.on('pointerdown', () => {
        if (this.phase !== 'entry') return
        const idx = LETTERS.indexOf(this.initials[i])
        this.initials[i] = LETTERS[(idx + 1) % LETTERS.length]
        audio.playMenuBeep(520)
        this._drawInitialsWithControls()
      })
      upHit.on('pointerover', () => upLabel.setColor('#ffffff'))
      upHit.on('pointerout',  () => upLabel.setColor(sel ? '#f5e642' : '#444488'))

      // ▼ DOWN
      const dnHit   = this.add.rectangle(cx, arrowDnY, upHitW, upHitH, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
      const dnLabel = this.add.text(cx, arrowDnY, '▼', {
        fontFamily: "'Press Start 2P'",
        fontSize:   arrowSize + 'px',
        color:      sel ? '#f5e642' : '#444488',
      }).setOrigin(0.5)

      dnHit.on('pointerdown', () => {
        if (this.phase !== 'entry') return
        const idx = LETTERS.indexOf(this.initials[i])
        this.initials[i] = LETTERS[(idx - 1 + LETTERS.length) % LETTERS.length]
        audio.playMenuBeep(380)
        this._drawInitialsWithControls()
      })
      dnHit.on('pointerover', () => dnLabel.setColor('#ffffff'))
      dnHit.on('pointerout',  () => dnLabel.setColor(sel ? '#f5e642' : '#444488'))

      this._initContainer.add([upHit, upLabel, dnHit, dnLabel])
    })

    // NEXT / ENTER — sits below the down arrows, well clear of them
    const nextY   = arrowDnY + Math.max(24, this._L.u * 1.5)
    const nextLabel = this.cursorPos < 2 ? 'NEXT  ▶' : '✓ ENTER'
    const nextColor = this.cursorPos < 2 ? '#00f5ff' : '#39ff14'

    const nextBtnBg = this.add.rectangle(W / 2, nextY, Math.min(W * 0.55, 200), Math.max(36, font.md * 2.8), 0x001122, 1)
      .setStrokeStyle(1.5, this.cursorPos < 2 ? 0x00f5ff : 0x39ff14, 1)
      .setInteractive({ useHandCursor: true })
    const nextBtnTxt = this.add.text(W / 2, nextY, nextLabel, {
      fontFamily: "'Press Start 2P'", fontSize: font.md + 'px', color: nextColor,
    }).setOrigin(0.5)

    nextBtnBg.on('pointerdown', () => {
      if (this.phase !== 'entry') return
      if (this.cursorPos < 2) {
        this.cursorPos++
        audio.playMenuBeep(440)
        this._drawInitialsWithControls()
      } else {
        this._save()
      }
    })
    nextBtnBg.on('pointerover', () => { nextBtnTxt.setColor('#ffffff'); nextBtnBg.setFillStyle(0x002244) })
    nextBtnBg.on('pointerout',  () => { nextBtnTxt.setColor(nextColor); nextBtnBg.setFillStyle(0x001122) })

    this._initContainer.add([nextBtnBg, nextBtnTxt])
  }

  _drawButtons() {
    if (this._btnContainer) this._btnContainer.destroy()
    this._btnContainer = this.add.container(0, 0)
    const { W, H, font, u } = this._L
    const by = H * 0.94

    const saveBtn = this.add.text(W / 2 - u * 5, by, 'SAVE', {
      fontFamily: "'Press Start 2P'", fontSize: font.md + 'px', color: '#39ff14',
      backgroundColor: '#001100', padding: { x: u * 0.7, y: u * 0.35 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    saveBtn.on('pointerdown', () => this._save())
    saveBtn.on('pointerover', () => saveBtn.setColor('#fff'))
    saveBtn.on('pointerout',  () => saveBtn.setColor('#39ff14'))

    const menuBtn = this.add.text(W / 2 + u * 5, by, 'MENU', {
      fontFamily: "'Press Start 2P'", fontSize: font.md + 'px', color: '#ff2d78',
      backgroundColor: '#110000', padding: { x: u * 0.7, y: u * 0.35 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    menuBtn.on('pointerdown', () => { audio.playMenuBeep(330); this.scene.start('MenuScene') })
    menuBtn.on('pointerover', () => menuBtn.setColor('#fff'))
    menuBtn.on('pointerout',  () => menuBtn.setColor('#ff2d78'))

    this._btnContainer.add([saveBtn, menuBtn])
  }

  _onKey(e) {
    if (this.phase !== 'entry') return
    const idx = LETTERS.indexOf(this.initials[this.cursorPos])
    switch (e.key) {
      case 'ArrowUp':
        this.initials[this.cursorPos] = LETTERS[(idx + 1) % LETTERS.length]
        audio.playMenuBeep(520); this._drawInitialsWithControls(); break
      case 'ArrowDown':
        this.initials[this.cursorPos] = LETTERS[(idx - 1 + LETTERS.length) % LETTERS.length]
        audio.playMenuBeep(380); this._drawInitialsWithControls(); break
      case 'ArrowRight': case 'Tab':
        if (this.cursorPos < 2) { this.cursorPos++; audio.playMenuBeep(440); this._drawInitialsWithControls() }
        else this._save(); break
      case 'ArrowLeft':
        if (this.cursorPos > 0) { this.cursorPos--; audio.playMenuBeep(440); this._drawInitialsWithControls() } break
      case 'Enter': this._save(); break
    }
  }

  _save() {
    if (this.phase === 'saved') return
    this.phase = 'saved'
    const ini = this.initials.join('')
    Leaderboard.save(ini, this.score, this.levelId, this.tricks)
    audio.playLevelUp()
    if (this._initContainer) this._initContainer.destroy()
    if (this._btnContainer)  this._btnContainer.destroy()
    const { W, H, font } = this._L
    const saved = this.add.text(W / 2, H * 0.73, ini + ' — SAVED!', {
      fontFamily: "'Press Start 2P'", fontSize: font.lg + 'px', color: '#39ff14',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: saved, alpha: 1, y: H * 0.70, duration: 280, ease: 'Back.Out' })
    this.time.delayedCall(1200, () => this.scene.start('LeaderboardScene', { fromGame: true }))
  }
}
