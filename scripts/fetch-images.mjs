// One-off: fetch curated high-res photos from Unsplash for every product + hero.
// Usage: node scripts/fetch-images.mjs [only-file-substring]
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const ROOT = join(import.meta.dirname, '..', 'frontend', 'public', 'images')

// w/h chosen for the 3:4 product cards; hero is taller.
const ITEMS = [
  { file: 'hero/hero-editorial.jpg', q: 'man tailored coat fashion editorial street style', want: ['coat', 'suit', 'jacket', 'blazer'], w: 1600, h: 2000 },

  { file: 'products/shirts/classic-white-oxford.jpg', q: 'man wearing white button up shirt portrait', want: ['white', 'shirt'], w: 1200, h: 1600 },
  { file: 'products/shirts/navy-polo.jpg', q: 'man wearing navy polo shirt', want: ['polo', 'shirt'], w: 1200, h: 1600 },
  { file: 'products/shirts/slim-check-dress.jpg', q: 'man wearing plaid checked shirt portrait', want: ['plaid', 'check', 'shirt'], w: 1200, h: 1600 },
  { file: 'products/shirts/linen-short-sleeve.jpg', q: 'man wearing beige linen shirt summer', want: ['linen', 'shirt'], w: 1200, h: 1600 },
  { file: 'products/shirts/midnight-black-oxford.jpg', q: 'man wearing black dress shirt portrait', want: ['black', 'shirt'], w: 1200, h: 1600 },
  { file: 'products/shirts/grey-chambray.jpg', q: 'man wearing denim chambray shirt', want: ['denim', 'chambray', 'shirt'], w: 1200, h: 1600 },

  { file: 'products/trousers/slim-khaki-chinos.jpg', q: 'man wearing khaki chino trousers fashion', want: ['khaki', 'chino', 'trousers', 'pants'], w: 1200, h: 1600 },
  { file: 'products/trousers/charcoal-dress-trousers.jpg', q: 'man grey suit trousers tailored fashion', want: ['suit', 'trousers', 'pants', 'grey', 'gray'], w: 1200, h: 1600 },
  { file: 'products/trousers/indigo-jeans.jpg', q: 'man wearing dark blue jeans denim fashion', want: ['jeans', 'denim'], w: 1200, h: 1600 },
  { file: 'products/trousers/stone-linen-trousers.jpg', q: 'man wearing beige linen trousers summer outfit', want: ['linen', 'trousers', 'pants', 'beige'], w: 1200, h: 1600 },

  { file: 'products/accessories/leather-belt-brown.jpg', q: 'brown leather belt product', want: ['belt', 'leather'], w: 1200, h: 1600 },
  { file: 'products/accessories/bifold-wallet-black.jpg', q: 'black leather wallet product photography', want: ['wallet', 'leather'], w: 1200, h: 1600 },
  { file: 'products/accessories/brushed-steel-watch.jpg', q: 'silver steel wristwatch men product', want: ['watch'], w: 1200, h: 1600 },
  { file: 'products/accessories/navy-baseball-cap.jpg', q: 'navy blue baseball cap product', want: ['cap', 'hat'], w: 1200, h: 1600 },
  { file: 'products/accessories/card-holder-black.jpg', q: 'leather card holder minimal product', want: ['card', 'wallet', 'leather'], w: 1200, h: 1600 },

  { file: 'products/outerwear/camel-overcoat.jpg', q: 'man wearing camel overcoat winter fashion', want: ['coat', 'overcoat'], w: 1200, h: 1600 },
  { file: 'products/outerwear/olive-bomber.jpg', q: 'man wearing green bomber jacket street style', want: ['bomber', 'jacket'], w: 1200, h: 1600 },
  { file: 'products/outerwear/blue-denim-jacket.jpg', q: 'man wearing blue denim jacket fashion', want: ['denim', 'jacket'], w: 1200, h: 1600 },
  { file: 'products/outerwear/navy-db-blazer.jpg', q: 'man wearing navy blazer suit jacket tailored', want: ['blazer', 'suit', 'jacket'], w: 1200, h: 1600 },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function textOf(r) {
  return [r.alt_description, r.description, r.alternative_slugs?.en, ...(r.tags?.map((t) => t.title) ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

async function search(query) {
  const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=portrait`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`search ${res.status} for ${query}`)
  const json = await res.json()
  return json.results ?? []
}

async function run() {
  const only = process.argv[2]
  const manifest = []
  for (const item of ITEMS) {
    if (only && !item.file.includes(only)) continue
    try {
      const results = await search(item.q)
      const ranked = results
        .map((r) => ({ r, score: item.want.reduce((s, w) => s + (textOf(r).includes(w) ? 1 : 0), 0) + (r.premium ? -2 : 0) }))
        .sort((a, b) => b.score - a.score)
      const pick = ranked[0]?.r
      if (!pick) { console.error(`NO RESULT: ${item.file}`); continue }
      const dl = `${pick.urls.raw}&w=${item.w}&h=${item.h}&fit=crop&crop=faces,entropy&q=85&fm=jpg`
      const imgRes = await fetch(dl)
      if (!imgRes.ok) throw new Error(`download ${imgRes.status}`)
      const buf = Buffer.from(await imgRes.arrayBuffer())
      const dest = join(ROOT, item.file)
      await mkdir(dirname(dest), { recursive: true })
      await writeFile(dest, buf)
      manifest.push({ file: item.file, id: pick.id, alt: pick.alt_description, alternates: ranked.slice(1, 6).map((x) => ({ id: x.r.id, alt: x.r.alt_description, raw: x.r.urls.raw })) })
      console.log(`OK  ${item.file}  <- ${pick.id}  "${pick.alt_description}"  (${(buf.length / 1024).toFixed(0)} KB)`)
    } catch (e) {
      console.error(`FAIL ${item.file}: ${e.message}`)
    }
    await sleep(800)
  }
  await writeFile(join(import.meta.dirname, 'image-manifest.json'), JSON.stringify(manifest, null, 2))
}

run()
