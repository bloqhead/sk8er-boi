/**
 * Returns layout tokens that scale with the actual canvas size.
 * The arcade panel is now a DOM element outside the canvas,
 * so groundY only needs to account for HUD elements inside the canvas.
 */
export function layout(scene) {
  const W = scene.scale.width
  const H = scene.scale.height
  const isPortrait = H > W

  const short = Math.min(W, H)
  const u = Math.max(8, Math.floor(short / 30))

  // Ground sits near the bottom of the canvas — panel is outside canvas now
  const groundY = H - u * 3

  const font = {
    xl:  Math.max(14, u * 1.6) | 0,
    lg:  Math.max(10, u * 1.2) | 0,
    md:  Math.max(7,  u * 0.9) | 0,
    sm:  Math.max(5,  u * 0.7) | 0,
    xs:  Math.max(4,  u * 0.55)| 0,
  }

  // btnR/btnPad kept for any remaining in-canvas UI that uses them
  const btnR   = Math.max(24, u * 1.8) | 0
  const btnPad = Math.max(8,  u * 0.6) | 0

  return { W, H, u, isPortrait, groundY, touchBarH: 0, font, btnR, btnPad }
}
