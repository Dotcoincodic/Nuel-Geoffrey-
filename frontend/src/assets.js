// Images are supplied by the admin through uploads or external image links.
const img = () => ''

export const artist = {
  name: 'Artist Name',
  tagline: 'Paintings that hold on to light.',
  location: 'Lagos, Nigeria',
  email: 'hello@artistname.com',
  bio: 'I paint large, textured canvases and make music in the same studio. Every piece is made to order or released as a one-off original. Replace this with your own story, exhibitions and press.',
  socials: [
    { label: 'Instagram', href: '#' },
    { label: 'X', href: '#' },
    { label: 'YouTube', href: '#' },
  ],
}

export const heroImage = img('hero-art', 1400, 1800)
export const aboutImage = img('studio-portrait', 900, 1100)

// status: 'available' | 'reserved' | 'sold'
export const forSale = [
  { id: 's1', title: 'Golden Hour Lagos', size: '60 x 80 cm', medium: 'Oil on canvas', price: 450000, status: 'available', image: img('sale1') },
  { id: 's2', title: 'Quiet Market', size: '40 x 50 cm', medium: 'Acrylic', price: 280000, status: 'reserved', image: img('sale2', 800, 800) },
  { id: 's3', title: 'Ink and Ochre', size: '50 x 70 cm', medium: 'Mixed media', price: 360000, status: 'available', image: img('sale3', 800, 1100) },
  { id: 's4', title: 'Harmattan', size: '70 x 90 cm', medium: 'Oil on canvas', price: 620000, status: 'available', image: img('sale4', 800, 900) },
  { id: 's5', title: 'Blue Hour', size: '30 x 40 cm', medium: 'Acrylic', price: 190000, status: 'available', image: img('sale5', 800, 1000) },
  { id: 's6', title: 'Afterglow', size: '60 x 60 cm', medium: 'Oil on canvas', price: 410000, status: 'available', image: img('sale6', 800, 800) },
]

export const archive = [
  { id: 'a1', title: 'Crossing', year: 2024, medium: 'Oil on canvas', image: img('arch1', 800, 1000) },
  { id: 'a2', title: 'Salt Wind', year: 2024, medium: 'Acrylic', image: img('arch2', 800, 800) },
  { id: 'a3', title: 'Fifth Floor', year: 2023, medium: 'Mixed media', image: img('arch3', 800, 1100) },
  { id: 'a4', title: 'Kin', year: 2023, medium: 'Oil on canvas', image: img('arch4', 800, 900) },
  { id: 'a5', title: 'Rain Season', year: 2022, medium: 'Watercolour', image: img('arch5', 800, 1000) },
  { id: 'a6', title: 'Studio Floor', year: 2022, medium: 'Acrylic', image: img('arch6', 800, 800) },
]

// src can be a hosted mp3 or a file in /public (e.g. '/audio/track1.mp3'). Leave '' to preview the UI only.
export const tracks = [
  { id: 't1', title: 'Slow Burn', meta: 'Single, 2026', length: '3:42', src: '', cover: img('cover1', 400, 400) },
  { id: 't2', title: 'Ochre Skies', meta: 'Single, 2025', length: '4:05', src: '', cover: img('cover2', 400, 400) },
  { id: 't3', title: 'Night Studio', meta: 'EP, 2025', length: '2:58', src: '', cover: img('cover3', 400, 400) },
]

export const platforms = [
  { label: 'Spotify', href: '#' },
  { label: 'Apple Music', href: '#' },
  { label: 'YouTube', href: '#' },
]

export const steps = [
  { title: 'Choose a type', text: 'Original painting, print, or a fully custom commission.' },
  { title: 'Share your brief', text: 'Size, colours, where it will hang, and any reference images.' },
  { title: 'Pay a deposit', text: 'A 50% deposit books your slot. You get progress photos along the way.' },
  { title: 'Receive your piece', text: 'Packed and shipped with tracking, or collected in person.' },
]

// Hero slider: 9 images, one every 6 seconds. Replace any URL, or edit them in the admin (Site tab).
export const heroImages = []

// Sample live videos. src can be an mp4 URL, a YouTube link or a Vimeo link.
export const videos = [
  {
    id: 'v1', title: 'Golden Hour Lagos, start to finish', date: '2026-10-02',
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', poster: img('vid1', 1000, 700),
    description: 'A full session of the painting from the first wash to the final highlights, sped up and with studio sound.',
    story: 'I started this piece on a rainy afternoon with no plan except the colour of the sky over Lekki at 6pm. Halfway through I scraped the whole canvas back and began again. That second attempt is the one you see here.',
    likes: 12, loves: 7,
  },
  {
    id: 'v2', title: 'Ink and Ochre, the last layers', date: '2026-09-14',
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', poster: img('vid2', 1000, 700),
    description: 'Adding the final glazes and signing the piece.',
    story: 'This one was a commission that turned into something personal. The ochre came from a pigment I ground myself.',
    likes: 5, loves: 3,
  },
]

export const posts = [
  {
    id: 'p1', title: 'New originals drop this Friday', caption: 'Six new paintings from the Harmattan series go on sale.',
    cover: img('post1', 1200, 700), date: '2026-10-20', updatedAt: null,
    body: 'Six new originals from the Harmattan series go on sale this Friday at 6pm.\n\nEach piece is one of one, and prints will be available for selected works. Reserve early, because the last drop sold out in a day.\n\nShipping is available across Nigeria. Pick up in Lagos is free.',
  },
  {
    id: 'p2', title: 'Open studio day', caption: 'Come and see the work in person.',
    cover: img('post2', 1200, 700), date: '2026-09-30', updatedAt: null,
    body: 'The studio is open to visitors on the last Saturday of the month.\n\nExpect works in progress, music, and a chance to talk about commissions.',
  },
]
