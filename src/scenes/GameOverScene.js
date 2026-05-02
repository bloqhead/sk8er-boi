import { Leaderboard } from '../data/leaderboard.js'
import { LEVELS } from '../data/levels.js'
import { GAME_W, GAME_H } from '../main.js'
import { audio } from '../audio/AudioManager.js'

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
    const gw = GAME_W, gh = GAME_H
    this.add.rectangle(0, 0, gw, gh, 0x0a0a0f).setOrigin(0)
    this._stars()

    const titleStr   = this.won ? 'YOU WIN!!' : 'GAME OVER'
    const titleColor = this.won ? '#f5e642'   : '#ff2d78'

    this.add.text(gw/2, gh*0.09, titleStr, {
      fontFamily: "'Press Start 2P'", fontSize: '16px', color: titleColor,
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5)

    this.add.text(gw/2, gh*0.26, 'SCORE: ' + this.score.toLocaleString(), {
      fontFamily: "'Press Start 2P'", fontSize: '9px', color: '#f5e642'
    }).setOrigin(0.5)

    const level = LEVELS.find(l => l.id === this.levelId)
    const stats = [
      { label: 'LEVEL',    value: level?.name || `LVL ${this.levelId}` },
      { label: 'TRICKS',   value: String(this.tricks) },
      { label: 'DISTANCE', value: `${this.distance}m` },
    ]
    stats.forEach((s, i) => {
      this.add.text(gw*0.18, gh*0.38 + i*14, s.label + ':', {
        fontFamily: "'Press Start 2P'", fontSize: '5px', color: '#888888'
      })
      this.add.text(gw*0.78, gh*0.38 + i*14, s.value, {
        fontFamily: "'Press Start 2P'", fontSize: '5px', color: '#ffffff'
      }).setOrigin(1, 0)
    })

    const rank = Leaderboard.getRank(this.score)
    this.add.text(gw/2, gh*0.60, `RANK: #${rank}`, {
      fontFamily: "'Press Start 2P'", fontSize: '6px',
      color: rank <= 3 ? '#f5e642' : '#aaaaaa'
    }).setOrigin(0.5)

    this.add.text(gw/2, gh*0.68, 'ENTER INITIALS:', {
      fontFamily: "'Press Start 2P'", fontSize: '5px', color: '#00f5ff'
    }).setOrigin(0.5)

    this._initContainer = null
    this._drawInitials()
    this._drawButtons()

    this.input.keyboard.on('keydown', this._onKey, this)
  }

  _drawInitials() {
    if (this._initContainer) this._initContainer.destroy()
    this._initContainer = this.add.container(0, 0)
    const gw = GAME_W, gh = GAME_H
    const cw = 22, cy = gh * 0.76

    this.initials.forEach((ch, i) => {
      const cx = gw/2 - cw + i * cw
      const sel = i === this.cursorPos && this.phase === 'entry'
      const box = this.add.rectangle(cx, cy, cw-2, 20, sel ? 0x111133 : 0x0a0a1a)
        .setStrokeStyle(sel ? 1.5 : 0.5, sel ? 0xf5e642 : 0x333366)
      const ltr = this.add.text(cx, cy, ch, {
        fontFamily: "'Press Start 2P'", fontSize: '12px',
        color: sel ? '#f5e642' : '#ffffff'
      }).setOrigin(0.5)
      if (sel) this.tweens.add({ targets: ltr, alpha: 0.2, duration: 380, yoyo: true, repeat: -1 })
      this._initContainer.add([box, ltr])
    })

    this.add.text(GAME_W/2, GAME_H * 0.86, '↑↓ CHANGE   → NEXT', {
      fontFamily: "'Press Start 2P'", fontSize: '4px', color: '#444444'
    }).setOrigin(0.5)
  }

  _drawButtons() {
    if (this._btnContainer) this._btnContainer.destroy()
    this._btnContainer = this.add.container(0, 0)
    const gw = GAME_W, gh = GAME_H

    const saveBtn = this.add.text(gw/2 - 36, gh*0.92, 'SAVE', {
      fontFamily: "'Press Start 2P'", fontSize: '7px', color: '#39ff14',
      backgroundColor: '#001100', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    saveBtn.on('pointerover', () => saveBtn.setColor('#fff'))
    saveBtn.on('pointerout',  () => saveBtn.setColor('#39ff14'))
    saveBtn.on('pointerdown', () => this._save())

    const menuBtn = this.add.text(gw/2 + 36, gh*0.92, 'MENU', {
      fontFamily: "'Press Start 2P'", fontSize: '7px', color: '#ff2d78',
      backgroundColor: '#110000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    menuBtn.on('pointerover', () => menuBtn.setColor('#fff'))
    menuBtn.on('pointerout',  () => menuBtn.setColor('#ff2d78'))
    menuBtn.on('pointerdown', () => { audio.playMenuBeep(330); this.scene.start('MenuScene') })

    this._btnContainer.add([saveBtn, menuBtn])
  }

  _onKey(e) {
    if (this.phase !== 'entry') return
    const idx = LETTERS.indexOf(this.initials[this.cursorPos])
    const gw = GAME_W, gh = GAME_H
    switch (e.key) {
      case 'ArrowUp':
        this.initials[this.cursorPos] = LETTERS[(idx+1) % LETTERS.length]
        audio.playMenuBeep(500); this._drawInitials(); break
      case 'ArrowDown':
        this.initials[this.cursorPos] = LETTERS[(idx-1+LETTERS.length) % LETTERS.length]
        audio.playMenuBeep(400); this._drawInitials(); break
      case 'ArrowRight': case 'Tab':
        if (this.cursorPos < 2) { this.cursorPos++; audio.playMenuBeep(440); this._drawInitials() }
        else this._save()
        break
      case 'Enter': this._save(); break
      case 'ArrowLeft':
        if (this.cursorPos > 0) { this.cursorPos--; audio.playMenuBeep(440); this._drawInitials() }
        break
    }
  }

  _save() {
    if (this.phase === 'saved') return
    this.phase = 'saved'
    const ini = this.initials.join('')
    Leaderboard.save(ini, this.score, this.levelId, this.tricks)
    audio.playLevelUp()
    if (this._initContainer) this._initContainer.destroy()
    this.add.text(GAME_W/2, GAME_H*0.76, ini + ' - SAVED!', {
      fontFamily: "'Press Start 2P'", fontSize: '9px', color: '#39ff14',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5)
    this.time.delayedCall(1200, () => this.scene.start('LeaderboardScene', { fromGame: true }))
  }

  _stars() {
    const g = this.add.graphics()
    for (let i = 0; i < 50; i++) {
      g.fillStyle(0xffffff, Math.random() * 0.3 + 0.05)
      g.fillRect(Math.floor(Math.random() * GAME_W), Math.floor(Math.random() * GAME_H), 1, 1)
    }
  }
}
