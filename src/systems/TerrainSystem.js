import { layout } from './Layout.js'

/**
 * Scrolling terrain with hills and inclines.
 * 
 * Uses layered sine waves to generate a height map.
 * Draws the ground surface as a filled polygon each frame.
 * Exposes groundYAtScreenX() so obstacles and the player ground body
 * can follow the terrain contour.
 * 
 * The physics ground is a row of thin static rectangles (segments)
 * repositioned each frame to approximate the curve — Phaser arcade
 * physics doesn't support slope bodies, so we tile short flat segments.
 */
export class TerrainSystem {
  constructor(scene, levelId) {
    this.scene    = scene
    this.levelId  = levelId
    this.scrollX  = 0

    const L       = layout(scene)
    this.W        = L.W
    this.H        = L.H
    this.baseY    = L.groundY   // flat centre-line
    this.touchBarH = L.touchBarH

    // Graphics for the visible ground surface
    this._gfx = scene.add.graphics().setDepth(-2).setScrollFactor(0)

    // Ground colour per level
    this._surfaceColor = [0x444466, 0x4a7c2f, 0x336644, 0x330066][levelId - 1] ?? 0x444466
    this._fillColor    = [0x0a0a12, 0x1a2e0a, 0x0a1208, 0x050010][levelId - 1] ?? 0x0a0a12

    // Physics ground segments — a row of small static bodies
    // We use 12 segments across the screen width for smooth terrain following
    this.SEGMENTS    = 14
    this._segW       = Math.ceil(this.W / this.SEGMENTS) + 4
    this._segBodies  = []
    this._segObjs    = []
    this._createSegments(scene)

    // Expose current Y at player position
    this.currentY = this.baseY
  }

  _createSegments(scene) {
    for (let i = 0; i < this.SEGMENTS; i++) {
      const seg = scene.add.rectangle(0, 0, this._segW, 10, 0x000000, 0)
      scene.physics.add.existing(seg, true)
      seg.body.setSize(this._segW, 10)
      this._segObjs.push(seg)
      this._segBodies.push(seg.body)
    }
  }

  // Register all segment bodies with a physics collider
  // Call this after player is created: this.physics.add.collider(player, this.terrain.segGroup)
  get segGroup() {
    if (!this._group) {
      this._group = this.scene.physics.add.staticGroup()
      for (const seg of this._segObjs) this._group.add(seg)
    }
    return this._group
  }

  // Height at a given screen X (accounts for scroll offset)
  groundYAtScreenX(screenX) {
    const wx = screenX + this.scrollX
    // Layer 1: long gentle rolling (period ~1400px world)
    const h1 = Math.sin(wx * 0.00145) * 30
    // Layer 2: medium bumps (period ~600px world)
    const h2 = Math.sin(wx * 0.0052 + 1.7) * 14
    // Layer 3: small ripples
    const h3 = Math.sin(wx * 0.017 + 3.1) * 5
    return this.baseY + h1 + h2 + h3
  }

  // Slope angle in radians at a screen X (for tilting player/objects)
  slopeAt(screenX) {
    const eps = 6
    const dy = this.groundYAtScreenX(screenX + eps) - this.groundYAtScreenX(screenX - eps)
    return Math.atan2(dy, eps * 2)
  }

  update(delta, gameSpeed) {
    this.scrollX   += (gameSpeed / 1000) * delta
    this.currentY   = this.groundYAtScreenX(80)   // player is always at screenX ~80

    this._updateSegments()
    this._draw()
  }

  _updateSegments() {
    // Reposition each segment to follow the terrain curve
    for (let i = 0; i < this.SEGMENTS; i++) {
      const screenX = (i + 0.5) * (this.W / this.SEGMENTS)
      const gy      = this.groundYAtScreenX(screenX)
      const obj     = this._segObjs[i]
      obj.x = screenX
      obj.y = gy + 5     // +5 so top of segment aligns with surface
      obj.body.reset(screenX, gy + 5)
    }
    if (this._group) this._group.refresh()
  }

  _draw() {
    const gfx = this._gfx
    gfx.clear()

    const W = this.W
    const H = this.H
    const STEPS = 80
    const pts = []

    for (let i = 0; i <= STEPS; i++) {
      const sx = (i / STEPS) * W
      pts.push({ x: sx, y: this.groundYAtScreenX(sx) })
    }

    // Fill from surface down to bottom of screen
    gfx.fillStyle(this._fillColor, 1)
    gfx.beginPath()
    gfx.moveTo(0, H)
    for (const p of pts) gfx.lineTo(p.x, p.y)
    gfx.lineTo(W, H)
    gfx.closePath()
    gfx.fillPath()

    // Bright surface line
    gfx.lineStyle(3, this._surfaceColor, 1)
    gfx.beginPath()
    gfx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) gfx.lineTo(pts[i].x, pts[i].y)
    gfx.strokePath()

    // Subtle second stripe below
    gfx.lineStyle(1, this._surfaceColor, 0.3)
    gfx.beginPath()
    gfx.moveTo(pts[0].x, pts[0].y + 4)
    for (let i = 1; i < pts.length; i++) gfx.lineTo(pts[i].x, pts[i].y + 4)
    gfx.strokePath()
  }

  destroy() {
    this._gfx.destroy()
    for (const obj of this._segObjs) obj.destroy()
  }
}
