import 'dotenv/config'
import * as bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { DEFAULT_SETTINGS } from './defaults'
import { SCHEMAS } from './schemas'

// npm run seed         creates (or updates) the admin login and default site settings
// npm run seed:sample  does the same, then adds sample artworks, a track and a blog post if the collections are empty
async function main() {
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD in .env first.')
  if (ADMIN_PASSWORD.length < 10) throw new Error('ADMIN_PASSWORD must be at least 10 characters.')
  await mongoose.connect(MONGODB_URI)
  const m = (name: string) => mongoose.model(name, SCHEMAS.find((s) => s.name === name).schema)

  await m('User').findOneAndUpdate(
    { email: ADMIN_EMAIL.toLowerCase() },
    { $set: { email: ADMIN_EMAIL.toLowerCase(), passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12) } },
    { upsert: true },
  )
  console.log(`Admin ready: ${ADMIN_EMAIL}`)

  await m('Setting').findOneAndUpdate({ key: 'site' }, { $setOnInsert: { ...DEFAULT_SETTINGS, key: 'site' } }, { upsert: true })
  console.log('Site settings ready')

  if (process.argv.includes('--sample')) {
    const add = async (name: string, docs: any[]) => {
      if (await m(name).countDocuments()) return console.log(`${name}: already has data, skipped`)
      await m(name).insertMany(docs)
      console.log(`${name}: added ${docs.length} sample item(s)`)
    }
    await add('Work', [
      { title: 'Golden Hour Lagos', collection: 'sale', medium: 'Oil on canvas', size: '60 x 80 cm', price: 450000, printPrice: 25000, status: 'available', image: '' },
      { title: 'Quiet Market', collection: 'sale', medium: 'Acrylic', size: '40 x 50 cm', price: 280000, printPrice: 25000, status: 'available', image: '' },
      { title: 'Ink and Ochre', collection: 'sale', medium: 'Mixed media', size: '50 x 70 cm', price: 360000, printPrice: 25000, status: 'available', image: '' },
      { title: 'Crossing', collection: 'archive', medium: 'Oil on canvas', year: 2024, image: '' },
      { title: 'Salt Wind', collection: 'archive', medium: 'Acrylic', year: 2024, image: '' },
    ])
    await add('Track', [{ title: 'Slow Burn', meta: 'Single, 2026', length: '3:42', src: '', cover: '' }])
    await add('Post', [{ title: 'Welcome to the new site', caption: 'Originals, prints, videos and music, all in one place.', cover: '', date: new Date().toISOString().slice(0, 10), updatedAt: null, body: 'Welcome.\n\nEdit or delete this post from the admin dashboard.' }])
  }
  await mongoose.disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
