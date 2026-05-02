import { GAME_CONSTANTS } from '../data/levels.js'

export class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene')
    this.score = 0
    this.lives = GAME_CONSTANTS.LIVES
    this.charge = 0
    this.speed = 320
    this.progress = 0
  }

  create() {
    const { width, height } = this.scale
    const S = 4

    this.lives = GAME_CONSTANTS.LIVES

    // Score
    this.scoreBg = this.add.rectangle(S * 2, S * 2, 220, S * 7, 0x000000, 0.6).setOrigin(0)
    this.scoreText = this.add.text(S * 4, S * 3, 'SCORE: 0', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 2}px`,
      color: '#f5e642'
    })

    // Lives (hearts)
    this.hearts = []
    this._createHearts(width, S)

    // Speed indicator
    this.speedText = this.add.text(width / 2, S * 3, 'SPD: ---', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 1.5}px`,
      color: '#00f5ff'
    }).setOrigin(0.5, 0)

    // Level progress bar
    const barY = S * 1
    const barW = width * 0.35
    const barX = (width - barW) / 2
    this.progressBg = this.add.rectangle(barX, height - S * 5, barW, S * 2, 0x333333).setOrigin(0, 0.5)
    this.progressFg = this.add.rectangle(barX, height - S * 5, 0, S * 2, 0x39ff14).setOrigin(0, 0.5)
    this.progressLabel = this.add.text(width / 2, height - S * 8, 'LEVEL PROGRESS', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 1}px`,
      color: '#666666'
    }).setOrigin(0.5, 0)

    // Charge bar (bottom)
    this.chargeBg = this.add.rectangle(S * 4, height - S * 7, 120, S * 3, 0x333333).setOrigin(0, 0.5)
    this.chargeFg = this.add.rectangle(S * 4, height - S * 7, 0, S * 3, 0xff2d78).setOrigin(0, 0.5)
    this.chargeLabel = this.add.text(S * 4, height - S * 11, 'OLLIE', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 1}px`,
      color: '#ff2d78'
    })

    // Trick popup
    this.trickText = this.add.text(width / 2, height * 0.4, '', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 4}px`,
      color: '#00f5ff',
      stroke: '#000000',
      strokeThickness: S * 2
    }).setOrigin(0.5).setAlpha(0)

    // Level name
    this.levelName = this.add.text(width - S * 4, S * 3, '', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 2}px`,
      color: '#ff2d78'
    }).setOrigin(1, 0)

    // Register events
    const game = this.scene.get('GameScene')
    game.events.on('score-update', (score) => {
      this.score = score
      this.scoreText.setText(`SCORE: ${score.toLocaleString()}`)
    })
    game.events.on('lives-update', (lives) => {
      this.lives = lives
      this._updateHearts()
    })
    game.events.on('trick', (name) => {
      this._showTrick(name)
    })
    game.events.on('level-start', (levelData) => {
      this.levelName.setText(levelData.name)
    })
    game.events.on('distance', (d) => {})
    game.events.on('speed', (spd) => {
      this.speed = spd
      this.speedText.setText(`SPD: ${Math.floor(spd)}`)
    })
    game.events.on('progress', (p) => {
      this.progress = p
      const barW = this.scale.width * 0.35
      this.progressFg.width = p * barW
      const pct = Math.floor(p * 100)
      if (pct >= 80) this.progressFg.setFillStyle(0xf5e642)
      else if (pct >= 50) this.progressFg.setFillStyle(0x00f5ff)
      else this.progressFg.setFillStyle(0x39ff14)
    })
    game.events.on('charge', (c) => {
      this.chargeFg.width = c * 120
      const color = c > 0.7 ? 0xf5e642 : c > 0.4 ? 0xff6600 : 0xff2d78
      this.chargeFg.setFillStyle(color)
      if (c > 0) {
        this.chargeLabel.setColor(c > 0.7 ? '#f5e642' : '#ff6600')
      }
    })

    this.scale.on('resize', this._onResize, this)
  }

  _createHearts(width, S) {
    for (const h of this.hearts) h.destroy()
    this.hearts = []
    for (let i = 0; i < GAME_CONSTANTS.LIVES; i++) {
      const heart = this.add.image(width - S * 4 - i * (S * 4 + 4), S * 4, 'heart_full')
        .setOrigin(1, 0)
      this.hearts.push(heart)
    }
  }

  _updateHearts() {
    this.hearts.forEach((h, i) => {
      h.setTexture(i < this.lives ? 'heart_full' : 'heart_empty')
    })
  }

  _showTrick(name) {
    this.trickText.setText(name)
    this.trickText.setAlpha(1)
    this.trickText.setScale(1.5)
    this.tweens.add({
      targets: this.trickText,
      alpha: 0,
      scaleX: 1,
      scaleY: 1,
      y: this.scale.height * 0.32,
      duration: 900,
      ease: 'Cubic.Out',
      onComplete: () => {
        this.trickText.y = this.scale.height * 0.4
      }
    })
  }

  _onResize(gameSize) {
    const { width, height } = gameSize
    const S = 4
    this._createHearts(width, S)
    this.speedText.setX(width / 2)
    const barW = width * 0.35
    const barX = (width - barW) / 2
    this.progressBg.setX(barX).setWidth(barW)
    this.progressFg.setX(barX)
    this.progressLabel.setX(width / 2)
    this.levelName.setX(width - S * 4)
    this.progressBg.setY(height - S * 5)
    this.progressFg.setY(height - S * 5)
    this.progressLabel.setY(height - S * 8)
    this.chargeBg.setY(height - S * 7)
    this.chargeFg.setY(height - S * 7)
    this.chargeLabel.setY(height - S * 11)
  }
}
