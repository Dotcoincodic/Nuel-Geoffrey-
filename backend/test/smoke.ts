import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { getConnectionToken, getModelToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import * as bcrypt from 'bcryptjs'
import { createHmac } from 'crypto'
import { Types } from 'mongoose'
import { AdminGuard, AuthController } from '../src/auth'
import { crud, MessagesController, PublicController, SettingsService, VideoReactionsController } from '../src/content'
import { MailService } from '../src/mail'
import { OrdersController, OrdersService } from '../src/orders'
import { HealthController } from '../src/health'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

class Doc {
  constructor(public d: any) {}
  get _id() { return this.d._id }
  get(k: string) { return this.d[k] }
  set(o: any) { Object.assign(this.d, o) }
  async save() { return this }
  toJSON() { const { _id, ...r } = this.d; return { ...r, id: String(_id) } }
}
const match = (d: any, q: any) => Object.entries(q || {}).every(([k, v]: any) =>
  k === '_id' ? (v?.$in ? v.$in.map(String).includes(String(d._id)) : String(d._id) === String(v)) : v?.$in ? v.$in.includes(d[k]) : d[k] === v)
class Fake {
  docs: Doc[] = []
  async create(x: any) { const doc = new Doc({ _id: new Types.ObjectId(), ...x }); this.docs.push(doc); return doc }
  find(q?: any) { const r = this.docs.filter((x) => match(x.d, q)); const p: any = Promise.resolve(r); p.sort = () => p; return p }
  async findOne(q: any) { return this.docs.find((x) => match(x.d, q)) || null }
  async findById(id: any) { return this.findOne({ _id: id }) }
  async findByIdAndUpdate(id: any, update: any) { const doc = await this.findById(id); if (doc) doc.set(update.$set || {}); return doc }
  async findOneAndUpdate(q: any, u: any, o?: any) { let doc = await this.findOne(q); if (!doc && o?.upsert) doc = await this.create(q); if (doc) doc.set(u.$set || {}); return doc }
  async updateMany(q: any, u: any) { this.docs.filter((x) => match(x.d, q)).forEach((x) => x.set(u.$set)); return {} }
  async deleteOne(q: any) { this.docs = this.docs.filter((x) => !match(x.d, q)); return {} }
}

const ok = (name: string, cond: boolean, extra = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${extra}`); if (!cond) process.exitCode = 1 }

async function main() {
  const models: Record<string, Fake> = {}
  const connection = { readyState: 1 }
  const tokens = ['Work', 'Track', 'Video', 'Post', 'Setting', 'Message', 'Order', 'User'].map((n) => (models[n] = new Fake(), { provide: getModelToken(n), useValue: models[n] }))
  tokens.push({ provide: getConnectionToken(), useValue: connection } as any)
  const mod = await Test.createTestingModule({
    imports: [JwtModule.register({ secret: 'x'.repeat(40) }), ThrottlerModule.forRoot([{ ttl: 60000, limit: 1000 }])],
    controllers: [AuthController, HealthController, PublicController, VideoReactionsController, MessagesController, OrdersController, crud('works', 'Work')],
    providers: [AdminGuard, MailService, SettingsService, OrdersService, { provide: APP_GUARD, useClass: ThrottlerGuard }, ...tokens],
  }).compile()
  const app = mod.createNestApplication({ rawBody: true })
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('Test API').setVersion('1').addBearerAuth().build()))
  await app.listen(0)
  const base = (await app.getUrl()).replace('[::1]', 'localhost')
  const call = async (method: string, path: string, body?: any, headers: any = {}, raw?: string) => {
    const res = await fetch(base + '/api' + path, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: raw ?? (body ? JSON.stringify(body) : undefined) })
    return { status: res.status, json: (await res.json().catch(() => null)) as any }
  }

  ok('public endpoint works with defaults', (await call('GET', '/public')).status === 200)
  const docs = await call('GET', '/docs-json')
  ok('OpenAPI docs include secured admin routes', docs.status === 200 && !!docs.json?.paths?.['/api/orders']?.get?.security?.length)
  ok('Swagger UI is served', (await call('GET', '/docs')).status === 200)
  ok('health endpoint reports connected database', (await call('GET', '/health')).status === 200)
  connection.readyState = 0
  ok('health endpoint reports disconnected database', (await call('GET', '/health')).status === 503)
  connection.readyState = 1
  ok('admin write without token is 401', (await call('POST', '/works', { title: 'x' })).status === 401)

  await models.User.create({ email: 'a@b.com', passwordHash: await bcrypt.hash('correct-password', 4) })
  ok('wrong password is 401', (await call('POST', '/auth/login', { email: 'a@b.com', password: 'nope' })).status === 401)
  const login = await call('POST', '/auth/login', { email: 'a@b.com', password: 'correct-password' })
  ok('right password returns a token', login.status === 201 && !!login.json.token)
  const auth = { Authorization: 'Bearer ' + login.json.token }

  ok('content DTO rejects invalid price values', (await call('POST', '/works', { title: 'Bad price', price: -1 }, auth)).status === 400)
  const w = await call('POST', '/works', { title: 'Piece', collection: 'sale', price: 100000, printPrice: 20000, status: 'available', customLabel: 'studio edition' }, auth)
  ok('admin can create a work', w.status === 201 && !!w.json.id)
  ok('flexible content schemas preserve custom fields', w.json.customLabel === 'studio edition')
  ok('admin can update a work', (await call('PUT', '/works/' + w.json.id, { title: 'Updated piece' }, auth)).status === 200)
  ok('public can list works', (await call('GET', '/works')).json[0]?.title === 'Updated piece')
  ok('settings DTO rejects negative shipping', (await call('PUT', '/settings', { shippingFee: -1 }, auth)).status === 400)
  const customer = { name: 'Ada', email: 'ada@x.com', phone: '0801', address: 'Lagos' }

  ok('bad order body is 400', (await call('POST', '/orders', { items: [], customer })).status === 400)
  const o1 = await call('POST', '/orders', { customer, items: [{ workId: w.json.id, option: 'Original', price: 1 }] })
  ok('order created, price taken from DB not client', o1.status === 201 && o1.json.order.subtotal === 100000, JSON.stringify({ sub: o1.json?.order?.subtotal, ship: o1.json?.order?.shipping, total: o1.json?.order?.total }))
  ok('shipping fee added from settings', o1.json.order.total === 108000)
  ok('original is now reserved', models.Work.docs[0].get('status') === 'reserved')
  ok('second buyer is refused', (await call('POST', '/orders', { customer, items: [{ workId: w.json.id, option: 'Original' }] })).status === 400)
  ok('print order for same work still works', (await call('POST', '/orders', { customer, items: [{ workId: w.json.id, option: 'Print', qty: 2 }] })).json?.order?.subtotal === 40000)

  process.env.PAYSTACK_SECRET_KEY = 'sk_test_secret'
  const evt = JSON.stringify({ event: 'charge.success', data: { reference: o1.json.order.ref, amount: 10800000, currency: 'NGN' } })
  ok('webhook with bad signature is 401', (await call('POST', '/payments/webhook', undefined, { 'x-paystack-signature': 'bad' }, evt)).status === 401)
  const wrongAmt = JSON.stringify({ event: 'charge.success', data: { reference: o1.json.order.ref, amount: 100, currency: 'NGN' } })
  const sign = (b: string) => createHmac('sha512', 'sk_test_secret').update(b).digest('hex')
  await call('POST', '/payments/webhook', undefined, { 'x-paystack-signature': sign(wrongAmt) }, wrongAmt)
  ok('wrong amount does not mark paid', models.Order.docs[0].get('paid') === false)
  const good = await call('POST', '/payments/webhook', undefined, { 'x-paystack-signature': sign(evt) }, evt)
  ok('webhook with valid signature is 200', good.status === 200)
  ok('order marked paid and work sold', models.Order.docs[0].get('paid') === true && models.Work.docs[0].get('status') === 'sold')
  await call('POST', '/payments/webhook', undefined, { 'x-paystack-signature': sign(evt) }, evt)
  ok('repeat webhook is harmless', models.Order.docs[0].get('paid') === true)

  const paidCancel = await call('PATCH', '/orders/' + o1.json.order.id, { status: 'cancelled' }, auth)
  ok('cancelling a paid order keeps its original sold', paidCancel.status === 200 && models.Work.docs[0].get('status') === 'sold' && models.Order.docs[0].get('paid') === true)
  ok('cancelled orders cannot be reopened', (await call('PATCH', '/orders/' + o1.json.order.id, { status: 'delivered' }, auth)).status === 400)
  await models.Order.create({ ref: 'ART-CANCELLED', items: [], total: 100, paid: false, status: 'cancelled' })
  const latePayment = await mod.get(OrdersService).confirmPayment('ART-CANCELLED', 10000, 'NGN')
  ok('late payment does not reopen a cancelled order', latePayment.get('paid') === false && latePayment.get('status') === 'cancelled')

  delete process.env.PAYSTACK_SECRET_KEY
  const w2 = await call('POST', '/works', { title: 'Another piece', collection: 'sale', price: 5000, status: 'available' }, auth)
  const o2 = await call('POST', '/orders', { customer, items: [{ workId: w2.json.id, option: 'Original' }] })
  const cancelled = await call('PATCH', '/orders/' + o2.json.order.id, { status: 'cancelled' }, auth)
  ok('cancelling an unpaid order releases its reserved original', cancelled.status === 200 && models.Work.docs.find((x) => String(x._id) === w2.json.id).get('status') === 'available')

  ok('messages validate input', (await call('POST', '/messages', { type: 'contact', name: '', message: '' })).status === 400)
  ok('valid message accepted', (await call('POST', '/messages', { type: 'comment', name: 'Bo', message: 'Lovely', videoId: 'v', videoTitle: 'T' })).status === 201)
  ok('orders list needs admin', (await call('GET', '/orders')).status === 401 && (await call('GET', '/orders', undefined, auth)).status === 200)

  const changed = await call('POST', '/auth/change-password', { currentPassword: 'correct-password', newPassword: 'new-secure-password' }, auth)
  ok('admin can change password', changed.status === 201 && changed.json?.ok === true)
  ok('password change revokes existing bearer token', (await call('GET', '/orders', undefined, auth)).status === 401)
  await app.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
