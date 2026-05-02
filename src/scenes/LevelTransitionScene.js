import { LEVELS } from '../data/levels.js'
import { GAME_W, GAME_H } from '../main.js'
import { audio } from '../audio/AudioManager.js'

export class LevelTransitionScene extends Phaser.Scene {
  constructor() { super('LevelTransitionScene') }

  init(data) {
    this.nextLevelId = data.nextLevelId
    this.score    = data.score    || 0
    this.tricks   = data.tricks   || 0
    this.distance = data.distance || 0
  }

  create() {
    const gw = GAME_W, gh = GAME_H
    const level = LEVELS.find(l => l.id === this.nextLevelId)
    audio.playLevelUp()

    this.add.rectangle(0, 0, gw, gh, 0x000000).setOrigin(0)

    const title = this.add.text(gw/2, -20, 'LEVEL CLEAR!', {
      fontFamily: "'Press Start 2P'", fontSize: '14px', color: '#f5e642',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5)
    this.tweens.add({ targets: title, y: gh*0.20, duration: 350, ease: 'Bounce.Out' })

    const stats = [
      { label: 'SCORE',    value: this.score.toLocaleString(), color: '#f5e642' },
      { label: 'TRICKS',   value: this.tricks,                 color: '#00f5ff' },
      { label: 'DISTANCE', value: `${this.distance}m`,         color: '#39ff14' },
    ]
    stats.forEach((s, i) => {
      this.time.delayedCall(500 + i*200, () => {
        const row = this.add.container(gw/2, gh*0.38 + i*18)
        row.add([
          this.add.text(-80, 0, s.label+':', {
            fontFamily: "'Press Start 2P'", fontSize: '5px', color: '#888'
          }),
          this.add.text(60, 0, String(s.value), {
            fontFamily: "'Press Start 2P'", fontSize: '6px', color: s.color
          }).setOrigin(1,0)
        ])
        row.setAlpha(0)
        this.tweens.add({ targets: row, alpha: 1, duration: 150 })
        audio.playScoreUp(i+1)
      })
    })

    if (level) {
      this.time.delayedCall(1600, () => {
        const next = this.add.text(gw/2, gh*0.68, `NEXT: ${level.name}`, {
          fontFamily: "'Press Start 2P'", fontSize: '10px', color: '#ff2d78',
          stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setAlpha(0)
        this.tweens.add({ targets: next, alpha: 1, scaleX:{from:0.6,to:1}, scaleY:{from:0.6,to:1}, duration: 350, ease: 'Back.Out' })
        this.add.text(gw/2, gh*0.80, level.subtitle, {
          fontFamily: "'Press Start 2P'", fontSize: '5px', color: '#555'
        }).setOrigin(0.5).setAlpha(0)
      })
    }

    this.time.delayedCall(3200, () => {
      this.cameras.main.fadeOut(300, 0,0,0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { levelId: this.nextLevelId })
        this.scene.launch('HUDScene')
      })
    })
  }
}
