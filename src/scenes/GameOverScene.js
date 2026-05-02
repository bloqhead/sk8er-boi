import { Leaderboard } from '../data/leaderboard.js'
import { LEVELS } from '../data/levels.js'
import { audio } from '../audio/AudioManager.js'

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene')
    this.initials = ['A', 'A', 'A']
    this.cursorPos = 0
    this.phase = 'entry' // 'entry' | 'saved'
  }

  init(data) {
    this.score = data.score || 0
    this.levelId = data.level || 1
    this.tricks = data.tricks || 0
    this.distance = data.distance || 0
    this.won = data.won || false
    this.initials = ['A', 'A', 'A']
    this.cursorPos = 0
    this.phase = 'entry'
  }

  create() {
    const { width, height } = this.scale
    const S = 4

    this.add.rectangle(0, 0, width, height, 0x0a0a0f).setOrigin(0)
    this._addStars(width, height)

    // Title
    const title = this.won ? 'YOU WIN!!' : 'GAME OVER'
    const titleColor = this.won ? '#f5e642' : '#ff2d78'

    this.add.text(width / 2, height * 0.1, title, {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 7}px`,
      color: titleColor,
      stroke: '#000000',
      strokeThickness: S * 2
    }).setOrigin(0.5)

    // Score display
    this.add.text(width / 2, height * 0.26, `SCORE: ${this.score.toLocaleString()}`, {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 4}px`,
      color: '#f5e642'
    }).setOrigin(0.5)

    // Stats
    const level = LEVELS.find(l => l.id === this.levelId)
    const statsY = height * 0.38
    const stats = [
      { label: 'LEVEL REACHED', value: level ? level.name : `LVL ${this.levelId}` },
      { label: 'TRICKS LANDED', value: String(this.tricks) },
      { label: 'DISTANCE', value: `${this.distance}m` }
    ]
    stats.forEach((s, i) => {
      this.add.text(width / 2 - 150, statsY + i * S * 6, s.label + ':', {
        fontFamily: "'Press Start 2P'",
        fontSize: `${S * 1.5}px`,
        color: '#888888'
      })
      this.add.text(width / 2 + 90, statsY + i * S * 6, s.value, {
        fontFamily: "'Press Start 2P'",
        fontSize: `${S * 1.5}px`,
        color: '#ffffff'
      })
    })

    // Rank
    const rank = Leaderboard.getRank(this.score)
    this.add.text(width / 2, statsY + 3 * S * 6 + S * 2, `RANK: #${rank}`, {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 2.5}px`,
      color: rank <= 3 ? '#f5e642' : '#aaaaaa'
    }).setOrigin(0.5)

    // Initials entry
    this.add.text(width / 2, height * 0.65, 'ENTER YOUR INITIALS:', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 2}px`,
      color: '#00f5ff'
    }).setOrigin(0.5)

    this._createInitialEntry(width, height, S)
    this._createButtons(width, height, S)

    // Input
    this.input.keyboard.on('keydown', this._onKey, this)
  }

  _createInitialEntry(width, height, S) {
    if (this._initialsContainer) this._initialsContainer.destroy()
    this._initialsContainer = this.add.container(0, 0)

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'
    const charW = S * 10
    const startX = width / 2 - charW

    this.initials.forEach((ch, i) => {
      const x = startX + i * charW
      const y = height * 0.74

      // Box
      const isActive = i === this.cursorPos && this.phase === 'entry'
      const box = this.add.rectangle(x, y, charW - S, S * 10, isActive ? 0x222244 : 0x111122)
        .setStrokeStyle(S / 2, isActive ? 0xf5e642 : 0x333366)
      const letter = this.add.text(x, y, ch, {
        fontFamily: "'Press Start 2P'",
        fontSize: `${S * 6}px`,
        color: isActive ? '#f5e642' : '#ffffff'
      }).setOrigin(0.5)

      if (isActive) {
        this.tweens.add({
          targets: letter,
          alpha: 0.3,
          duration: 400,
          yoyo: true,
          repeat: -1
        })
      }

      this._initialsContainer.add([box, letter])
    })

    // Arrows hint
    const hint = this.add.text(width / 2, height * 0.83, '↑↓ CHANGE   → NEXT', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 1.5}px`,
      color: '#555555'
    }).setOrigin(0.5)
    this._initialsContainer.add(hint)
  }

  _createButtons(width, height, S) {
    if (this._btnContainer) this._btnContainer.destroy()
    this._btnContainer = this.add.container(0, 0)

    const saveBtn = this.add.text(width / 2 - 80, height * 0.9, 'SAVE', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 3}px`,
      color: '#39ff14',
      backgroundColor: '#001100',
      padding: { x: S * 2, y: S }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    saveBtn.on('pointerover', () => saveBtn.setColor('#ffffff'))
    saveBtn.on('pointerout', () => saveBtn.setColor('#39ff14'))
    saveBtn.on('pointerdown', () => this._saveScore())

    const menuBtn = this.add.text(width / 2 + 80, height * 0.9, 'MENU', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 3}px`,
      color: '#ff2d78',
      backgroundColor: '#110000',
      padding: { x: S * 2, y: S }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    menuBtn.on('pointerover', () => menuBtn.setColor('#ffffff'))
    menuBtn.on('pointerout', () => menuBtn.setColor('#ff2d78'))
    menuBtn.on('pointerdown', () => {
      audio.playMenuBeep(330)
      this.scene.start('MenuScene')
    })

    this._btnContainer.add([saveBtn, menuBtn])
  }

  _onKey(event) {
    if (this.phase !== 'entry') return
    const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'
    const { width, height } = this.scale
    const S = 4

    let ch = this.initials[this.cursorPos]
    const idx = LETTERS.indexOf(ch)

    switch (event.key) {
      case 'ArrowUp':
        this.initials[this.cursorPos] = LETTERS[(idx + 1) % LETTERS.length]
        audio.playMenuBeep(500)
        this._createInitialEntry(width, height, S)
        break
      case 'ArrowDown':
        this.initials[this.cursorPos] = LETTERS[(idx - 1 + LETTERS.length) % LETTERS.length]
        audio.playMenuBeep(400)
        this._createInitialEntry(width, height, S)
        break
      case 'ArrowRight':
      case 'Tab':
      case 'Enter':
        if (this.cursorPos < 2) {
          this.cursorPos++
          audio.playMenuBeep(440)
          this._createInitialEntry(width, height, S)
        } else {
          this._saveScore()
        }
        break
      case 'ArrowLeft':
        if (this.cursorPos > 0) {
          this.cursorPos--
          audio.playMenuBeep(440)
          this._createInitialEntry(width, height, S)
        }
        break
    }
  }

  _saveScore() {
    if (this.phase === 'saved') return
    this.phase = 'saved'
    const initials = this.initials.join('')
    Leaderboard.save(initials, this.score, this.levelId, this.tricks)
    audio.playLevelUp()

    const { width, height } = this.scale
    const S = 4

    if (this._initialsContainer) this._initialsContainer.destroy()

    const saved = this.add.text(width / 2, height * 0.72, `${initials} - SAVED!`, {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 4}px`,
      color: '#39ff14',
      stroke: '#000000',
      strokeThickness: S
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: saved,
      alpha: 1,
      y: height * 0.69,
      duration: 300,
      ease: 'Back.Out'
    })

    // Show leaderboard after save
    this.time.delayedCall(1500, () => {
      this.scene.start('LeaderboardScene', { fromGame: true })
    })
  }

  _addStars(w, h) {
    const g = this.add.graphics()
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w, y = Math.random() * h
      g.fillStyle(0xffffff, Math.random() * 0.4 + 0.1)
      g.fillRect(Math.floor(x / 4) * 4, Math.floor(y / 4) * 4, 4, 4)
    }
  }
}
