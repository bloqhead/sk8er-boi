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

    // Background
    this.add.rectangle(0, 0, W, H, 0x080510).setOrigin(0)
    // Subtle scanline texture
    for (let y = 0; y < H; y += 4) {
      this.add.rectangle(0, y, W, 2, 0x000000, 0.15).setOrigin(0)
    }
    // Stars
    for (let i = 0; i < 50; i++) {
      const g = this.add.graphics()
      g.fillStyle(0xffffff, Math.random() * 0.2 + 0.05)
      g.fillRect(Math.random() * W | 0, Math.random() * H | 0, 1, 1)
    }

    // Title
    const titleStr   = this.won ? 'YOU WIN!!' : 'GAME OVER'
    const titleColor = this.won ? '#f5e642'   : '#ff2d78'
    this.add.text(W / 2, H * 0.06, titleStr, {
      fontFamily: "'Press Start 2P'",
      fontSize:   font.xl + 'px',
      color:      titleColor,
      stroke:     '#000',
      strokeThickness: Math.max(3, font.xl * 0.22),
    }).setOrigin(0.5)

    // Score
    this.add.text(W / 2, H * 0.19, 'SCORE: ' + this.score.toLocaleString(), {
      fontFamily: "'Press Start 2P'", fontSize: font.lg + 'px', color: '#f5e642',
    }).setOrigin(0.5)

    // Stats grid
    const level = LEVELS.find(l => l.id === this.levelId)
    const stats = [
      { label: 'LEVEL',    value: level?.name || 'LVL ' + this.levelId },
      { label: 'TRICKS',   value: String(this.tricks) },
      { label: 'DISTANCE', value: this.distance + 'm' },
    ]
    const statY   = H * 0.30
    const statGap = Math.max(16, font.md * 2.2)
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
    this.add.text(W / 2, H * 0.52, 'RANK: #' + rank, {
      fontFamily: "'Press Start 2P'", fontSize: font.md + 'px',
      color: rank <= 3 ? '#f5e642' : '#aaaaaa',
    }).setOrigin(0.5)

    // Divider
    this.add.text(W / 2, H * 0.59, '── ENTER YOUR INITIALS ──', {
      fontFamily: "'Press Start 2P'", fontSize: font.xs + 'px', color: '#333366',
    }).setOrigin(0.5)

    // Letter slots + touch controls
    this._slotY   = H * 0.67
    this._slotCW  = Math.min(64, W * 0.20)
    this._drawInitialsWithControls()

    // Save / Menu buttons
    this._drawButtons()

    // Keyboard
    this.input.keyboard.removeAllListeners()
    this.input.keyboard.on('keydown', this._onKey, this)
  }

  _drawInitialsWithControls() {
    if (this._initContainer) this._initContainer.destroy()
    this._initContainer = this.add.container(0, 0)

    const { W, font, u } = this._L
    const cw  = this._slotCW
    const cy  = this._slotY
    const gap = u * 0.6
    // 3 slots, centred
    const totalW = 3 * cw + 2 * gap
    const startX = (W - totalW) / 2 + cw / 2

    this.initials.forEach((ch, i) => {
      const cx  = startX + i * (cw + gap)
      const sel = i === this.cursorPos && this.phase === 'entry'

      // ── Slot box ─────────────────────────────────────────────────
      const box = this.add.graphics()
      box.lineStyle(sel ? 2 : 1, sel ? 0xf5e642 : 0x222255, 1)
      box.fillStyle(sel ? 0x110022 : 0x080818, 1)
      box.fillRect(-cw/2, -cw*0.45, cw, cw * 0.9)
      box.strokeRect(-cw/2, -cw*0.45, cw, cw * 0.9)
      box.x = cx; box.y = cy

      // ── Letter ───────────────────────────────────────────────────
      const ltr = this.add.text(cx, cy, ch, {
        fontFamily: "'Press Start 2P'",
        fontSize:   Math.min(font.lg, cw * 0.52) + 'px',
        color:      sel ? '#f5e642' : '#cccccc',
      }).setOrigin(0.5)
      if (sel) {
        this.tweens.add({ targets: ltr, alpha: 0.15, duration: 360, yoyo: true, repeat: -1 })
      }

      // ── ▲ UP button (touch) ───────────────────────────────────────
      const upBtn = this._makeArrowBtn(cx, cy - cw * 0.55, '▲', sel, () => {
        if (this.phase !== 'entry') return
        const idx = LETTERS.indexOf(this.initials[i])
        this.initials[i] = LETTERS[(idx + 1) % LETTERS.length]
        audio.playMenuBeep(500)
        this._drawInitialsWithControls()
      })

      // ── ▼ DOWN button (touch) ─────────────────────────────────────
      const dnBtn = this._makeArrowBtn(cx, cy + cw * 0.55, '▼', sel, () => {
        if (this.phase !== 'entry') return
        const idx = LETTERS.indexOf(this.initials[i])
        this.initials[i] = LETTERS[(idx - 1 + LETTERS.length) % LETTERS.length]
        audio.playMenuBeep(400)
        this._drawInitialsWithControls()
      })

      this._initContainer.add([box, ltr, upBtn, dnBtn])
    })

    // ── NEXT / ENTER button ───────────────────────────────────────────
    const { H } = this._L
    const nextLabel = this.cursorPos < 2 ? 'NEXT ▶' : 'ENTER!'
    const nextColor = this.cursorPos < 2 ? '#00f5ff' : '#39ff14'
    const nextBg    = this.cursorPos < 2 ? 0x001122  : 0x001100
    const nextBtn = this.add.text(W / 2, this._slotY + this._slotCW * 0.65, nextLabel, {
      fontFamily: "'Press Start 2P'", fontSize: this._L.font.md + 'px',
      color: nextColor, backgroundColor: '#' + nextBg.toString(16).padStart(6, '0'),
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    nextBtn.on('pointerdown', () => {
      if (this.phase !== 'entry') return
      if (this.cursorPos < 2) {
        this.cursorPos++
        audio.playMenuBeep(440)
        this._drawInitialsWithControls()
      } else {
        this._save()
      }
    })

    this._initContainer.add(nextBtn)
  }

  _makeArrowBtn(x, y, label, active, onTap) {
    const { font, u } = this._L
    const btn = this.add.text(x, y, label, {
      fontFamily: "'Press Start 2P'",
      fontSize: Math.max(8, font.sm) + 'px',
      color: active ? '#f5e642' : '#444466',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btn.on('pointerdown', onTap)
    btn.on('pointerover', () => btn.setColor('#ffffff'))
    btn.on('pointerout',  () => btn.setColor(active ? '#f5e642' : '#444466'))
    return btn
  }

  _drawButtons() {
    if (this._btnContainer) this._btnContainer.destroy()
    this._btnContainer = this.add.container(0, 0)
    const { W, H, font, u } = this._L
    const by = H * 0.91

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
        audio.playMenuBeep(500); this._drawInitialsWithControls(); break
      case 'ArrowDown':
        this.initials[this.cursorPos] = LETTERS[(idx - 1 + LETTERS.length) % LETTERS.length]
        audio.playMenuBeep(400); this._drawInitialsWithControls(); break
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
    const saved = this.add.text(W / 2, H * 0.70, ini + ' — SAVED!', {
      fontFamily: "'Press Start 2P'", fontSize: font.lg + 'px', color: '#39ff14',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: saved, alpha: 1, y: H * 0.67, duration: 300, ease: 'Back.Out' })
    this.time.delayedCall(1200, () => this.scene.start('LeaderboardScene', { fromGame: true }))
  }
}
