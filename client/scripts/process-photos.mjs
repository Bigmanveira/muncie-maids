// One-off: resize/compress downloaded stock photos to stay under the
// 150KB image budget. Run: node scripts/process-photos.mjs
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const assets = path.resolve(dir, '../src/assets')

const jobs = [
  { in: 'raw-home-hero.jpg', out: 'home-hero.webp', width: 900 },
  { in: 'raw-splash-1.jpg', out: 'splash-1.webp', width: 800 },
  { in: 'raw-splash-2.jpg', out: 'splash-2.webp', width: 800 },
  { in: 'raw-splash-3.jpg', out: 'splash-3.webp', width: 800 },
]

for (const job of jobs) {
  let quality = 78
  let buffer
  do {
    buffer = await sharp(path.join(assets, job.in))
      .resize(job.width, null, { withoutEnlargement: true })
      .webp({ quality })
      .toBuffer()
    quality -= 8
  } while (buffer.length > 150_000 && quality > 30)

  await sharp(buffer).toFile(path.join(assets, job.out))
  console.log(`${job.out}: ${(buffer.length / 1024).toFixed(0)}KB`)
}
