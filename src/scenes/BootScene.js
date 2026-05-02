export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    // Nothing to load in boot - all sprites are generated
  }

  create() {
    this.scene.start('PreloadScene')
  }
}
