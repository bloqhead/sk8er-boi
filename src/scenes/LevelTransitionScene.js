import { LEVELS } from '../data/levels.js'
import { audio } from '../audio/AudioManager.js'

export class LevelTransitionScene extends Phaser.Scene {
  constructor() {
    super('LevelTransitionScene')
  }

  init(data) {
    this.nextLevelId = data.nextLevelId
    this.score = data.score || 0
    this.tricks = data.tricks || 0
    this.distance = data.distance || 0
  }

  create() {
    const { width, height } = this.scale
    const S = 4
    const level = LEVELS.find(l => l.id === this.nextLevelId)

    audio.playLevelUp()

    // Dark overlay
    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0)

    // "LEVEL COMPLETE!" text
    const complete = this.add.text(width / 2, -80, 'LEVEL COMPLETE!', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 5}px`,
      color: '#f5e642',
      stroke: '#000000',
      strokeThickness: S * 2
    }).setOrigin(0.5)

    this.tweens.add({
      targets: complete,
      y: height * 0.25,
      duration: 400,
      ease: 'Bounce.Out'
    })

    // Bonus display
    this.time.delayedCall(600, () => {
      const bonuses = [
        { label: 'SCORE', value: this.score.toLocaleString(), color: '#f5e642' },
        { label: 'TRICKS', value: this.tricks, color: '#00f5ff' },
        { label: 'DISTANCE', value: `${this.distance}m`, color: '#39ff14' }
      ]

      bonuses.forEach((b, i) => {
        this.time.delayedCall(i * 250, () => {
          const row = this.add.container(width / 2, height * 0.42 + i * S * 9)
          const label = this.scene.scene.add.text(-140, 0, b.label + ':', {
            fontFamily: "'Press Start 2P'",
            fontSize: `${S * 2.5}px`,
            color: '#aaaaaa'
          })
          const val = this.scene.scene.add.text(80, 0, b.value, {
            fontFamily: "'Press Start 2P'",
            fontSize: `${S * 2.5}px`,
            color: b.color
          })
          row.add([label, val])
          row.setAlpha(0)
          this.tweens.add({ targets: row, alpha: 1, duration: 200 })
          audio.playScoreUp(i + 1)
        })
      })
    })

    // Next level reveal
    if (level) {
      this.time.delayedCall(1800, () => {
        const nextText = this.add.text(width / 2, height * 0.72, `ENTERING:\n${level.name}`, {
          fontFamily: "'Press Start 2P'",
          fontSize: `${S * 4}px`,
          color: '#ff2d78',
          stroke: '#000000',
          strokeThickness: S,
          align: 'center'
        }).setOrigin(0.5).setAlpha(0)

        this.tweens.add({
          targets: nextText,
          alpha: 1,
          scaleX: { from: 0.5, to: 1 },
          scaleY: { from: 0.5, to: 1 },
          duration: 400,
          ease: 'Back.Out'
        })

        const sub = this.add.text(width / 2, height * 0.86, level.subtitle, {
          fontFamily: "'Press Start 2P'",
          fontSize: `${S * 2}px`,
          color: '#888888'
        }).setOrigin(0.5).setAlpha(0)

        this.tweens.add({ targets: sub, alpha: 1, duration: 300, delay: 300 })
      })
    }

    // Auto-advance
    this.time.delayedCall(3500, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { levelId: this.nextLevelId })
        this.scene.launch('HUDScene')
      })
    })
  }
}
