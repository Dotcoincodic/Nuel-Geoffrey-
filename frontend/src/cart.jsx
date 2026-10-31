import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, money } from './store'
import { api } from './api'

const field = 'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20'
const primary = 'inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-ink transition hover:bg-primary-soft disabled:opacity-50'

export function CartDrawer({ open, onClose }) {
  const { cartLines, subtotal, settings, removeFromCart, setQty, placeOrder } = useStore()
  const [step, setStep] = useState('cart')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(null)
  const shipping = cartLines.length ? Number(settings.shippingFee || 0) : 0
  const total = subtotal + shipping
  const blocked = cartLines.some((l) => l.unavailable)

  const close = () => {
    onClose()
    if (step === 'done') setTimeout(() => { setStep('cart'); setDone(null) }, 300)
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    const customer = Object.fromEntries(new FormData(e.target))
    try {
      const { order, authorizationUrl } = await placeOrder({ customer })
      // With Paystack on, the server gives us a payment page to send the buyer to.
      if (authorizationUrl) { window.location.href = authorizationUrl; return }
      setDone(order)
      setStep('done')
    } catch (x) {
      setErr(x.message)
    }
    setBusy(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.aside
            role="dialog" aria-modal="true" aria-label="Your cart" onClick={(e) => e.stopPropagation()}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            className="ml-auto flex h-full w-full max-w-md flex-col bg-paper p-6 dark:bg-night-raised"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{step === 'checkout' ? 'Checkout' : step === 'done' ? 'Order placed' : 'Your cart'}</h2>
              <button onClick={close} aria-label="Close cart" className="px-2 text-2xl leading-none">&times;</button>
            </div>

            {step === 'done' && done && (
              <div className="mt-8 space-y-3 text-sm">
                <p className="rounded-lg bg-primary/15 p-4">Thank you. Your order reference is <b>{done.ref}</b>.</p>
                <p className="text-neutral-600 dark:text-neutral-300">
                  {done.paid ? `Payment of ${money(done.total)} received. A receipt is on its way to ${done.customer.email}.` : `We'll email ${done.customer.email} within a day with bank transfer details for ${money(done.total)}.`}
                </p>
                <button onClick={close} className={primary}>Keep browsing</button>
              </div>
            )}

            {step === 'cart' && (
              <>
                <ul className="mt-6 flex-1 space-y-4 overflow-auto">
                  {cartLines.length === 0 && <li className="text-sm text-neutral-500">Your cart is empty. Pick a piece from the gallery.</li>}
                  {cartLines.map((l) => (
                    <li key={l.key} className="flex gap-3">
                      <img src={l.work.image} alt="" className="h-20 w-16 rounded-lg object-cover" />
                      <div className="flex-1 text-sm">
                        <p className="font-medium">{l.work.title}</p>
                        <p className="text-neutral-500">{l.option}, {money(l.price)}</p>
                        {l.unavailable && <p className="text-red-600">No longer available. Remove it to continue.</p>}
                        {l.option === 'Print' && (
                          <div className="mt-1 flex items-center gap-2">
                            <button aria-label="Fewer" onClick={() => setQty(l.key, l.qty - 1)} className="h-6 w-6 rounded-full border border-black/15 dark:border-white/20">-</button>
                            <span>{l.qty}</span>
                            <button aria-label="More" onClick={() => setQty(l.key, l.qty + 1)} className="h-6 w-6 rounded-full border border-black/15 dark:border-white/20">+</button>
                          </div>
                        )}
                      </div>
                      <button onClick={() => removeFromCart(l.key)} className="self-start text-xs text-neutral-500 hover:text-primary">Remove</button>
                    </li>
                  ))}
                </ul>
                {cartLines.length > 0 && (
                  <div className="border-t border-black/10 pt-4 text-sm dark:border-white/10">
                    <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                    <div className="flex justify-between text-neutral-500"><span>Shipping</span><span>{money(shipping)}</span></div>
                    <div className="mt-2 flex justify-between text-base font-semibold"><span>Total</span><span>{money(total)}</span></div>
                    <button disabled={blocked} onClick={() => setStep('checkout')} className={`${primary} mt-4`}>Continue to checkout</button>
                  </div>
                )}
              </>
            )}

            {step === 'checkout' && (
              <form onSubmit={submit} className="mt-6 flex flex-1 flex-col gap-3 overflow-auto">
                <input name="name" required placeholder="Full name" className={field} />
                <input name="email" type="email" required placeholder="name@email.com" className={field} />
                <input name="phone" type="tel" required placeholder="0801 234 5678" className={field} />
                <textarea name="address" required rows="3" placeholder="Delivery address, city, state" className={field} />
                <textarea name="note" rows="2" placeholder="Framing or delivery notes (optional)" className={field} />
                {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
                <div className="mt-auto space-y-2 pt-2">
                  <button disabled={busy} className={primary}>{busy ? 'Working…' : `Continue, ${money(total)}`}</button>
                  <button type="button" onClick={() => setStep('cart')} className="w-full text-sm text-neutral-500 hover:text-primary">Back to cart</button>
                  <p className="text-xs text-neutral-500">You'll be taken to Paystack to pay. If online payment is off, bank transfer details are emailed to you.</p>
                </div>
              </form>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Shown when Paystack sends the buyer back to the site with ?order=REF. The server checks the payment with Paystack.
export function PaymentReturn() {
  const [state, setState] = useState(null)
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('order')
    if (!ref) return
    window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    setState({ loading: true, ref })
    api('/orders/verify/' + encodeURIComponent(ref)).then((r) => setState(r)).catch((e) => setState({ error: e.message, ref }))
  }, [])
  if (!state) return null
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-5">
      <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-paper p-6 text-sm dark:bg-night-raised">
        {state.loading ? <p>Confirming your payment…</p> : state.error ? <p>{state.error}</p> : state.paid ? (
          <p>Payment received. Thank you! Your order reference is <b>{state.ref}</b>. A receipt is on its way to your email.</p>
        ) : (
          <p>We have not received the payment for <b>{state.ref}</b> yet. If you were charged, it can take a minute to confirm. Check your email, or contact us with this reference.</p>
        )}
        {!state.loading && <button onClick={() => setState(null)} className={`${primary} mt-4`}>Close</button>}
      </div>
    </div>
  )
}
