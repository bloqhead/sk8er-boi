// Procedural pixel art sprite generation
// All sprites drawn to offscreen canvases, then loaded as Phaser textures

export class SpriteFactory {
  constructor(scene) {
    this.scene = scene
    this.S = 4 // pixel scale
  }

  px(n) { return n * this.S }

  makeCanvas(w, h) {
    const c = document.createElement('canvas')
    c.width = w * this.S
    c.height = h * this.S
    return { canvas: c, ctx: c.getContext('2d') }
  }

  fill(ctx, x, y, w, h, color) {
    ctx.fillStyle = color
    ctx.fillRect(x * this.S, y * this.S, w * this.S, h * this.S)
  }

  // ─── SKATER ──────────────────────────────────────────────────────────
  createSkater(key, frame = 'idle') {
    const { canvas, ctx } = this.makeCanvas(16, 20)

    const skin = '#F5CBA7'
    const hair = '#222'
    const shirt = '#FF2D78'
    const pants = '#2244AA'
    const shoe = '#111'
    const board = '#C8860A'

    if (frame === 'idle' || frame === 'roll') {
      // Board
      this.fill(ctx, 1, 17, 14, 2, board)
      this.fill(ctx, 0, 17, 2, 1, board)
      this.fill(ctx, 13, 17, 2, 1, board)
      // Wheels
      ctx.fillStyle = '#444'
      ctx.fillRect(1 * this.S, 18 * this.S, 2 * this.S, 2 * this.S)
      ctx.fillRect(12 * this.S, 18 * this.S, 2 * this.S, 2 * this.S)
      // Legs
      this.fill(ctx, 3, 13, 4, 5, pants)
      this.fill(ctx, 9, 13, 4, 5, pants)
      // Shoes
      this.fill(ctx, 2, 16, 5, 2, shoe)
      this.fill(ctx, 9, 16, 5, 2, shoe)
      // Body
      this.fill(ctx, 3, 7, 10, 7, shirt)
      // Arms
      this.fill(ctx, 1, 8, 3, 5, shirt)
      this.fill(ctx, 12, 8, 3, 5, shirt)
      // Hands
      this.fill(ctx, 0, 11, 2, 3, skin)
      this.fill(ctx, 14, 11, 2, 3, skin)
      // Head
      this.fill(ctx, 4, 1, 8, 7, skin)
      // Hair
      this.fill(ctx, 4, 0, 8, 3, hair)
      this.fill(ctx, 3, 1, 2, 2, hair)
      // Eyes
      this.fill(ctx, 6, 3, 1, 1, '#222')
      this.fill(ctx, 9, 3, 1, 1, '#222')
    }

    if (frame === 'ollie') {
      // Board angled up
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(-0.3)
      ctx.translate(-canvas.width / 2, -canvas.height / 2)
      this.fill(ctx, 1, 16, 14, 2, board)
      ctx.fillStyle = '#444'
      ctx.fillRect(1 * this.S, 17 * this.S, 2 * this.S, 2 * this.S)
      ctx.fillRect(12 * this.S, 17 * this.S, 2 * this.S, 2 * this.S)
      ctx.restore()
      // Body crouched/jumping
      this.fill(ctx, 3, 5, 10, 7, shirt)
      this.fill(ctx, 2, 9, 3, 5, shirt)
      this.fill(ctx, 11, 9, 3, 5, shirt)
      this.fill(ctx, 0, 13, 2, 2, skin)
      this.fill(ctx, 14, 13, 2, 2, skin)
      // Legs bent
      this.fill(ctx, 4, 11, 4, 4, pants)
      this.fill(ctx, 8, 11, 4, 4, pants)
      this.fill(ctx, 3, 14, 4, 2, shoe)
      this.fill(ctx, 8, 14, 4, 2, shoe)
      // Head
      this.fill(ctx, 4, 0, 8, 6, skin)
      this.fill(ctx, 4, 0, 8, 2, hair)
      this.fill(ctx, 3, 0, 2, 2, hair)
      this.fill(ctx, 6, 2, 1, 1, '#222')
      this.fill(ctx, 9, 2, 1, 1, '#222')
    }

    if (frame === 'grind') {
      // Board flat, shifted
      this.fill(ctx, 1, 15, 14, 2, board)
      ctx.fillStyle = '#444'
      ctx.fillRect(1 * this.S, 16 * this.S, 2 * this.S, 2 * this.S)
      ctx.fillRect(12 * this.S, 16 * this.S, 2 * this.S, 2 * this.S)
      // Leaning forward pose
      this.fill(ctx, 4, 6, 9, 8, shirt)
      this.fill(ctx, 1, 8, 3, 6, shirt)
      this.fill(ctx, 13, 8, 3, 4, shirt)
      this.fill(ctx, 0, 13, 2, 2, skin)
      this.fill(ctx, 14, 11, 2, 2, skin)
      this.fill(ctx, 4, 12, 4, 4, pants)
      this.fill(ctx, 8, 12, 4, 4, pants)
      this.fill(ctx, 3, 14, 5, 2, shoe)
      this.fill(ctx, 8, 14, 5, 2, shoe)
      this.fill(ctx, 5, 0, 8, 7, skin)
      this.fill(ctx, 5, 0, 8, 2, hair)
      this.fill(ctx, 7, 2, 1, 1, '#222')
      this.fill(ctx, 10, 2, 1, 1, '#222')
    }

    if (frame === 'crash') {
      // Sprawled on ground
      this.fill(ctx, 0, 13, 16, 3, shirt)
      this.fill(ctx, 0, 12, 4, 2, skin)
      this.fill(ctx, 12, 11, 4, 2, skin)
      this.fill(ctx, 0, 15, 6, 2, pants)
      this.fill(ctx, 10, 15, 6, 2, pants)
      this.fill(ctx, 0, 16, 5, 2, shoe)
      this.fill(ctx, 11, 16, 5, 2, shoe)
      this.fill(ctx, 2, 7, 8, 6, skin)
      this.fill(ctx, 2, 7, 8, 2, hair)
      this.fill(ctx, 4, 9, 1, 1, '#222')
      this.fill(ctx, 7, 9, 1, 1, '#222')
      // Stars around head
      ctx.fillStyle = '#FFD700'
      for (let i = 0; i < 3; i++) {
        const ax = (1 + i * 3) * this.S
        const ay = (5 + (i % 2) * 2) * this.S
        ctx.fillRect(ax, ay, this.S, this.S)
      }
      // Board flying off
      ctx.save()
      ctx.translate(12 * this.S, 3 * this.S)
      ctx.rotate(0.8)
      ctx.fillStyle = board
      ctx.fillRect(0, 0, 8 * this.S, 2 * this.S)
      ctx.restore()
    }

    if (frame === 'charge') {
      // Deep crouch, charging
      this.fill(ctx, 1, 17, 14, 2, board)
      ctx.fillStyle = '#444'
      ctx.fillRect(1 * this.S, 18 * this.S, 2 * this.S, 2 * this.S)
      ctx.fillRect(12 * this.S, 18 * this.S, 2 * this.S, 2 * this.S)
      this.fill(ctx, 3, 10, 10, 8, shirt)
      this.fill(ctx, 1, 12, 3, 4, shirt)
      this.fill(ctx, 12, 12, 3, 4, shirt)
      this.fill(ctx, 0, 15, 2, 2, skin)
      this.fill(ctx, 14, 15, 2, 2, skin)
      this.fill(ctx, 4, 15, 4, 3, pants)
      this.fill(ctx, 8, 15, 4, 3, pants)
      this.fill(ctx, 2, 17, 6, 2, shoe)
      this.fill(ctx, 8, 17, 6, 2, shoe)
      this.fill(ctx, 4, 3, 8, 8, skin)
      this.fill(ctx, 4, 3, 8, 3, hair)
      this.fill(ctx, 3, 4, 2, 2, hair)
      this.fill(ctx, 6, 6, 1, 1, '#222')
      this.fill(ctx, 9, 6, 1, 1, '#222')
      // Grimace mouth
      this.fill(ctx, 6, 8, 4, 1, '#222')
    }

    this.scene.textures.addCanvas(key, canvas)
  }

  // ─── OBSTACLES ───────────────────────────────────────────────────────
  createTrashCan(key) {
    const { canvas, ctx } = this.makeCanvas(20, 28)
    this.fill(ctx, 2, 4, 16, 22, '#777')
    this.fill(ctx, 1, 3, 18, 4, '#999')
    this.fill(ctx, 0, 2, 20, 3, '#aaa')
    this.fill(ctx, 6, 0, 8, 3, '#888')
    // Stripes
    this.fill(ctx, 2, 10, 16, 2, '#666')
    this.fill(ctx, 2, 18, 16, 2, '#666')
    // Shine
    this.fill(ctx, 4, 6, 3, 8, '#bbb')
    this.scene.textures.addCanvas(key, canvas)
  }

  createPerson(key, shirtColor = '#4444ff', walking = false) {
    const { canvas, ctx } = this.makeCanvas(16, 36)
    const skin = '#F5CBA7'
    const pants = '#333'
    const shoe = '#222'
    const hair = '#444'
    // Shoes
    this.fill(ctx, 2, 32, 5, 3, shoe)
    this.fill(ctx, 9, 32, 5, 3, shoe)
    // Pants/Legs
    this.fill(ctx, 3, 22, 4, 12, pants)
    this.fill(ctx, 9, 22, 4, 12, pants)
    if (walking) {
      this.fill(ctx, 2, 24, 5, 10, pants)
      this.fill(ctx, 8, 22, 5, 10, pants)
    }
    // Body
    this.fill(ctx, 2, 10, 12, 13, shirtColor)
    // Arms
    this.fill(ctx, 0, 11, 3, 9, shirtColor)
    this.fill(ctx, 13, 11, 3, 9, shirtColor)
    this.fill(ctx, 0, 19, 2, 3, skin)
    this.fill(ctx, 14, 19, 2, 3, skin)
    // Head
    this.fill(ctx, 3, 1, 10, 10, skin)
    this.fill(ctx, 3, 1, 10, 3, hair)
    this.fill(ctx, 5, 5, 2, 2, '#222')
    this.fill(ctx, 9, 5, 2, 2, '#222')
    this.fill(ctx, 5, 8, 6, 1, '#c77')
    this.scene.textures.addCanvas(key, canvas)
  }

  createDog(key) {
    const { canvas, ctx } = this.makeCanvas(24, 16)
    const body = '#C8860A'
    const dark = '#8B5E0A'
    // Body
    this.fill(ctx, 4, 4, 14, 8, body)
    // Head
    this.fill(ctx, 14, 2, 8, 8, body)
    // Snout
    this.fill(ctx, 20, 5, 4, 4, dark)
    // Nose
    this.fill(ctx, 22, 5, 2, 2, '#111')
    // Ear
    this.fill(ctx, 18, 0, 4, 4, dark)
    // Tail
    this.fill(ctx, 0, 0, 4, 8, body)
    this.fill(ctx, 0, 0, 3, 3, dark)
    // Legs
    this.fill(ctx, 6, 10, 3, 6, dark)
    this.fill(ctx, 10, 10, 3, 6, dark)
    this.fill(ctx, 14, 10, 3, 6, dark)
    this.fill(ctx, 18, 10, 3, 6, dark)
    // Eye
    this.fill(ctx, 20, 3, 1, 1, '#222')
    this.scene.textures.addCanvas(key, canvas)
  }

  createRamp(key, w = 64, h = 40) {
    const { canvas, ctx } = this.makeCanvas(w, h)
    ctx.fillStyle = '#8B7355'
    ctx.beginPath()
    ctx.moveTo(0, h * this.S)
    ctx.lineTo(w * this.S, h * this.S)
    ctx.lineTo(w * this.S, 0)
    ctx.closePath()
    ctx.fill()
    // Planks
    ctx.fillStyle = '#7A6344'
    for (let i = 0; i < w; i += 6) {
      ctx.fillRect(i * this.S, 0, 1 * this.S, h * this.S)
    }
    // Edge highlight
    ctx.fillStyle = '#A09070'
    ctx.fillRect(0, (h - 2) * this.S, w * this.S, 2 * this.S)
    this.scene.textures.addCanvas(key, canvas)
  }

  createRail(key, w = 96, h = 20) {
    const { canvas, ctx } = this.makeCanvas(w, h)
    // Posts
    for (let i = 8; i < w - 8; i += 16) {
      ctx.fillStyle = '#666'
      ctx.fillRect(i * this.S, 4 * this.S, 3 * this.S, (h - 4) * this.S)
    }
    // Rail bar
    ctx.fillStyle = '#bbb'
    ctx.fillRect(0, 2 * this.S, w * this.S, 4 * this.S)
    // Rail shine
    ctx.fillStyle = '#eee'
    ctx.fillRect(0, 2 * this.S, w * this.S, 1 * this.S)
    ctx.fillStyle = '#999'
    ctx.fillRect(0, 5 * this.S, w * this.S, 1 * this.S)
    this.scene.textures.addCanvas(key, canvas)
  }

  createCurb(key) {
    const { canvas, ctx } = this.makeCanvas(32, 12)
    this.fill(ctx, 0, 2, 32, 10, '#b0b0b0')
    this.fill(ctx, 0, 0, 32, 3, '#d0d0d0')
    this.fill(ctx, 0, 10, 32, 2, '#909090')
    // Wax marks
    this.fill(ctx, 4, 1, 6, 1, '#e8e8e8')
    this.fill(ctx, 18, 1, 8, 1, '#e8e8e8')
    this.scene.textures.addCanvas(key, canvas)
  }

  createFireHydrant(key) {
    const { canvas, ctx } = this.makeCanvas(16, 24)
    this.fill(ctx, 3, 4, 10, 16, '#dd2222')
    this.fill(ctx, 1, 12, 14, 6, '#dd2222')
    this.fill(ctx, 5, 2, 6, 4, '#cc1111')
    this.fill(ctx, 6, 0, 4, 3, '#bb1111')
    this.fill(ctx, 0, 12, 3, 4, '#bb1111')
    this.fill(ctx, 13, 12, 3, 4, '#bb1111')
    this.fill(ctx, 2, 20, 12, 4, '#cc2222')
    this.fill(ctx, 6, 4, 3, 10, '#ee4444')
    this.scene.textures.addCanvas(key, canvas)
  }

  createCone(key) {
    const { canvas, ctx } = this.makeCanvas(16, 20)
    ctx.fillStyle = '#ff6600'
    ctx.beginPath()
    ctx.moveTo(8 * this.S, 0)
    ctx.lineTo(0, 18 * this.S)
    ctx.lineTo(16 * this.S, 18 * this.S)
    ctx.closePath()
    ctx.fill()
    this.fill(ctx, 0, 14, 16, 2, '#fff')
    this.fill(ctx, 1, 8, 14, 2, '#fff')
    this.fill(ctx, 0, 18, 16, 2, '#fff')
    this.scene.textures.addCanvas(key, canvas)
  }

  createBarrel(key) {
    const { canvas, ctx } = this.makeCanvas(24, 28)
    this.fill(ctx, 2, 2, 20, 24, '#553300')
    this.fill(ctx, 1, 4, 22, 20, '#663300')
    // Bands
    this.fill(ctx, 0, 4, 24, 3, '#888')
    this.fill(ctx, 0, 12, 24, 3, '#888')
    this.fill(ctx, 0, 20, 24, 3, '#888')
    // Top
    this.fill(ctx, 2, 0, 20, 4, '#774400')
    // Shine
    this.fill(ctx, 4, 6, 4, 12, '#774400')
    this.scene.textures.addCanvas(key, canvas)
  }

  createMailbox(key) {
    const { canvas, ctx } = this.makeCanvas(18, 28)
    // Post
    this.fill(ctx, 7, 18, 4, 10, '#888')
    // Box
    this.fill(ctx, 1, 6, 16, 14, '#3355cc')
    // Curved top
    ctx.fillStyle = '#3355cc'
    ctx.beginPath()
    ctx.arc(9 * this.S, 7 * this.S, 8 * this.S, Math.PI, 0)
    ctx.closePath()
    ctx.fill()
    // Door
    this.fill(ctx, 0, 12, 4, 8, '#2244bb')
    // Flag
    this.fill(ctx, 14, 8, 2, 8, '#aaa')
    this.fill(ctx, 14, 8, 4, 4, '#ff2222')
    // Letters
    this.fill(ctx, 6, 13, 6, 1, '#fff')
    this.scene.textures.addCanvas(key, canvas)
  }

  createNewsBox(key) {
    const { canvas, ctx } = this.makeCanvas(20, 24)
    this.fill(ctx, 0, 4, 20, 20, '#3366cc')
    this.fill(ctx, 0, 0, 20, 5, '#1144aa')
    this.fill(ctx, 2, 20, 16, 4, '#2255bb')
    // Window
    this.fill(ctx, 3, 7, 14, 12, '#88aaff')
    this.fill(ctx, 4, 8, 12, 10, '#99bbff')
    // Handle
    this.fill(ctx, 8, 18, 4, 4, '#888')
    // "NEWS" text lines
    for (let i = 0; i < 4; i++) {
      this.fill(ctx, 5, 9 + i * 2, 10, 1, '#2244aa')
    }
    this.scene.textures.addCanvas(key, canvas)
  }

  createScooter(key) {
    const { canvas, ctx } = this.makeCanvas(32, 20)
    // Body
    this.fill(ctx, 4, 6, 20, 8, '#00ccff')
    this.fill(ctx, 2, 8, 28, 6, '#00aaee')
    // Wheels
    ctx.fillStyle = '#333'
    ctx.beginPath(); ctx.arc(5 * this.S, 16 * this.S, 4 * this.S, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(26 * this.S, 16 * this.S, 4 * this.S, 0, Math.PI * 2); ctx.fill()
    // Handlebar
    this.fill(ctx, 23, 0, 2, 8, '#0099cc')
    this.fill(ctx, 20, 0, 8, 2, '#0099cc')
    // Seat
    this.fill(ctx, 8, 4, 12, 3, '#0088bb')
    this.scene.textures.addCanvas(key, canvas)
  }

  // ─── PARTICLES ───────────────────────────────────────────────────────
  createParticle(key, color = '#ffffff', size = 3) {
    const { canvas, ctx } = this.makeCanvas(size, size)
    ctx.fillStyle = color
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    this.scene.textures.addCanvas(key, canvas)
  }

  createSparkle(key, color = '#f5e642') {
    const { canvas, ctx } = this.makeCanvas(8, 8)
    ctx.fillStyle = color
    // Diamond shape
    this.fill(ctx, 3, 0, 2, 2, color)
    this.fill(ctx, 1, 2, 6, 4, color)
    this.fill(ctx, 3, 5, 2, 2, color)
    this.fill(ctx, 0, 3, 2, 2, color)
    this.fill(ctx, 6, 3, 2, 2, color)
    this.scene.textures.addCanvas(key, canvas)
  }

  // ─── UI ELEMENTS ─────────────────────────────────────────────────────
  createStairs(key) {
    const { canvas, ctx } = this.makeCanvas(48, 32)
    const light = '#c8c8c8'
    const dark = '#909090'
    const edge = '#e0e0e0'
    // 4-step staircase, each step 12w x 8h
    for (let i = 0; i < 4; i++) {
      const sx = i * 12
      const sy = (3 - i) * 8
      this.fill(ctx, sx, sy, 12, 8, light)         // face
      this.fill(ctx, sx, sy, 12, 1, edge)           // top edge highlight
      this.fill(ctx, sx, sy + 7, 12, 1, dark)       // bottom shadow
      if (i > 0) {
        this.fill(ctx, sx, sy, 1, 8 * (i + 1), dark) // riser
      }
    }
    this.scene.textures.addCanvas(key, canvas)
  }

  createChild(key) {
    // Kid on a bike
    const { canvas, ctx } = this.makeCanvas(20, 24)
    const skin = '#F5CBA7'
    const shirt = '#ff9900'
    const pants = '#3333aa'
    const shoe = '#222'
    const hair = '#663300'
    const bike = '#cc2222'
    // Bike wheels
    ctx.fillStyle = '#333'
    ctx.beginPath(); ctx.arc(4 * this.S, 20 * this.S, 4 * this.S, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(16 * this.S, 20 * this.S, 4 * this.S, 0, Math.PI * 2); ctx.fill()
    // Frame
    ctx.fillStyle = bike
    ctx.beginPath()
    ctx.moveTo(4 * this.S, 20 * this.S)
    ctx.lineTo(10 * this.S, 12 * this.S)
    ctx.lineTo(16 * this.S, 20 * this.S)
    ctx.lineWidth = 2 * this.S
    ctx.strokeStyle = bike
    ctx.stroke()
    // Handlebars
    this.fill(ctx, 14, 10, 4, 1, '#888')
    // Seat
    this.fill(ctx, 8, 11, 4, 1, '#444')
    // Body (crouched small kid)
    this.fill(ctx, 8, 5, 6, 7, shirt)
    this.fill(ctx, 8, 10, 4, 5, pants)
    this.fill(ctx, 14, 10, 2, 4, pants)
    this.fill(ctx, 7, 13, 3, 2, shoe)
    this.fill(ctx, 12, 13, 3, 2, shoe)
    // Head
    this.fill(ctx, 9, 0, 6, 6, skin)
    this.fill(ctx, 9, 0, 6, 2, hair)
    // Helmet
    this.fill(ctx, 8, 0, 8, 3, '#ff6600')
    // Eyes
    this.fill(ctx, 11, 2, 1, 1, '#333')
    this.fill(ctx, 13, 2, 1, 1, '#333')
    this.scene.textures.addCanvas(key, canvas)
  }
  // ─── UI ELEMENTS ─────────────────────────────────────────────────────
  createHeart(key, filled = true) {
    const { canvas, ctx } = this.makeCanvas(12, 12)
    const c = filled ? '#ff2d78' : '#553344'
    this.fill(ctx, 1, 2, 4, 4, c)
    this.fill(ctx, 7, 2, 4, 4, c)
    this.fill(ctx, 0, 4, 12, 5, c)
    this.fill(ctx, 1, 8, 10, 2, c)
    this.fill(ctx, 2, 9, 8, 2, c)
    this.fill(ctx, 3, 10, 6, 1, c)
    this.fill(ctx, 5, 11, 2, 1, c)
    this.scene.textures.addCanvas(key, canvas)
  }

  createStar(key) {
    const { canvas, ctx } = this.makeCanvas(16, 16)
    ctx.fillStyle = '#f5e642'
    this.fill(ctx, 7, 0, 2, 6, '#f5e642')
    this.fill(ctx, 7, 10, 2, 6, '#f5e642')
    this.fill(ctx, 0, 7, 6, 2, '#f5e642')
    this.fill(ctx, 10, 7, 6, 2, '#f5e642')
    this.fill(ctx, 2, 2, 3, 3, '#f5e642')
    this.fill(ctx, 11, 2, 3, 3, '#f5e642')
    this.fill(ctx, 2, 11, 3, 3, '#f5e642')
    this.fill(ctx, 11, 11, 3, 3, '#f5e642')
    this.fill(ctx, 6, 5, 4, 6, '#f5e642')
    this.fill(ctx, 5, 6, 6, 4, '#f5e642')
    this.scene.textures.addCanvas(key, canvas)
  }

  // ─── BACKGROUND ELEMENTS ─────────────────────────────────────────────
  createBuilding(key, w, h, wallColor, windowColor, variant = 0) {
    const { canvas, ctx } = this.makeCanvas(w, h)
    // Main wall
    ctx.fillStyle = this._hexToRgb(wallColor)
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // Darker base
    ctx.fillStyle = this._darken(wallColor, 0.15)
    ctx.fillRect(0, (h - 4) * this.S, canvas.width, 4 * this.S)
    // Windows
    const wc = this._hexToRgb(windowColor)
    const rows = Math.floor(h / 8) - 1
    const cols = Math.floor(w / 7) - 1
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = Math.random() > 0.35
        ctx.fillStyle = lit ? wc : this._darken(windowColor, 0.7)
        ctx.fillRect((c * 7 + 3) * this.S, (r * 8 + 4) * this.S, 3 * this.S, 4 * this.S)
      }
    }
    // Rooftop details
    if (variant === 0) {
      ctx.fillStyle = this._darken(wallColor, 0.1)
      ctx.fillRect(2 * this.S, 0, (w - 4) * this.S, 3 * this.S)
    }
    if (variant === 1) {
      // Antenna
      ctx.fillStyle = '#aaa'
      ctx.fillRect((w / 2 - 1) * this.S, -6 * this.S, 2 * this.S, 8 * this.S)
    }
    this.scene.textures.addCanvas(key, canvas)
  }

  createGroundTile(key, w, h, color1, color2, level = 1) {
    const { canvas, ctx } = this.makeCanvas(w, h)
    ctx.fillStyle = this._hexToRgb(color1)
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // Cracks/lines
    ctx.fillStyle = this._darken(color1, 0.2)
    for (let x = 0; x < w; x += 12) {
      ctx.fillRect(x * this.S, 0, 1 * this.S, canvas.height)
    }
    if (level === 2) {
      // Grass
      ctx.fillStyle = '#2d4a1e'
      ctx.fillRect(0, 0, canvas.width, 4 * this.S)
    }
    if (level === 3) {
      // Metal grating
      ctx.fillStyle = this._darken(color1, 0.3)
      for (let x = 0; x < w; x += 4) {
        for (let y = 0; y < h; y += 4) {
          ctx.fillRect(x * this.S, y * this.S, 1 * this.S, 1 * this.S)
        }
      }
    }
    this.scene.textures.addCanvas(key, canvas)
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────
  _hexToRgb(hex) {
    const r = (hex >> 16) & 0xff
    const g = (hex >> 8) & 0xff
    const b = hex & 0xff
    return `rgb(${r},${g},${b})`
  }

  _darken(hex, amount) {
    const r = Math.max(0, ((hex >> 16) & 0xff) * (1 - amount)) | 0
    const g = Math.max(0, ((hex >> 8) & 0xff) * (1 - amount)) | 0
    const b = Math.max(0, (hex & 0xff) * (1 - amount)) | 0
    return `rgb(${r},${g},${b})`
  }
}
