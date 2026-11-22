import {
  BadGatewayException, BadRequestException, Body, Controller, Get, Headers, HttpCode, Injectable, Logger, NotFoundException,
  Param, Patch, Post, RawBodyRequest, Req, UnauthorizedException, UseGuards,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { SkipThrottle, Throttle } from '@nestjs/throttler'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested,
} from 'class-validator'
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { Request } from 'express'
import { isValidObjectId, Model } from 'mongoose'
import { AdminGuard } from './auth'
import { SettingsService } from './content'
import { MailService } from './mail'
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger'

class OrderItemDto {
  @ApiProperty({ example: '66e2a0000000000000000000' })
  @IsString() workId: string
  @ApiProperty({ enum: ['Original', 'Print'] })
  @IsIn(['Original', 'Print']) option: 'Original' | 'Print'
  @ApiProperty({ required: false, minimum: 1, maximum: 20 })
  @IsOptional() @IsInt() @Min(1) @Max(20) qty?: number
}
class CustomerDto {
  @ApiProperty()
  @IsString() @MaxLength(100) name: string
  @ApiProperty()
  @IsEmail() email: string
  @ApiProperty()
  @IsString() @MaxLength(30) phone: string
  @ApiProperty()
  @IsString() @MaxLength(500) address: string
  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(1000) note?: string
}
export class CreateOrderDto {
  @ApiProperty({ type: CustomerDto })
  @ValidateNested() @Type(() => CustomerDto) customer: CustomerDto
  @ApiProperty({ type: [OrderItemDto], minItems: 1, maxItems: 30 })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => OrderItemDto) items: OrderItemDto[]
}
class UpdateOrderDto {
  @ApiProperty({ enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] })
  @IsIn(['pending', 'paid', 'shipped', 'delivered', 'cancelled']) status: string
}

const PAYSTACK = 'https://api.paystack.co'
const secret = () => process.env.PAYSTACK_SECRET_KEY

@Injectable()
export class OrdersService {
  private log = new Logger('Orders')
  constructor(
    @InjectModel('Order') private orders: Model<any>, @InjectModel('Work') private works: Model<any>,
    private settings: SettingsService, private mail: MailService,
  ) {}

  private async setOriginals(order: any, status: string) {
    // order.get(): the schema is loose, so fields must be read with get(), not as properties.
    const ids = (order.get('items') || []).filter((i: any) => i.option === 'Original').map((i: any) => String(i.workId))
    if (ids.length) await this.works.updateMany({ _id: { $in: ids } }, { $set: { status } })
  }

  // Prices, availability and shipping all come from the database. Nothing from the browser is trusted except the ids.
  async create(dto: CreateOrderDto) {
    const wanted = new Map<string, { workId: string; option: string; qty: number }>()
    for (const it of dto.items) {
      if (!isValidObjectId(it.workId)) throw new BadRequestException('Invalid item in cart')
      const key = it.workId + it.option
      const prev = wanted.get(key)
      wanted.set(key, { workId: it.workId, option: it.option, qty: it.option === 'Original' ? 1 : Math.min((prev?.qty || 0) + (it.qty || 1), 20) })
    }
    const found = await this.works.find({ _id: { $in: [...new Set([...wanted.values()].map((w) => w.workId))] } })
    const byId = new Map(found.map((w) => [String(w._id), w]))

    const items = [...wanted.values()].map((w) => {
      const work = byId.get(w.workId)
      if (!work) throw new BadRequestException('An item in your cart no longer exists')
      if (w.option === 'Original') {
        if (work.get('status') !== 'available') throw new BadRequestException(`"${work.get('title')}" is no longer available`)
        const price = Number(work.get('price'))
        if (!Number.isSafeInteger(price) || price <= 0) throw new BadRequestException(`"${work.get('title')}" has an invalid original price`)
        return { workId: w.workId, title: work.get('title'), option: w.option, qty: 1, price }
      }
      const price = Number(work.get('printPrice') || 0)
      if (!Number.isSafeInteger(price) || price <= 0) throw new BadRequestException(`Prints of "${work.get('title')}" are not available`)
      return { workId: w.workId, title: work.get('title'), option: w.option, qty: w.qty, price }
    })

    const settings = await this.settings.get()
    // Reserve each original one at a time. If another buyer got there first, undo and refuse.
    const reserved: string[] = []
    try {
      for (const it of items.filter((i) => i.option === 'Original')) {
        const got = await this.works.findOneAndUpdate({ _id: it.workId, status: 'available' }, { $set: { status: 'reserved' } })
        if (!got) throw new BadRequestException(`"${it.title}" was just taken by another buyer`)
        reserved.push(it.workId)
      }
    } catch (e) {
      if (reserved.length) await this.works.updateMany({ _id: { $in: reserved } }, { $set: { status: 'available' } })
      throw e
    }

    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0)
    const shipping = Number(settings.shippingFee || 0)
    if (!Number.isSafeInteger(subtotal) || !Number.isSafeInteger(shipping) || shipping < 0 || !Number.isSafeInteger((subtotal + shipping) * 100)) {
      if (reserved.length) await this.works.updateMany({ _id: { $in: reserved } }, { $set: { status: 'available' } })
      throw new BadRequestException('The order total is invalid. Please contact the studio.')
    }
    const ref = 'ART-' + randomBytes(5).toString('hex').toUpperCase()
    let order: any
    try {
      order = await this.orders.create({
        ref, items, customer: dto.customer, subtotal, shipping, total: subtotal + shipping, status: 'pending', paid: false,
      })
    } catch (e) {
      if (reserved.length) await this.works.updateMany({ _id: { $in: reserved } }, { $set: { status: 'available' } })
      throw e
    }

    let authorizationUrl: string = null
    if (secret()) {
      try {
        authorizationUrl = await this.initializePayment(order.toJSON())
      } catch (e) {
        await this.setOriginals(order, 'available')
        await this.orders.deleteOne({ _id: order._id })
        throw e
      }
    } else {
      this.mail.orderPlacedUnpaid(order.toJSON())
    }
    return { order: order.toJSON(), authorizationUrl }
  }

  private async initializePayment(order: any) {
    const base = (process.env.FRONTEND_URL || '').split(',')[0].trim()
    const res = await fetch(`${PAYSTACK}/transaction/initialize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: order.customer.email, amount: order.total * 100, currency: 'NGN', reference: order.ref,
        callback_url: `${base}/?order=${order.ref}`, metadata: { orderId: order.id },
      }),
      signal: AbortSignal.timeout(10000),
    })
    const json: any = await res.json().catch(() => ({}))
    if (!res.ok || !json.status) {
      this.log.error(`Paystack initialize failed: ${json.message || res.status}`)
      throw new BadGatewayException('Could not start the payment. Please try again.')
    }
    return json.data.authorization_url as string
  }

  // Called by the webhook and by the page the buyer returns to. Safe to run twice for the same order.
  async confirmPayment(ref: string, amountKobo: number, currency: string) {
    const order = await this.orders.findOne({ ref })
    if (!order || order.get('paid')) return order
    if (order.get('status') === 'cancelled') {
      this.log.error(`Payment arrived for cancelled order ${ref}; manual review or refund is required`)
      return order
    }
    if (amountKobo !== order.get('total') * 100 || currency !== 'NGN') {
      this.log.error(`Amount mismatch on ${ref}: paid ${amountKobo} ${currency}, expected ${order.get('total') * 100} NGN`)
      return order
    }
    // The paid:false condition means only one caller wins, so emails are sent once.
    const won = await this.orders.findOneAndUpdate({ ref, paid: false }, { $set: { paid: true, status: 'paid', paidAt: new Date() } }, { new: true })
    if (won) {
      await this.setOriginals(won, 'sold')
      this.mail.orderPaid(won.toJSON())
    }
    return won || order
  }

  async verify(ref: string) {
    let order = await this.orders.findOne({ ref })
    if (!order) throw new NotFoundException('Order not found')
    if (!order.get('paid') && secret()) {
      try {
        const res = await fetch(`${PAYSTACK}/transaction/verify/${encodeURIComponent(ref)}`, { headers: { Authorization: `Bearer ${secret()}` }, signal: AbortSignal.timeout(10000) })
        const json: any = await res.json().catch(() => ({}))
        if (res.ok && json.status && json.data?.status === 'success') order = await this.confirmPayment(ref, json.data.amount, json.data.currency)
      } catch {
        this.log.warn(`Paystack verification was unavailable for ${ref}`)
      }
    }
    // Only non-personal fields go back to the browser.
    return { ref, status: order.get('status'), paid: order.get('paid'), total: order.get('total') }
  }

  list() { return this.orders.find().sort({ createdAt: -1 }) }

  async setStatus(id: string, status: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid id')
    const order = await this.orders.findById(id)
    if (!order) throw new NotFoundException()
    const current = order.get('status')
    if (status === current) return order
    const allowed: Record<string, string[]> = {
      pending: ['paid', 'cancelled'],
      paid: ['shipped', 'delivered', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    }
    if (!allowed[current]?.includes(status)) throw new BadRequestException(`Cannot change an order from ${current} to ${status}`)
    const wasPaid = Boolean(order.get('paid'))
    const workStatus = status === 'cancelled' ? (wasPaid ? 'sold' : 'available') : 'sold'
    await this.setOriginals(order, workStatus)
    order.set({ status, paid: wasPaid || ['paid', 'shipped', 'delivered'].includes(status) })
    await order.save()
    return order
  }
}

@Controller()
@ApiTags('orders and payments')
export class OrdersController {
  private log = new Logger('Webhook')
  constructor(private orders: OrdersService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('orders')
  @ApiOperation({ summary: 'Create a checkout order using current database prices' })
  create(@Body() dto: CreateOrderDto) { return this.orders.create(dto) }

  @Get('orders/verify/:ref') @ApiOperation({ summary: 'Verify order payment and return public status' })
  verify(@Param('ref') ref: string) { return this.orders.verify(ref) }
  @UseGuards(AdminGuard) @ApiBearerAuth() @Get('orders') @ApiOperation({ summary: 'List orders (admin)' }) list() { return this.orders.list() }
  @UseGuards(AdminGuard) @ApiBearerAuth() @Patch('orders/:id') @ApiOperation({ summary: 'Set order status (admin)' }) setStatus(@Param('id') id: string, @Body() dto: UpdateOrderDto) { return this.orders.setStatus(id, dto.status) }

  // Paystack signs the exact bytes it sends with your secret key (HMAC SHA512). We check that before trusting anything.
  @SkipThrottle()
  @HttpCode(200)
  @Post('payments/webhook')
  @ApiOperation({ summary: 'Receive a Paystack-signed payment webhook' })
  async webhook(@Req() req: RawBodyRequest<Request>, @Headers('x-paystack-signature') signature: string) {
    if (!secret() || !signature || !req.rawBody) throw new UnauthorizedException()
    const expected = createHmac('sha512', secret()).update(req.rawBody).digest('hex')
    const a = Buffer.from(expected), b = Buffer.from(signature)
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      this.log.warn('Rejected webhook with a bad signature')
      throw new UnauthorizedException()
    }
    const evt = JSON.parse(req.rawBody.toString('utf8'))
    if (evt.event === 'charge.success') await this.orders.confirmPayment(evt.data.reference, evt.data.amount, evt.data.currency)
    return { received: true }
  }
}
