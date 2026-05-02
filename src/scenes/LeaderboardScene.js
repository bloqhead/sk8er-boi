import { Leaderboard } from '../data/leaderboard.js'
import { audio } from '../audio/AudioManager.js'

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('LeaderboardScene')
  }

  init(data) {
    this.fromGame = data.fromGame || false
  }

  create() {
    const { width, height } = this.scale
    const S = 4

    this.add.rectangle(0, 0, width, height, 0x0a0a0f).setOrigin(0)
    this._addStars(width, height)

    // Title
    this.add.text(width / 2, height * 0.07, 'HIGH SCORES', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 5}px`,
      color: '#f5e642',
      stroke: '#000000',
      strokeThickness: S * 2
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.16, '━━━━━━━━━━━━━━━━━━━', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 2}px`,
      color: '#333333'
    }).setOrigin(0.5)

    // Column headers
    const headerY = height * 0.21
    ;[
      { x: 0.08, text: 'RANK' },
      { x: 0.22, text: 'NAME' },
      { x: 0.5, text: 'SCORE' },
      { x: 0.72, text: 'TRICKS' },
      { x: 0.88, text: 'DATE' }
    ].forEach(col => {
      this.add.text(width * col.x, headerY, col.text, {
        fontFamily: "'Press Start 2P'",
        fontSize: `${S * 1.5}px`,
        color: '#00f5ff'
      })
    })

    // Entries
    const entries = Leaderboard.getTopN(10)
    const rankColors = ['#f5e642', '#cccccc', '#cd7f32']
    const rowH = (height * 0.62) / Math.max(entries.length, 8)

    entries.forEach((entry, i) => {
      const y = height * 0.27 + i * rowH
      const isTop3 = i < 3
      const rowColor = isTop3 ? (rankColors[i] || '#ffffff') : '#888888'

      // Row bg
      if (i % 2 === 0) {
        this.add.rectangle(width / 2, y + rowH / 2, width - S * 8, rowH - S, 0x111122, 0.4)
      }

      // Rank
      const rankLabel = i === 0 ? '👑 1' : `#${i + 1}`
      this.add.text(width * 0.08, y + 4, isTop3 ? `${i + 1}ST` : `#${i + 1}`, {
        fontFamily: "'Press Start 2P'",
        fontSize: `${S * 1.5}px`,
        color: rowColor
      })

      // Initials
      this.add.text(width * 0.22, y + 4, entry.initials, {
        fontFamily: "'Press Start 2P'",
        fontSize: `${S * 2.5}px`,
        color: rowColor
      })

      // Score
      this.add.text(width * 0.5, y + 4, entry.score.toLocaleString(), {
        fontFamily: "'Press Start 2P'",
        fontSize: `${S * 1.5}px`,
        color: '#ffffff'
      })

      // Tricks
      this.add.text(width * 0.72, y + 4, String(entry.tricks || 0), {
        fontFamily: "'Press Start 2P'",
        fontSize: `${S * 1.5}px`,
        color: '#aaaaaa'
      })

      // Date
      this.add.text(width * 0.88, y + 4, entry.date || '??-??-??', {
        fontFamily: "'Press Start 2P'",
        fontSize: `${S * 1}px`,
        color: '#555555'
      })
    })

    if (entries.length === 0) {
      this.add.text(width / 2, height * 0.5, 'NO SCORES YET!\nBE THE FIRST!', {
        fontFamily: "'Press Start 2P'",
        fontSize: `${S * 3}px`,
        color: '#555555',
        align: 'center'
      }).setOrigin(0.5)
    }

    // Divider
    this.add.text(width / 2, height * 0.88, '━━━━━━━━━━━━━━━━━━━', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 2}px`,
      color: '#333333'
    }).setOrigin(0.5)

    // Buttons
    const backBtn = this.add.text(width / 2 - 90, height * 0.93, '◄ MENU', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 2.5}px`,
      color: '#ff2d78',
      backgroundColor: '#110011',
      padding: { x: S, y: S }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'))
    backBtn.on('pointerout', () => backBtn.setColor('#ff2d78'))
    backBtn.on('pointerdown', () => {
      audio.playMenuBeep(330)
      this.scene.start('MenuScene')
    })

    const playBtn = this.add.text(width / 2 + 90, height * 0.93, 'PLAY ►', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 2.5}px`,
      color: '#39ff14',
      backgroundColor: '#001100',
      padding: { x: S, y: S }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    playBtn.on('pointerover', () => playBtn.setColor('#ffffff'))
    playBtn.on('pointerout', () => playBtn.setColor('#39ff14'))
    playBtn.on('pointerdown', () => {
      audio.playMenuBeep(440)
      this.scene.start('MenuScene')
    })

    const clearBtn = this.add.text(width - S * 2, height * 0.93, 'CLR', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 1}px`,
      color: '#333333'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })

    clearBtn.on('pointerdown', () => {
      Leaderboard.clear()
      this.scene.restart()
    })

    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'))
    this.input.keyboard.on('keydown-ENTER', () => this.scene.start('MenuScene'))
  }

  _addStars(w, h) {
    const g = this.add.graphics()
    for (let i = 0; i < 60; i++) {
      g.fillStyle(0xffffff, Math.random() * 0.3 + 0.1)
      g.fillRect(Math.floor(Math.random() * w / 4) * 4, Math.floor(Math.random() * h / 4) * 4, 4, 4)
    }
  }
}
