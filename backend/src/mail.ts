import { Injectable, Logger } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

export const esc = (s: any) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
export const naira = (n: number) => '₦' + Number(n || 0).toLocaleString('en-NG')

const lines = (o: any) => o.items.map((i: any) => `<li>${esc(i.title)}, ${esc(i.option)} x${i.qty}, ${naira(i.price * i.qty)}</li>`).join('')
const summary = (o: any) =>
  `<ul>${lines(o)}</ul><p>Subtotal ${naira(o.subtotal)}<br>Shipping ${naira(o.shipping)}<br><b>Total ${naira(o.total)}</b></p>` +
  `<p>Deliver to: ${esc(o.customer.name)}, ${esc(o.customer.phone)}<br>${esc(o.customer.address)}</p>`

@Injectable()
export class MailService {
  private log = new Logger('Mail')
  private transport = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
    : null

  get adminEmail() {
    return process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL
  }

  // Never throws: a failed email must not fail an order or a message.
  async send(to: string, subject: string, html: string) {
    if (!this.transport) {
      this.log.warn(`SMTP not configured. Email to ${to}: "${subject}"`)
      return
    }
    try {
      await this.transport.sendMail({ from: process.env.MAIL_FROM || process.env.ADMIN_EMAIL, to, subject, html })
    } catch (e: any) {
      this.log.error(`Could not send "${subject}" to ${to}: ${e.message}`)
    }
  }

  orderPlacedUnpaid(o: any) {
    const bank = esc(process.env.BANK_DETAILS || 'We will email you payment details shortly.')
    void this.send(o.customer.email, `Order ${o.ref} received`, `<p>Thank you, ${esc(o.customer.name)}. We received your order <b>${esc(o.ref)}</b>.</p>${summary(o)}<p>To complete it, pay ${naira(o.total)} by bank transfer using ${esc(o.ref)} as the reference:</p><p>${bank}</p>`)
    void this.send(this.adminEmail, `New order ${o.ref} (awaiting payment)`, `<p>New order from ${esc(o.customer.name)}, ${esc(o.customer.email)}.</p>${summary(o)}`)
  }

  orderPaid(o: any) {
    void this.send(o.customer.email, `Payment received for order ${o.ref}`, `<p>Thank you, ${esc(o.customer.name)}. Your payment of ${naira(o.total)} was received.</p>${summary(o)}<p>We will be in touch about delivery.</p>`)
    void this.send(this.adminEmail, `Order ${o.ref} PAID`, `<p>${esc(o.customer.name)} paid ${naira(o.total)}.</p>${summary(o)}`)
  }

  newMessage(m: any) {
    const what = m.type === 'comment' ? `a comment on "${esc(m.videoTitle)}"` : 'a contact form message'
    void this.send(this.adminEmail, `New ${m.type === 'comment' ? 'comment' : 'message'} from ${m.name}`, `<p>${esc(m.name)}${m.email ? ` (${esc(m.email)})` : ''} sent ${what}:</p><p>${esc(m.message).replace(/\n/g, '<br>')}</p>`)
  }
}
