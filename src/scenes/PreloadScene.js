import { SpriteFactory } from '../systems/SpriteFactory.js'
import { Leaderboard } from '../data/leaderboard.js'
import { LEVELS } from '../data/levels.js'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene')
  }

  create() {
    const { width, height } = this.scale
    const S = 4

    // Loading screen
    this.add.rectangle(0, 0, width, height, 0x0a0a0f).setOrigin(0)

    const titleText = this.add.text(width / 2, height * 0.35, 'SK8ER BOI', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 8}px`,
      color: '#f5e642',
      stroke: '#000000',
      strokeThickness: S * 2
    }).setOrigin(0.5)

    // Animate title
    this.tweens.add({
      targets: titleText,
      y: height * 0.35 - S * 2,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    })

    const loadText = this.add.text(width / 2, height * 0.58, 'LOADING...', {
      fontFamily: "'Press Start 2P'",
      fontSize: `${S * 3}px`,
      color: '#00f5ff'
    }).setOrigin(0.5)

    // Progress bar
    const barBg = this.add.rectangle(width / 2, height * 0.68, width * 0.5, S * 4, 0x333333).setOrigin(0.5)
    const barFg = this.add.rectangle(width / 2 - width * 0.25, height * 0.68, 0, S * 4, 0x39ff14).setOrigin(0, 0.5)

    // Generate all sprites
    const factory = new SpriteFactory(this)
    const tasks = [
      () => factory.createSkater('skater_idle', 'idle'),
      () => factory.createSkater('skater_roll', 'roll'),
      () => factory.createSkater('skater_ollie', 'ollie'),
      () => factory.createSkater('skater_grind', 'grind'),
      () => factory.createSkater('skater_crash', 'crash'),
      () => factory.createSkater('skater_charge', 'charge'),
      () => factory.createStairs('stairs'),
      () => factory.createChild('child'),
      () => factory.createTrashCan('trash_can'),
      () => factory.createPerson('person_standing', '#4444ff', false),
      () => factory.createPerson('person_walking', '#ff4444', true),
      () => factory.createDog('dog'),
      () => factory.createCone('cone'),
      () => factory.createBarrel('barrel'),
      () => factory.createMailbox('mailbox'),
      () => factory.createFireHydrant('fire_hydrant'),
      () => factory.createNewsBox('news_box'),
      () => factory.createScooter('scooter'),
      () => factory.createCurb('curb'),
      () => factory.createHeart('heart_full', true),
      () => factory.createHeart('heart_empty', false),
      () => factory.createStar('star'),
      () => factory.createParticle('particle_white', '#ffffff', 3),
      () => factory.createParticle('particle_yellow', '#f5e642', 3),
      () => factory.createParticle('particle_pink', '#ff2d78', 3),
      () => factory.createParticle('particle_cyan', '#00f5ff', 3),
      () => factory.createSparkle('sparkle_yellow', '#f5e642'),
      // Create ramps and rails for each level
      ...LEVELS.map(lv => () => factory.createRamp(`ramp_${lv.id}`, 64, 40)),
      ...LEVELS.map(lv => () => factory.createRail(`rail_${lv.id}`, 96, 20)),
    ]

    let i = 0
    const doNext = () => {
      if (i >= tasks.length) {
        // Done
        Leaderboard.seedWithDemoData()
        barFg.width = width * 0.5
        loadText.setText('PRESS ANY KEY!')
        this.tweens.add({
          targets: loadText,
          alpha: 0,
          duration: 400,
          yoyo: true,
          repeat: -1
        })
        this.input.keyboard.once('keydown', () => this.scene.start('MenuScene'))
        this.input.once('pointerdown', () => this.scene.start('MenuScene'))
        return
      }
      try { tasks[i]() } catch (e) { console.warn('Sprite gen error:', e) }
      i++
      barFg.width = (i / tasks.length) * width * 0.5
      this.time.delayedCall(8, doNext)
    }

    this.time.delayedCall(300, doNext)
  }
}
