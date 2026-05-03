export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }

  create() {
    // Wait for web fonts before starting — prevents fallback font flash
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => this.scene.start('PreloadScene'))
    } else {
      // Fallback: small delay to let fonts load
      this.time.delayedCall(300, () => this.scene.start('PreloadScene'))
    }
  }
}
