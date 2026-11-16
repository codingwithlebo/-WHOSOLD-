import * as THREE from 'three'

/**
 * Procedural textures and materials for the money in the 3D scenes:
 * minted coins (embossed faces, beaded rim, reeded edge), banknotes and
 * banknote bundles. Everything is drawn on canvases at runtime, so there are
 * no image downloads. The designs are fictional ("Bank of the Mystery
 * Billionaire") and say they are virtual funds, as the PRD requires.
 *
 * Assets are created once and shared between scenes.
 */

type Mode = 'color' | 'bump'

const GOLD_LIGHT = '#fff3b8'
const GOLD = '#e9b949'
const GOLD_DEEP = '#a8771b'
const GOLD_DARK = '#6b4a0e'

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas not available')
  return { canvas, ctx }
}

function toTexture(canvas: HTMLCanvasElement, color: boolean) {
  const texture = new THREE.CanvasTexture(canvas)
  if (color) texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

/** Grey level for bump maps: higher = raised. */
const level = (value: number) => `rgb(${value},${value},${value})`

function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
) {
  const chars = Array.from(
    new Intl.Segmenter().segment(text),
    ({ segment }) => segment,
  )
  const step = (Math.PI * 2) / chars.length
  chars.forEach((char, index) => {
    const angle = -Math.PI / 2 + index * step
    ctx.save()
    ctx.translate(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius)
    ctx.rotate(angle + Math.PI / 2)
    ctx.fillText(char, 0, 0)
    ctx.restore()
  })
}

function drawSunburst(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  points: number,
) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
  }
  ctx.closePath()
  ctx.fill()
}

function drawCoinFace(side: 'heads' | 'tails', mode: Mode) {
  const size = 1024
  const c = size / 2
  const { canvas, ctx } = makeCanvas(size, size)
  const color = mode === 'color'

  // Field (the flat, slightly lower background of the coin)
  if (color) {
    const g = ctx.createRadialGradient(c - 180, c - 200, 40, c, c, c)
    g.addColorStop(0, GOLD_LIGHT)
    g.addColorStop(0.35, GOLD)
    g.addColorStop(0.75, GOLD_DEEP)
    g.addColorStop(1, GOLD_DARK)
    ctx.fillStyle = g
  } else {
    ctx.fillStyle = level(110)
  }
  ctx.fillRect(0, 0, size, size)

  // Fine radial brushing so the metal catches light unevenly
  if (color) {
    ctx.globalAlpha = 0.06
    for (let i = 0; i < 360; i += 2) {
      const a = (i * Math.PI) / 180
      ctx.strokeStyle = i % 4 === 0 ? '#ffffff' : '#000000'
      ctx.beginPath()
      ctx.moveTo(c, c)
      ctx.lineTo(c + Math.cos(a) * c, c + Math.sin(a) * c)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  // Raised outer rim
  ctx.lineWidth = 56
  ctx.strokeStyle = color ? '#d9a93a' : level(235)
  ctx.beginPath()
  ctx.arc(c, c, 482, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 6
  ctx.strokeStyle = color ? GOLD_DARK : level(60)
  ctx.beginPath()
  ctx.arc(c, c, 450, 0, Math.PI * 2)
  ctx.stroke()

  // Beaded ring
  ctx.fillStyle = color ? '#f8dc84' : level(215)
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(c + Math.cos(a) * 425, c + Math.sin(a) * 425, 7, 0, Math.PI * 2)
    ctx.fill()
  }

  // Legend around the edge
  ctx.fillStyle = color ? '#5c3f0a' : level(200)
  ctx.font = '700 52px Georgia, "Times New Roman", serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  drawArcText(
    ctx,
    side === 'heads'
      ? ' WHOSOLD ✦ MYSTERY FUND ✦ 2026 ✦'
      : ' DOUBLE ✦ OR ✦ PASS ✦ VIRTUAL ✦',
    c,
    c,
    368,
  )

  // Central device
  const relief = (fn: () => void) => {
    if (color) {
      // Engraved look: dark offset shadow, then the lit relief on top.
      ctx.save()
      ctx.translate(6, 8)
      ctx.fillStyle = 'rgba(70, 45, 5, 0.65)'
      fn()
      ctx.restore()
      const g = ctx.createLinearGradient(c - 200, c - 220, c + 200, c + 220)
      g.addColorStop(0, '#fff6c9')
      g.addColorStop(0.5, '#f0c55a')
      g.addColorStop(1, '#b8861f')
      ctx.fillStyle = g
      fn()
    } else {
      ctx.fillStyle = level(250)
      fn()
    }
  }

  if (side === 'heads') {
    ctx.font = '900 330px Georgia, "Times New Roman", serif'
    relief(() => ctx.fillText('R5', c, c - 10))
    ctx.font = '700 58px Georgia, "Times New Roman", serif'
    relief(() => ctx.fillText('FIVE RAND', c, c + 190))
  } else {
    relief(() => drawSunburst(ctx, c, c, 150, 270, 16))
    ctx.fillStyle = color ? '#7a5512' : level(90)
    ctx.beginPath()
    ctx.arc(c, c, 140, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = '900 230px Georgia, "Times New Roman", serif'
    relief(() => ctx.fillText('?', c, c + 10))
  }

  return canvas
}

function drawCoinEdge(mode: Mode) {
  const { canvas, ctx } = makeCanvas(1024, 32)
  for (let x = 0; x < 1024; x += 8) {
    if (mode === 'color') {
      const g = ctx.createLinearGradient(x, 0, x + 8, 0)
      g.addColorStop(0, GOLD_DARK)
      g.addColorStop(0.5, GOLD_LIGHT)
      g.addColorStop(1, GOLD_DEEP)
      ctx.fillStyle = g
    } else {
      const g = ctx.createLinearGradient(x, 0, x + 8, 0)
      g.addColorStop(0, level(40))
      g.addColorStop(0.5, level(230))
      g.addColorStop(1, level(40))
      ctx.fillStyle = g
    }
    ctx.fillRect(x, 0, 8, 32)
  }
  return canvas
}

function drawGuilloche(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokeStyle: string,
) {
  ctx.save()
  ctx.strokeStyle = strokeStyle
  ctx.lineWidth = 1.4
  for (let k = 0; k < 26; k++) {
    ctx.beginPath()
    for (let x = 0; x <= width; x += 6) {
      const y =
        height / 2 +
        Math.sin(x * 0.012 + k * 0.45) * (height * 0.32) +
        Math.sin(x * 0.041 + k) * 14
      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
  }
  ctx.restore()
}

function drawNoteFront() {
  const w = 1024
  const h = 480
  const { canvas, ctx } = makeCanvas(w, h)

  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#0d4b33')
  bg.addColorStop(0.5, '#1b7a5a')
  bg.addColorStop(1, '#0b3f2c')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  drawGuilloche(ctx, w, h, 'rgba(190, 255, 220, 0.13)')

  // Borders
  ctx.strokeStyle = 'rgba(244, 211, 122, 0.9)'
  ctx.lineWidth = 6
  ctx.strokeRect(18, 18, w - 36, h - 36)
  ctx.lineWidth = 2
  ctx.strokeRect(32, 32, w - 64, h - 64)

  // Portrait window: the mystery billionaire
  const px = 250
  const py = 245
  const portrait = ctx.createRadialGradient(px, py - 30, 10, px, py, 150)
  portrait.addColorStop(0, '#bff0d6')
  portrait.addColorStop(1, '#2c8a66')
  ctx.fillStyle = portrait
  ctx.beginPath()
  ctx.ellipse(px, py, 120, 150, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#f4d37a'
  ctx.lineWidth = 5
  ctx.stroke()
  ctx.fillStyle = '#0d4b33'
  ctx.beginPath()
  ctx.arc(px, py - 40, 48, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(px, py + 95, 95, 70, 0, Math.PI, 0)
  ctx.fill()
  ctx.fillStyle = '#f4d37a'
  ctx.font = '900 64px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('?', px, py - 38)

  // Holographic security stripe
  const holo = ctx.createLinearGradient(430, 0, 470, h)
  holo.addColorStop(0, 'rgba(255,255,255,0.75)')
  holo.addColorStop(0.25, 'rgba(196,181,253,0.8)')
  holo.addColorStop(0.5, 'rgba(253,230,138,0.8)')
  holo.addColorStop(0.75, 'rgba(153,246,228,0.8)')
  holo.addColorStop(1, 'rgba(255,255,255,0.75)')
  ctx.fillStyle = holo
  ctx.fillRect(420, 32, 34, h - 64)

  // Text
  ctx.textAlign = 'left'
  ctx.fillStyle = '#f4d37a'
  ctx.font = '700 30px Georgia, serif'
  ctx.fillText('BANK OF THE MYSTERY BILLIONAIRE', 490, 78)
  ctx.font = '900 150px Georgia, serif'
  ctx.fillStyle = '#fff4cf'
  ctx.fillText('R200', 486, 225)
  ctx.font = '700 34px Georgia, serif'
  ctx.fillStyle = '#d7f5e6'
  ctx.fillText('TWO HUNDRED RAND', 494, 318)
  ctx.font = '600 22px "Courier New", monospace'
  ctx.fillStyle = '#ff8d8d'
  ctx.fillText('WS 2026 000 777', 494, 372)
  ctx.font = '600 18px Arial, sans-serif'
  ctx.fillStyle = 'rgba(215,245,230,0.85)'
  ctx.fillText('VIRTUAL FUNDS · NOT LEGAL TENDER', 494, 418)

  ctx.font = '900 54px Georgia, serif'
  ctx.fillStyle = '#f4d37a'
  ctx.textAlign = 'right'
  ctx.fillText('200', w - 50, 92)
  ctx.fillText('200', w - 50, h - 50)

  return canvas
}

function drawNoteBack() {
  const w = 1024
  const h = 480
  const { canvas, ctx } = makeCanvas(w, h)
  const bg = ctx.createLinearGradient(0, h, w, 0)
  bg.addColorStop(0, '#0b3f2c')
  bg.addColorStop(1, '#1d805e')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  drawGuilloche(ctx, w, h, 'rgba(190, 255, 220, 0.1)')
  ctx.strokeStyle = 'rgba(244, 211, 122, 0.85)'
  ctx.lineWidth = 6
  ctx.strokeRect(18, 18, w - 36, h - 36)
  ctx.fillStyle = 'rgba(244, 211, 122, 0.9)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '900 220px Georgia, serif'
  ctx.fillText('200', w / 2, h / 2 + 10)
  ctx.font = '700 28px Georgia, serif'
  ctx.fillText('DOUBLE OR PASS', w / 2, 70)
  return canvas
}

function drawBundleEdge() {
  const { canvas, ctx } = makeCanvas(512, 128)
  for (let y = 0; y < 128; y += 2) {
    ctx.fillStyle = y % 4 === 0 ? '#e7efe0' : '#5f9f84'
    ctx.fillRect(0, y, 512, 2)
  }
  return canvas
}

function drawBand() {
  const { canvas, ctx } = makeCanvas(256, 256)
  const g = ctx.createLinearGradient(0, 0, 256, 0)
  g.addColorStop(0, '#5b21b6')
  g.addColorStop(0.5, '#8b5cf6')
  g.addColorStop(1, '#5b21b6')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  ctx.fillStyle = '#fde68a'
  ctx.fillRect(0, 20, 256, 6)
  ctx.fillRect(0, 230, 256, 6)
  ctx.save()
  ctx.translate(128, 128)
  ctx.rotate(-Math.PI / 2)
  ctx.font = '800 44px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('R20 000', 0, 0)
  ctx.restore()
  return canvas
}

function drawGlint() {
  const { canvas, ctx } = makeCanvas(128, 128)
  const c = 64
  const glow = ctx.createRadialGradient(c, c, 0, c, c, 64)
  glow.addColorStop(0, 'rgba(255,255,255,1)')
  glow.addColorStop(0.15, 'rgba(255,255,255,0.6)')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 128, 128)
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.beginPath()
  ctx.moveTo(c, 0)
  ctx.lineTo(c + 4, c - 4)
  ctx.lineTo(128, c)
  ctx.lineTo(c + 4, c + 4)
  ctx.lineTo(c, 128)
  ctx.lineTo(c - 4, c + 4)
  ctx.lineTo(0, c)
  ctx.lineTo(c - 4, c - 4)
  ctx.closePath()
  ctx.fill()
  return canvas
}

/** Brilliant-cut diamond: table, two crown rings, girdle and pavilion. */
function createDiamondGeometry() {
  const profile = [
    new THREE.Vector2(0.0001, -0.78), // culet
    new THREE.Vector2(0.36, -0.42),
    new THREE.Vector2(0.62, -0.06), // girdle
    new THREE.Vector2(0.62, 0.0),
    new THREE.Vector2(0.52, 0.15),
    new THREE.Vector2(0.36, 0.27), // table edge
    new THREE.Vector2(0.0001, 0.27), // table
  ]
  const lathe = new THREE.LatheGeometry(profile, 16)
  const faceted = lathe.toNonIndexed()
  faceted.computeVertexNormals()
  lathe.dispose()
  return faceted
}

export interface MoneyAssets {
  coinGeometry: THREE.CylinderGeometry
  coinMaterials: THREE.MeshStandardMaterial[]
  noteGeometry: THREE.PlaneGeometry
  noteFront: THREE.MeshStandardMaterial
  noteBack: THREE.MeshStandardMaterial
  bundleGeometry: THREE.BoxGeometry
  bundleMaterials: THREE.MeshStandardMaterial[]
  bandGeometry: THREE.BoxGeometry
  bandMaterial: THREE.MeshStandardMaterial
  diamondGeometry: THREE.BufferGeometry
  glintTexture: THREE.CanvasTexture
}

export const COIN_RADIUS = 0.55
export const COIN_HEIGHT = 0.13

let cached: MoneyAssets | null = null

export function getMoneyAssets(): MoneyAssets {
  if (cached) return cached

  const faceTexture = (side: 'heads' | 'tails') => {
    const map = toTexture(drawCoinFace(side, 'color'), true)
    const bumpMap = toTexture(drawCoinFace(side, 'bump'), false)
    // Cylinder cap UVs are transposed; flip so the lettering reads correctly.
    for (const t of [map, bumpMap]) {
      t.center.set(0.5, 0.5)
      t.rotation = Math.PI / 2
      t.repeat.set(side === 'heads' ? 1 : -1, 1)
    }
    return new THREE.MeshStandardMaterial({
      map,
      bumpMap,
      bumpScale: 3,
      metalness: 1,
      roughness: 0.32,
    })
  }

  const edgeMap = toTexture(drawCoinEdge('color'), true)
  const edgeBump = toTexture(drawCoinEdge('bump'), false)
  const edge = new THREE.MeshStandardMaterial({
    map: edgeMap,
    bumpMap: edgeBump,
    bumpScale: 2,
    metalness: 1,
    roughness: 0.3,
  })

  const paper = (canvas: HTMLCanvasElement) =>
    new THREE.MeshStandardMaterial({
      map: toTexture(canvas, true),
      metalness: 0.05,
      roughness: 0.75,
      side: THREE.FrontSide,
    })

  const noteFront = paper(drawNoteFront())
  const noteBack = paper(drawNoteBack())
  const bundleEdge = paper(drawBundleEdge())

  // Notes are slightly curved, like real paper.
  const noteGeometry = new THREE.PlaneGeometry(0.95, 0.445, 12, 1)
  const positions = noteGeometry.getAttribute('position')
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    positions.setZ(i, Math.sin((x / 0.95) * Math.PI) * 0.035)
  }
  noteGeometry.computeVertexNormals()

  cached = {
    coinGeometry: new THREE.CylinderGeometry(
      COIN_RADIUS,
      COIN_RADIUS,
      COIN_HEIGHT * 0.92,
      72,
    ),
    // CylinderGeometry groups: side, top, bottom
    coinMaterials: [edge, faceTexture('heads'), faceTexture('tails')],
    noteGeometry,
    noteFront,
    noteBack,
    bundleGeometry: new THREE.BoxGeometry(1.3, 0.3, 0.61),
    // BoxGeometry groups: +x, -x, +y, -y, +z, -z
    bundleMaterials: [
      bundleEdge,
      bundleEdge,
      noteFront,
      noteBack,
      bundleEdge,
      bundleEdge,
    ],
    bandGeometry: new THREE.BoxGeometry(0.24, 0.312, 0.622),
    bandMaterial: new THREE.MeshStandardMaterial({
      map: toTexture(drawBand(), true),
      roughness: 0.6,
    }),
    diamondGeometry: createDiamondGeometry(),
    glintTexture: toTexture(drawGlint(), true),
  }
  return cached
}
