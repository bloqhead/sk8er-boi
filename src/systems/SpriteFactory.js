// Procedural pixel art sprite generation
// Character is drawn at 10×16 logical pixels (S=3 → 30×48 canvas pixels)
// World objects use S=3 too — tighter, OlliOlli-style scale

export class SpriteFactory {
  constructor(scene) {
    this.scene = scene
    this.S = 3 // pixel scale — every "pixel" is 3×3 canvas pixels
  }

  px(n) { return n * this.S }

  makeCanvas(w, h) {
    const c = document.createElement('canvas')
    c.width  = w * this.S
    c.height = h * this.S
    return { canvas: c, ctx: c.getContext('2d') }
  }

  fill(ctx, x, y, w, h, color) {
    ctx.fillStyle = color
    ctx.fillRect(x * this.S, y * this.S, w * this.S, h * this.S)
  }

  // ─── SKATER SPRITESHEET ──────────────────────────────────────────────
  // One canvas, 8 frames × 12 wide = 96 wide, 18 tall
  // Frames: 0=roll_a 1=roll_b 2=push_a 3=push_b 4=charge 5=ollie 6=grind 7=crash
  createSkaterSheet(key) {
    const FW = 12   // frame width  (logical pixels)
    const FH = 18   // frame height
    const FRAMES = 8
    const { canvas, ctx } = this.makeCanvas(FW * FRAMES, FH)

    const pal = {
      skin:   '#F5CBA7',
      hair:   '#1a1a1a',
      shirt:  '#FF2D78',
      pants:  '#1C3A8A',
      shoe:   '#111111',
      board:  '#C8860A',
      trucks: '#888888',
      wheel:  '#333333',
      lace:   '#ffffff',
    }

    const f = (ctx, x, y, w, h, c) => {
      ctx.fillStyle = c
      ctx.fillRect(x * this.S, y * this.S, w * this.S, h * this.S)
    }

    // Helper: draw at frame offset
    const F = (fi) => fi * FW  // x-offset in logical px for frame fi

    // ── SHARED PARTS ──────────────────────────────────────────────────
    const drawBoard = (fi, yOffset = 0, tilt = 0) => {
      const bx = F(fi)
      const by = 14 + yOffset
      // board body
      f(ctx, bx+1, by,   10, 2, pal.board)
      // nose/tail kick
      f(ctx, bx,   by+1, 2,  1, pal.board)
      f(ctx, bx+10,by+1, 2,  1, pal.board)
      // trucks
      f(ctx, bx+1, by+2, 2,  1, pal.trucks)
      f(ctx, bx+8, by+2, 2,  1, pal.trucks)
      // wheels
      f(ctx, bx+0, by+2, 2,  2, pal.wheel)
      f(ctx, bx+9, by+2, 2,  2, pal.wheel)
      // grip tape stripe
      f(ctx, bx+2, by,   7,  1, '#8B6914')
    }

    const drawHead = (fi, hx, hy) => {
      const bx = F(fi)
      // head
      f(ctx, bx+hx,   hy,   5, 4, pal.skin)
      // hair
      f(ctx, bx+hx,   hy,   5, 2, pal.hair)
      f(ctx, bx+hx-1, hy,   2, 2, pal.hair)
      // eyes
      f(ctx, bx+hx+1, hy+2, 1, 1, '#222')
      f(ctx, bx+hx+3, hy+2, 1, 1, '#222')
    }

    const drawBody = (fi, bx_off, by_off, armUp = false) => {
      const bx = F(fi) + bx_off
      // torso
      f(ctx, bx+2, by_off+0, 6, 5, pal.shirt)
      // left arm
      if (armUp) {
        f(ctx, bx+0, by_off-2, 2, 4, pal.shirt)
        f(ctx, bx+0, by_off+2, 2, 1, pal.skin)  // hand up
      } else {
        f(ctx, bx+0, by_off+1, 2, 4, pal.shirt)
        f(ctx, bx+0, by_off+4, 2, 1, pal.skin)
      }
      // right arm
      f(ctx, bx+8, by_off+1, 2, 4, pal.shirt)
      f(ctx, bx+8, by_off+4, 2, 1, pal.skin)
    }

    // ── FRAME 0: ROLL A ───────────────────────────────────────────────
    {
      const fi = 0, bx = F(fi)
      drawBoard(fi)
      // legs — standing, weight even
      f(ctx, bx+2,  11, 3, 4, pal.pants)  // left leg
      f(ctx, bx+6,  11, 3, 4, pal.pants)  // right leg
      f(ctx, bx+1,  14, 4, 2, pal.shoe)
      f(ctx, bx+6,  14, 4, 2, pal.shoe)
      f(ctx, bx+2,  15, 2, 1, pal.lace)
      f(ctx, bx+6,  15, 2, 1, pal.lace)
      drawBody(fi, 0, 6)
      drawHead(fi, 3, 2)
    }

    // ── FRAME 1: ROLL B (arms swing slightly) ─────────────────────────
    {
      const fi = 1, bx = F(fi)
      drawBoard(fi)
      f(ctx, bx+2,  11, 3, 4, pal.pants)
      f(ctx, bx+6,  11, 3, 4, pal.pants)
      f(ctx, bx+1,  14, 4, 2, pal.shoe)
      f(ctx, bx+6,  14, 4, 2, pal.shoe)
      f(ctx, bx+2,  15, 2, 1, pal.lace)
      f(ctx, bx+6,  15, 2, 1, pal.lace)
      // arms slightly different angle
      f(ctx, bx+2, 6, 6, 5, pal.shirt)
      f(ctx, bx+0, 7, 2, 3, pal.shirt)   // left arm higher
      f(ctx, bx+0, 9, 2, 1, pal.skin)
      f(ctx, bx+8, 8, 2, 3, pal.shirt)   // right arm lower
      f(ctx, bx+8, 10,2, 1, pal.skin)
      drawHead(fi, 3, 2)
    }

    // ── FRAME 2: PUSH A (pushing foot off ground) ────────────────────
    {
      const fi = 2, bx = F(fi)
      drawBoard(fi)
      // front leg on board
      f(ctx, bx+5,  10, 3, 5, pal.pants)
      f(ctx, bx+4,  14, 4, 2, pal.shoe)
      f(ctx, bx+5,  15, 2, 1, pal.lace)
      // back leg extended pushing
      f(ctx, bx+3,  12, 2, 3, pal.pants)
      f(ctx, bx+2,  14, 5, 2, pal.shoe)  // foot on ground
      f(ctx, bx+3,  15, 2, 1, pal.lace)
      // body leans forward
      f(ctx, bx+3, 6, 6, 5, pal.shirt)
      f(ctx, bx+1, 6, 2, 4, pal.shirt)   // arm forward
      f(ctx, bx+0, 8, 2, 2, pal.skin)
      f(ctx, bx+9, 7, 2, 4, pal.shirt)
      f(ctx, bx+9, 10,2, 1, pal.skin)
      drawHead(fi, 3, 2)
    }

    // ── FRAME 3: PUSH B (foot back up after push) ─────────────────────
    {
      const fi = 3, bx = F(fi)
      drawBoard(fi)
      f(ctx, bx+5,  10, 3, 5, pal.pants)
      f(ctx, bx+4,  14, 4, 2, pal.shoe)
      f(ctx, bx+5,  15, 2, 1, pal.lace)
      // back leg lifting
      f(ctx, bx+2,  11, 2, 4, pal.pants)
      f(ctx, bx+4,  13, 3, 2, pal.pants)  // knee bend
      f(ctx, bx+5,  14, 3, 2, pal.shoe)   // foot lifting
      f(ctx, bx+3, 6, 6, 5, pal.shirt)
      f(ctx, bx+1, 6, 2, 3, pal.shirt)
      f(ctx, bx+0, 7, 2, 2, pal.skin)
      f(ctx, bx+9, 7, 2, 4, pal.shirt)
      f(ctx, bx+9, 10,2, 1, pal.skin)
      drawHead(fi, 3, 2)
    }

    // ── FRAME 4: CHARGE (deep crouch) ────────────────────────────────
    {
      const fi = 4, bx = F(fi)
      drawBoard(fi)
      // crouched legs — knees bent deep
      f(ctx, bx+1,  12, 4, 3, pal.pants)  // left thigh
      f(ctx, bx+2,  14, 3, 2, pal.pants)  // left shin bent under
      f(ctx, bx+6,  12, 4, 3, pal.pants)
      f(ctx, bx+6,  14, 3, 2, pal.pants)
      f(ctx, bx+1,  15, 4, 2, pal.shoe)
      f(ctx, bx+6,  15, 4, 2, pal.shoe)
      // low crouched body
      f(ctx, bx+2, 9, 7, 4, pal.shirt)
      // arms out for balance
      f(ctx, bx+0, 9, 2, 3, pal.shirt)
      f(ctx, bx+0, 11,2, 1, pal.skin)
      f(ctx, bx+9, 9, 2, 3, pal.shirt)
      f(ctx, bx+9, 11,2, 1, pal.skin)
      drawHead(fi, 3, 5)
      // grimace — show effort
      f(ctx, bx+5, 9, 3, 1, '#222')
    }

    // ── FRAME 5: OLLIE / AIRBORNE (tucked up) ─────────────────────────
    {
      const fi = 5, bx = F(fi)
      // board kicked up at angle — tail high, nose low
      f(ctx, bx+2,  12, 8, 2, pal.board)  // board mostly horizontal but shifted
      f(ctx, bx+1,  13, 2, 1, pal.board)  // tail kick
      f(ctx, bx+9,  11, 2, 1, pal.board)  // nose kick
      f(ctx, bx+1,  14, 2, 2, pal.wheel)
      f(ctx, bx+8,  13, 2, 2, pal.wheel)
      f(ctx, bx+2,  12, 5, 1, '#8B6914')
      // legs tucked up in ollie
      f(ctx, bx+2,  8,  3, 5, pal.pants)  // left leg tucked
      f(ctx, bx+4,  11, 3, 2, pal.pants)  // left knee out
      f(ctx, bx+7,  7,  3, 5, pal.pants)  // right leg up high
      f(ctx, bx+6,  10, 3, 2, pal.pants)
      f(ctx, bx+1,  12, 3, 2, pal.shoe)
      f(ctx, bx+7,  9,  3, 2, pal.shoe)
      // arms out for style
      f(ctx, bx+2, 4, 6, 4, pal.shirt)
      f(ctx, bx+0, 3, 2, 4, pal.shirt)
      f(ctx, bx+0, 5, 2, 1, pal.skin)
      f(ctx, bx+8, 3, 2, 4, pal.shirt)
      f(ctx, bx+8, 5, 2, 1, pal.skin)
      drawHead(fi, 3, 0)
    }

    // ── FRAME 6: GRIND ───────────────────────────────────────────────
    {
      const fi = 6, bx = F(fi)
      // board flat on rail
      f(ctx, bx+1,  14, 10, 2, pal.board)
      f(ctx, bx+0,  15, 2,  1, pal.board)
      f(ctx, bx+10, 15, 2,  1, pal.board)
      f(ctx, bx+1,  16, 2,  2, pal.wheel)
      f(ctx, bx+8,  16, 2,  2, pal.wheel)
      // legs low, knees slightly bent
      f(ctx, bx+2,  10, 3, 5, pal.pants)
      f(ctx, bx+6,  10, 3, 5, pal.pants)
      f(ctx, bx+1,  14, 4, 2, pal.shoe)
      f(ctx, bx+6,  14, 4, 2, pal.shoe)
      // body leaning forward
      f(ctx, bx+2, 6, 7, 5, pal.shirt)
      f(ctx, bx+0, 5, 2, 4, pal.shirt)   // arm forward low
      f(ctx, bx+0, 7, 2, 2, pal.skin)
      f(ctx, bx+9, 6, 2, 3, pal.shirt)
      f(ctx, bx+9, 8, 2, 1, pal.skin)
      drawHead(fi, 3, 2)
    }

    // ── FRAME 7: CRASH ───────────────────────────────────────────────
    {
      const fi = 7, bx = F(fi)
      // board flying off
      ctx.save()
      ctx.translate((bx + 9) * this.S, 3 * this.S)
      ctx.rotate(0.7)
      f(ctx, 0, 0, 7, 2, pal.board)
      ctx.restore()
      // body splayed out
      f(ctx, bx+0,  11, 12, 3, pal.shirt)  // torso horizontal
      f(ctx, bx+0,  9,  3,  2, pal.skin)   // one arm out
      f(ctx, bx+9,  8,  3,  2, pal.skin)   // other arm
      f(ctx, bx+0,  13, 5,  3, pal.pants)  // legs
      f(ctx, bx+7,  13, 5,  3, pal.pants)
      f(ctx, bx+0,  15, 4,  2, pal.shoe)
      f(ctx, bx+7,  14, 4,  2, pal.shoe)
      // head on floor
      f(ctx, bx+2,  7,  5,  5, pal.skin)
      f(ctx, bx+2,  7,  5,  2, pal.hair)
      f(ctx, bx+3,  9,  1,  1, '#222')
      f(ctx, bx+5,  9,  1,  1, '#222')
      // X eyes — dazed
      f(ctx, bx+3,  9,  1,  1, '#ff2d78')
      f(ctx, bx+5,  9,  1,  1, '#ff2d78')
      // stars
      f(ctx, bx+0,  4, 1, 1, '#f5e642')
      f(ctx, bx+3,  2, 1, 1, '#f5e642')
      f(ctx, bx+7,  3, 1, 1, '#f5e642')
    }

    this.scene.textures.addCanvas(key, canvas)

    // Register animation frames with Phaser
    this.scene.textures.get(key).add('roll_a',  0, F(0)*this.S, 0, FW*this.S, FH*this.S)
    this.scene.textures.get(key).add('roll_b',  0, F(1)*this.S, 0, FW*this.S, FH*this.S)
    this.scene.textures.get(key).add('push_a',  0, F(2)*this.S, 0, FW*this.S, FH*this.S)
    this.scene.textures.get(key).add('push_b',  0, F(3)*this.S, 0, FW*this.S, FH*this.S)
    this.scene.textures.get(key).add('charge',  0, F(4)*this.S, 0, FW*this.S, FH*this.S)
    this.scene.textures.get(key).add('ollie',   0, F(5)*this.S, 0, FW*this.S, FH*this.S)
    this.scene.textures.get(key).add('grind',   0, F(6)*this.S, 0, FW*this.S, FH*this.S)
    this.scene.textures.get(key).add('crash',   0, F(7)*this.S, 0, FW*this.S, FH*this.S)
  }

  // ─── OBSTACLES ───────────────────────────────────────────────────────
  createTrashCan(key) {
    const { canvas, ctx } = this.makeCanvas(8, 12)
    this.fill(ctx, 1, 2, 6, 9, '#777')
    this.fill(ctx, 1, 1, 6, 2, '#999')
    this.fill(ctx, 0, 0, 8, 2, '#aaa')
    this.fill(ctx, 2, 0, 4, 1, '#888')
    this.fill(ctx, 1, 4, 6, 1, '#666')
    this.fill(ctx, 1, 7, 6, 1, '#666')
    this.fill(ctx, 2, 2, 2, 4, '#bbb')  // shine
    this.scene.textures.addCanvas(key, canvas)
  }

  createPerson(key, shirtColor = '#4444ff', walking = false) {
    const { canvas, ctx } = this.makeCanvas(7, 15)
    const S = this.S
    const skin = '#F5CBA7', pants = '#333', shoe = '#222', hair = '#444'
    this.fill(ctx, 2, 13, 2, 2, shoe); this.fill(ctx, 4, 13, 2, 2, shoe)
    this.fill(ctx, 2,  9, 2, 5, pants); this.fill(ctx, 4,  9, 2, 5, pants)
    if (walking) {
      this.fill(ctx, 1, 10, 2, 4, pants); this.fill(ctx, 4,  9, 2, 4, pants)
    }
    this.fill(ctx, 1,  5, 5, 5, shirtColor)
    this.fill(ctx, 0,  6, 1, 3, shirtColor); this.fill(ctx, 0, 8, 1, 1, skin)
    this.fill(ctx, 6,  6, 1, 3, shirtColor); this.fill(ctx, 6, 8, 1, 1, skin)
    this.fill(ctx, 2,  1, 4, 4, skin)
    this.fill(ctx, 2,  1, 4, 1, hair)
    this.fill(ctx, 2,  2, 1, 1, '#222'); this.fill(ctx, 4, 2, 1, 1, '#222')
    this.scene.textures.addCanvas(key, canvas)
  }

  createChild(key) {
    const { canvas, ctx } = this.makeCanvas(9, 11)
    const skin = '#F5CBA7', shirt = '#ff9900', pants = '#3333aa'
    const shoe = '#222', hair = '#663300', bike = '#cc2222'
    // bike wheels
    ctx.fillStyle = '#333'
    ctx.beginPath(); ctx.arc(2*this.S, 9*this.S, 2*this.S, 0, Math.PI*2); ctx.fill()
    ctx.beginPath(); ctx.arc(7*this.S, 9*this.S, 2*this.S, 0, Math.PI*2); ctx.fill()
    // frame line
    ctx.strokeStyle = bike; ctx.lineWidth = this.S
    ctx.beginPath(); ctx.moveTo(2*this.S, 9*this.S); ctx.lineTo(5*this.S, 5*this.S); ctx.lineTo(7*this.S, 9*this.S); ctx.stroke()
    this.fill(ctx, 6, 4, 3, 1, '#888')  // handlebar
    this.fill(ctx, 3, 4, 3, 1, '#444')  // seat
    this.fill(ctx, 3, 2, 3, 3, shirt)
    this.fill(ctx, 3, 4, 2, 3, pants)
    this.fill(ctx, 3, 6, 3, 1, '#ff6600') // helmet
    this.fill(ctx, 3, 1, 3, 3, skin)
    this.fill(ctx, 3, 1, 3, 1, '#ff6600')
    this.fill(ctx, 4, 2, 1, 1, '#222'); this.fill(ctx, 5, 2, 1, 1, '#222')
    this.scene.textures.addCanvas(key, canvas)
  }

  createDog(key) {
    const { canvas, ctx } = this.makeCanvas(11, 8)
    const body = '#C8860A', dark = '#8B5E0A'
    this.fill(ctx, 2, 2, 7, 4, body)
    this.fill(ctx, 7, 1, 4, 4, body)  // head
    this.fill(ctx, 10,2, 1, 2, dark)  // snout
    this.fill(ctx, 9, 0, 2, 2, dark)  // ear
    this.fill(ctx, 0, 0, 2, 4, body)  // tail
    this.fill(ctx, 0, 0, 2, 1, dark)
    this.fill(ctx, 3, 5, 2, 3, dark)  // legs
    this.fill(ctx, 5, 5, 2, 3, dark)
    this.fill(ctx, 7, 5, 2, 3, dark)
    this.fill(ctx, 9, 5, 2, 3, dark)
    this.fill(ctx, 9, 2, 1, 1, '#222') // eye
    this.scene.textures.addCanvas(key, canvas)
  }

  createRamp(key) {
    const W = 40, H = 22
    const { canvas, ctx } = this.makeCanvas(W, H)
    ctx.fillStyle = '#8B7355'
    ctx.beginPath()
    ctx.moveTo(0, H * this.S)
    ctx.lineTo(W * this.S, H * this.S)
    ctx.lineTo(W * this.S, 0)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#7A6344'
    for (let i = 0; i < W; i += 5) {
      ctx.fillRect(i * this.S, 0, 1 * this.S, H * this.S)
    }
    ctx.fillStyle = '#A09070'
    ctx.fillRect(0, (H - 2) * this.S, W * this.S, 2 * this.S)
    this.scene.textures.addCanvas(key, canvas)
  }

  createRail(key) {
    const W = 56, H = 10
    const { canvas, ctx } = this.makeCanvas(W, H)
    for (let i = 6; i < W - 6; i += 12) {
      ctx.fillStyle = '#666'
      ctx.fillRect(i * this.S, 3 * this.S, 2 * this.S, (H - 3) * this.S)
    }
    ctx.fillStyle = '#bbb'
    ctx.fillRect(0, 1 * this.S, W * this.S, 3 * this.S)
    ctx.fillStyle = '#eee'
    ctx.fillRect(0, 1 * this.S, W * this.S, 1 * this.S)
    ctx.fillStyle = '#999'
    ctx.fillRect(0, 3 * this.S, W * this.S, 1 * this.S)
    this.scene.textures.addCanvas(key, canvas)
  }

  createCurb(key) {
    const { canvas, ctx } = this.makeCanvas(18, 6)
    this.fill(ctx, 0, 1, 18, 5, '#b0b0b0')
    this.fill(ctx, 0, 0, 18, 2, '#d0d0d0')
    this.fill(ctx, 0, 4, 18, 1, '#909090')
    this.fill(ctx, 2, 0, 4, 1, '#e8e8e8')
    this.fill(ctx, 10,0, 5, 1, '#e8e8e8')
    this.scene.textures.addCanvas(key, canvas)
  }

  createStairs(key) {
    const { canvas, ctx } = this.makeCanvas(24, 16)
    const light = '#c8c8c8', dark = '#909090', edge = '#e0e0e0'
    for (let i = 0; i < 4; i++) {
      const sx = i * 6, sy = (3 - i) * 4
      this.fill(ctx, sx, sy,   6, 4, light)
      this.fill(ctx, sx, sy,   6, 1, edge)
      this.fill(ctx, sx, sy+3, 6, 1, dark)
      if (i > 0) this.fill(ctx, sx, sy, 1, 4*(i+1), dark)
    }
    this.scene.textures.addCanvas(key, canvas)
  }

  createFireHydrant(key) {
    const { canvas, ctx } = this.makeCanvas(7, 10)
    this.fill(ctx, 1, 2, 5, 7, '#dd2222')
    this.fill(ctx, 0, 5, 7, 3, '#dd2222')
    this.fill(ctx, 2, 1, 3, 2, '#cc1111')
    this.fill(ctx, 3, 0, 2, 2, '#bb1111')
    this.fill(ctx, 0, 5, 2, 2, '#bb1111')
    this.fill(ctx, 5, 5, 2, 2, '#bb1111')
    this.fill(ctx, 1, 8, 5, 2, '#cc2222')
    this.fill(ctx, 2, 2, 2, 5, '#ee4444')
    this.scene.textures.addCanvas(key, canvas)
  }

  createCone(key) {
    const { canvas, ctx } = this.makeCanvas(7, 9)
    ctx.fillStyle = '#ff6600'
    ctx.beginPath()
    ctx.moveTo(3.5*this.S, 0)
    ctx.lineTo(0, 8*this.S)
    ctx.lineTo(7*this.S, 8*this.S)
    ctx.closePath()
    ctx.fill()
    this.fill(ctx, 0, 5, 7, 1, '#fff')
    this.fill(ctx, 0, 3, 7, 1, '#fff')
    this.fill(ctx, 0, 8, 7, 1, '#fff')
    this.scene.textures.addCanvas(key, canvas)
  }

  createBarrel(key) {
    const { canvas, ctx } = this.makeCanvas(10, 12)
    this.fill(ctx, 1, 1, 8, 10, '#553300')
    this.fill(ctx, 0, 2, 10, 8, '#663300')
    this.fill(ctx, 0, 2, 10, 2, '#888')
    this.fill(ctx, 0, 5, 10, 2, '#888')
    this.fill(ctx, 0, 8, 10, 2, '#888')
    this.fill(ctx, 1, 0, 8, 2,  '#774400')
    this.fill(ctx, 2, 3, 2, 5,  '#774400')
    this.scene.textures.addCanvas(key, canvas)
  }

  createMailbox(key) {
    const { canvas, ctx } = this.makeCanvas(8, 12)
    this.fill(ctx, 3, 8, 2, 4, '#888')  // post
    this.fill(ctx, 1, 3, 6, 6, '#3355cc')  // box
    // curved top
    ctx.fillStyle = '#3355cc'
    ctx.beginPath(); ctx.arc(4*this.S, 4*this.S, 3*this.S, Math.PI, 0); ctx.closePath(); ctx.fill()
    this.fill(ctx, 0, 5, 2, 4, '#2244bb')  // door
    this.fill(ctx, 6, 4, 1, 4, '#aaa')     // flag pole
    this.fill(ctx, 6, 4, 2, 2, '#ff2222')  // flag
    this.scene.textures.addCanvas(key, canvas)
  }

  createNewsBox(key) {
    const { canvas, ctx } = this.makeCanvas(9, 11)
    this.fill(ctx, 0, 2, 9, 9, '#3366cc')
    this.fill(ctx, 0, 0, 9, 3, '#1144aa')
    this.fill(ctx, 1, 3, 7, 6, '#88aaff')
    this.fill(ctx, 2, 4, 5, 4, '#99bbff')
    this.fill(ctx, 3, 8, 3, 2, '#888')
    for (let i = 0; i < 3; i++) this.fill(ctx, 3, 4+i*2, 4, 1, '#2244aa')
    this.scene.textures.addCanvas(key, canvas)
  }

  createScooter(key) {
    const { canvas, ctx } = this.makeCanvas(14, 9)
    this.fill(ctx, 2, 3, 9, 4, '#00ccff')
    this.fill(ctx, 1, 4, 12, 3, '#00aaee')
    ctx.fillStyle = '#333'
    ctx.beginPath(); ctx.arc(2*this.S, 7*this.S, 2*this.S, 0, Math.PI*2); ctx.fill()
    ctx.beginPath(); ctx.arc(11*this.S, 7*this.S, 2*this.S, 0, Math.PI*2); ctx.fill()
    this.fill(ctx, 10, 0, 1, 4, '#0099cc')
    this.fill(ctx, 9, 0, 4, 1, '#0099cc')
    this.fill(ctx, 4, 2, 5, 2, '#0088bb')
    this.scene.textures.addCanvas(key, canvas)
  }

  // ─── PARTICLES ───────────────────────────────────────────────────────
  createParticle(key, color = '#ffffff', size = 2) {
    const { canvas, ctx } = this.makeCanvas(size, size)
    ctx.fillStyle = color
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    this.scene.textures.addCanvas(key, canvas)
  }

  createSparkle(key, color = '#f5e642') {
    const { canvas, ctx } = this.makeCanvas(5, 5)
    this.fill(ctx, 2, 0, 1, 5, color)
    this.fill(ctx, 0, 2, 5, 1, color)
    this.fill(ctx, 1, 1, 1, 1, color)
    this.fill(ctx, 3, 1, 1, 1, color)
    this.fill(ctx, 1, 3, 1, 1, color)
    this.fill(ctx, 3, 3, 1, 1, color)
    this.scene.textures.addCanvas(key, canvas)
  }

  // ─── UI ──────────────────────────────────────────────────────────────
  createHeart(key, filled = true) {
    const { canvas, ctx } = this.makeCanvas(7, 6)
    const c = filled ? '#ff2d78' : '#553344'
    this.fill(ctx, 0, 1, 3, 3, c)
    this.fill(ctx, 4, 1, 3, 3, c)
    this.fill(ctx, 0, 2, 7, 3, c)
    this.fill(ctx, 1, 4, 5, 1, c)
    this.fill(ctx, 2, 5, 3, 1, c)
    this.fill(ctx, 3, 5, 1, 1, c)
    this.scene.textures.addCanvas(key, canvas)
  }

  createStar(key) {
    const { canvas, ctx } = this.makeCanvas(9, 9)
    const c = '#f5e642'
    this.fill(ctx, 4, 0, 1, 9, c)
    this.fill(ctx, 0, 4, 9, 1, c)
    this.fill(ctx, 1, 1, 2, 2, c)
    this.fill(ctx, 6, 1, 2, 2, c)
    this.fill(ctx, 1, 6, 2, 2, c)
    this.fill(ctx, 6, 6, 2, 2, c)
    this.fill(ctx, 3, 3, 3, 3, c)
    this.scene.textures.addCanvas(key, canvas)
  }

  // ─── BACKGROUND ──────────────────────────────────────────────────────
  createBuildingStrip(key, sceneW, groundY, colors, windowColor) {
    // Wider than screen so it tiles without gaps
    const totalW = Math.ceil(sceneW * 3)
    const c = document.createElement('canvas')
    c.width  = totalW
    c.height = groundY + 2
    const ctx = c.getContext('2d')

    let x = 0
    while (x < totalW) {
      const bw = 20 + Math.floor(Math.random() * 30)
      const bh = 30 + Math.floor(Math.random() * (groundY * 0.6))
      const color = colors[Math.floor(Math.random() * colors.length)]
      const wc = `#${windowColor.toString(16).padStart(6, '0')}`

      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
      ctx.fillRect(x, groundY - bh, bw, bh)

      // shadow base
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(x, groundY - Math.min(bh, 5), bw, Math.min(bh, 5))

      // windows (pixel-grid aligned)
      for (let wy = groundY - bh + 4; wy < groundY - 2; wy += 6) {
        for (let wx = x + 3; wx < x + bw - 3; wx += 5) {
          const lit = Math.random() > 0.35
          ctx.fillStyle = lit ? wc : 'rgba(0,0,0,0.4)'
          ctx.fillRect(wx, wy, 3, 4)
        }
      }

      // occasional rooftop water tower
      if (Math.random() < 0.06 && bw >= 22) {
        ctx.fillStyle = '#553300'
        ctx.fillRect(x + bw/2 - 2, groundY - bh - 8, 5, 8)
        ctx.fillStyle = '#774400'
        ctx.fillRect(x + bw/2 - 3, groundY - bh - 8, 7, 3)
      }

      x += bw + Math.floor(Math.random() * 3)
    }

    if (!this.scene.textures.exists(key)) {
      this.scene.textures.addCanvas(key, c)
    }
  }

  createGroundTile(key, color1, color2, levelId) {
    const W = 96, H = 32
    const c = document.createElement('canvas')
    c.width = W; c.height = H
    const ctx = c.getContext('2d')

    ctx.fillStyle = `#${color1.toString(16).padStart(6, '0')}`
    ctx.fillRect(0, 0, W, H)

    // Surface line
    ctx.fillStyle = `#${color2.toString(16).padStart(6, '0')}`
    ctx.fillRect(0, 0, W, 2)

    // Level-specific surface details
    if (levelId === 1 || levelId === 4) {
      // Road markings
      ctx.fillStyle = 'rgba(255,255,255,0.07)'
      for (let x = 0; x < W; x += 18) ctx.fillRect(x, 8, 10, 2)
    } else if (levelId === 2) {
      // Grass strip at top
      ctx.fillStyle = '#2d4a1e'
      ctx.fillRect(0, 0, W, 3)
    } else if (levelId === 3) {
      // Metal grate texture
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      for (let x = 0; x < W; x += 3)
        for (let y = 0; y < H; y += 3)
          ctx.fillRect(x, y, 1, 1)
    }

    // Seam/crack lines
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    for (let x = 0; x < W; x += 16) ctx.fillRect(x, 0, 1, H)

    if (!this.scene.textures.exists(key)) this.scene.textures.addCanvas(key, c)
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────
  _hexToRgb(hex) {
    const r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff
    return `rgb(${r},${g},${b})`
  }
}
