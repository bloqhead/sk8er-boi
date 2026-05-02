/**
 * Returns layout tokens that scale with the actual canvas size.
 * Call at the top of every scene's create() and after resize.
 *
 * Portrait phone (~390px wide)  → small tokens
 * Landscape tablet (~1024px wide) → large tokens
 */
export function layout(scene) {
  const W = scene.scale.width
  const H = scene.scale.height
  const isPortrait = H > W

  // Base unit: roughly 1/30 of the shorter dimension
  const short = Math.min(W, H)
  const u = Math.max(8, Math.floor(short / 30))  // 8–24px depending on screen

  // Ground is always near the bottom, with a bit of room for touch buttons on mobile
  const touchBarH = isPortrait ? u * 6 : u * 4
  const groundY   = H - touchBarH - u * 2

  // Font sizes (for Press Start 2P — very wide font, keep small)
  const font = {
    xl:   Math.max(14, u * 1.6) | 0,   // title
    lg:   Math.max(10, u * 1.2) | 0,   // section headers
    md:   Math.max(7,  u * 0.9) | 0,   // body / menu
    sm:   Math.max(5,  u * 0.7) | 0,   // labels
    xs:   Math.max(4,  u * 0.55)| 0,   // tiny hints
  }

  // Touch button sizing
  const btnR   = Math.max(28, u * 2.2) | 0   // button radius
  const btnPad = Math.max(10, u * 0.8) | 0   // edge padding

  return { W, H, u, isPortrait, groundY, touchBarH, font, btnR, btnPad }
}
