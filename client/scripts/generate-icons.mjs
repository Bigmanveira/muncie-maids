// Regenerates PWA/favicon icon sizes from src/assets/logo.png.
// Run after replacing the logo: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(dir, '..')
const source = path.join(root, 'src/assets/logo.png')
const publicDir = path.join(root, 'public')

const targets = [
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon-32x32.png', size: 32 },
]

for (const { file, size } of targets) {
  await sharp(source)
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, file))
  console.log(`wrote ${file}`)
}
