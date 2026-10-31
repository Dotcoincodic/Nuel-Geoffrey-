# Local setup guide

You will run two things side by side: the **backend** (port 4000) and the **frontend** (port 5173).
Plan on 20 to 30 minutes the first time, including creating a Paystack test account.

## Contents
1. Prerequisites
2. Project layout
3. Set up the backend
4. Create your admin account
5. Connect the frontend
6. Test Paystack payments
7. Emails
8. Uploads (images, videos, audio)
9. Troubleshooting
10. Going live
11. What is not built yet

---

## 1. Prerequisites

**Node.js 18 or newer.** Check with `node -v`. Install the LTS version from nodejs.org if needed.

**MongoDB.** Pick ONE of these.

**Option A: MongoDB Atlas (free, no install). Recommended.**
1. Create an account at mongodb.com/atlas and create a free **M0** cluster.
2. **Database Access** > Add Database User. Choose a username and password. If the password has special characters (`@ : / ? #`), URL-encode them or choose a simpler password.
3. **Network Access** > Add IP Address > "Add current IP address". (`0.0.0.0/0` allows everyone. Use it only for quick testing.)
4. **Database** > Connect > Drivers. Copy the connection string, replace `<password>`, and add the database name before the `?`:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/artist-site?retryWrites=true&w=majority`

**Option B: MongoDB on your computer.**
- With Docker: `docker run -d --name mongo -p 27017:27017 -v mongo-data:/data/db mongo:7`
- Or install MongoDB Community Server from mongodb.com and start the service.
- Connection string: `mongodb://127.0.0.1:27017/artist-site`

Also useful: **Git**, a code editor, and later **ngrok** (section 6).

## 2. Project layout

    artist-project/
      frontend/   React site + admin   -> http://localhost:5173
      backend/    NestJS API           -> http://localhost:4000/api
      GUIDE.md

The browser does not connect to MongoDB directly. The React frontend sends HTTP requests to the NestJS backend; the backend reads and writes MongoDB using `MONGODB_URI` in `backend/.env`.

## 3. Set up the backend

    cd backend
    npm install
    cp .env.example .env        # Windows: copy .env.example .env

Open `backend/.env` and fill it in:

| Variable | What to put |
|---|---|
| `PORT` | `4000` |
| `PUBLIC_API_URL` | `http://localhost:4000` |
| `FRONTEND_URL` | `http://localhost:5173` |
| `MONGODB_URI` | your connection string from section 1 |
| `JWT_SECRET` | a long random string. Generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_EMAIL` | the email you will log in with |
| `ADMIN_PASSWORD` | at least 10 characters |
| `ADMIN_NOTIFY_EMAIL` | where order and message alerts go (optional, defaults to `ADMIN_EMAIL`) |
| `PAYSTACK_SECRET_KEY` | leave empty for now (section 6) |
| `BANK_DETAILS` | shown in emails when an order is paid by transfer |
| `SMTP_*`, `MAIL_FROM` | leave `SMTP_HOST` empty for now. Emails print in the terminal instead (section 7) |

The example file starts with a local MongoDB address:

    MONGODB_URI=mongodb://127.0.0.1:27017/artist-site

That works if MongoDB is installed and running on your computer. For Atlas, replace the entire value after `MONGODB_URI=` with the connection string from Atlas, replace its password placeholder with your database user's password, and make sure the database name (for example, `artist-site`) appears before the `?`. Keep the `MONGODB_URI=` part; the backend needs that exact variable name to find the address. In Atlas, add your current IP under **Network Access**. Do not share the database password in chat or commit it to Git.

Start it:

    npm run start:dev

You should see `API running on http://localhost:4000/api`. Open http://localhost:4000/api/public in a browser. A JSON object with `works`, `settings` and so on means it is working.

If it stops with "Missing in .env", the message names the missing variables.

## 4. Create your admin account

In a second terminal, from `backend/`:

    npm run seed

This creates your admin login from `ADMIN_EMAIL` and `ADMIN_PASSWORD`, plus default site settings. Running it again is safe. It also **resets the admin password** to whatever is in `.env`, which is how you change it.

Want sample artworks to look at? Run `npm run seed:sample` instead. It only adds samples to empty collections.

## 5. Connect the frontend

    cd frontend
    npm install
    cp .env.example .env

`frontend/.env`:

    VITE_API_URL=http://localhost:4000

Then:

    npm run dev

Open http://localhost:5173. The site now loads everything from the API. The localStorage data layer from the earlier version is gone. The only things still kept in the browser are the visitor's cart, their theme choice, and which videos they have liked.

Admin: http://localhost:5173/#/admin. Sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. On a small screen, tap the menu icon to open Overview, Artworks, Orders, Videos, Blog, Inbox, Music, Site and Password. Use the **Password** tab to change your password; enter your current password and choose a new password with at least 10 characters. In the **Site** tab, use the plus button under **Hero slider images** to add a slide, then paste a direct image link from any host or upload a photo. Use the trash button to remove a slide and **Save settings** to apply changes. You can add up to 9 slides. The tab also contains the artist name, bio, social links and shipping fee.

**Restart the frontend after changing `.env`.** Vite only reads it at startup.

## 6. Test Paystack payments

Without a Paystack key, checkout still works: it creates an unpaid order, reserves the artwork, and emails bank transfer details. To test online payment:

1. Create an account at paystack.com and stay in **Test mode** (toggle at the top of the dashboard).
2. **Settings > API Keys & Webhooks**. Copy the **Secret key** (`sk_test_...`) into `backend/.env` as `PAYSTACK_SECRET_KEY`. Restart the backend.
3. Add an artwork in the admin, add it to the cart, and check out. You are redirected to Paystack's page.
4. Pay with a test card. Paystack lists current test cards in its docs. The commonly used one is `4084 0840 8408 4081`, any future expiry, CVV `408`. If asked for a PIN or OTP, test mode accepts `0000` and `123456`.
5. Paystack sends you back to the site and the order is confirmed. Check the admin **Orders** tab: it should say paid, and the artwork should be marked sold.

**What happens after you pay.** Two things confirm a payment, and either one is enough:
- **The return page.** When Paystack sends the buyer back to `FRONTEND_URL/?order=REF`, the backend asks Paystack directly whether that payment succeeded.
- **The webhook.** Paystack also calls your backend on its own, even if the buyer closes the tab. This is the reliable one.

So you can test the whole flow locally **without ngrok**, because the return page works with `localhost`. You only need a tunnel to test the webhook.

**Testing the webhook locally.** Paystack cannot reach `localhost`, so use a tunnel:
1. Install ngrok (ngrok.com) and run `ngrok http 4000`.
2. Copy the `https://....ngrok-free.app` address it prints.
3. In Paystack, **Settings > API Keys & Webhooks**, set the **Test Webhook URL** to `https://YOUR-ID.ngrok-free.app/api/payments/webhook` and save.
4. Make a test payment. Watch the backend terminal and the Paystack dashboard's webhook log. Paystack shows each delivery and whether your server answered 200.

The free ngrok address changes every time you restart it, so update the webhook URL when it does.

**How the backend protects you.** Prices and shipping are always recalculated on the server from your database. The browser only says which artworks and options it wants. A payment is accepted only if Paystack confirms it and the amount matches the order total in Naira. The webhook is rejected unless its signature matches your secret key.

## 7. Emails

The backend sends: an order confirmation with bank details (unpaid orders), a receipt (paid orders), an alert to you for each new order, and an alert for each contact message or video comment.

With `SMTP_HOST` empty, emails are **printed in the backend terminal** instead of sent. That is fine for development.

**Option A: Gmail (quickest for testing)**
1. Turn on 2-Step Verification for the Google account.
2. Go to myaccount.google.com/apppasswords and create an app password. You get 16 characters. Remove any spaces.
3. In `backend/.env`:

        SMTP_HOST=smtp.gmail.com
        SMTP_PORT=587
        SMTP_SECURE=false
        SMTP_USER=yourname@gmail.com
        SMTP_PASS=the16characterpassword
        MAIL_FROM="Artist Name <yourname@gmail.com>"

Gmail is fine for low volume (it has daily sending limits) and mail comes from your Gmail address.

**Option B: Resend (better for a live site)**
1. Create an account at resend.com, add and verify your domain, and create an API key.
2. In `backend/.env`:

        SMTP_HOST=smtp.resend.com
        SMTP_PORT=465
        SMTP_SECURE=true
        SMTP_USER=resend
        SMTP_PASS=re_your_api_key
        MAIL_FROM="Artist Name <orders@yourdomain.com>"

`MAIL_FROM` must use your verified domain. Until the domain is verified, Resend only lets you send to your own address.

Restart the backend after editing `.env`. If an email fails to send, the order or message still goes through, and the error is logged in the terminal.

## 8. Uploads

In the admin, every image field has an upload button, and the Videos and Music forms can upload video (mp4, webm) and audio (mp3) files.

- Files are saved in `backend/uploads/` and served at `http://localhost:4000/uploads/...`.
- Accepted: jpg, png, webp, gif, mp4, webm, mp3. Maximum 200 MB per file.
- The `uploads` folder is not in Git. Back it up if the files matter.
- **Hosting warning:** on most free hosts the disk is wiped on each deploy. Before going live, either attach a persistent disk or move uploads to Cloudinary or S3 (replace the code in `backend/src/uploads.ts`).

## 9. Troubleshooting

| Problem | Cause and fix |
|---|---|
| Site shows "The site could not load. Cannot reach the server." | Backend not running, or `VITE_API_URL` is wrong. Open `http://localhost:4000/api/public` in the browser. Restart `npm run dev` after editing `.env`. |
| Browser console: "blocked by CORS policy" | `FRONTEND_URL` in `backend/.env` must exactly match the address in your browser bar, with no trailing slash. If you open the site at `http://127.0.0.1:5173`, add that too: `FRONTEND_URL=http://localhost:5173,http://127.0.0.1:5173`. Restart the backend. |
| Backend: `MongooseServerSelectionError` or `ECONNREFUSED` | MongoDB is not running (local), or your IP is not allowed (Atlas > Network Access), or the URI is wrong. Check the username and password, and URL-encode special characters in the password. |
| Backend says `Missing in .env: MONGODB_URI` | In `backend/.env`, the full database address must be on a line beginning `MONGODB_URI=`. Copy the format from `backend/.env.example`. |
| `bad auth : Authentication failed` | Wrong database user or password in `MONGODB_URI`. |
| "Missing in .env: ..." on start | Fill in the variables it names. `JWT_SECRET` must be 32+ characters. |
| `npm run seed` says to set variables | `ADMIN_EMAIL`, `ADMIN_PASSWORD` (10+ chars) and `MONGODB_URI` must be in `backend/.env`. |
| Admin says "Wrong email or password" | Run `npm run seed` again with the values you want. Check you are not seeding a different database than the one the server uses. |
| Admin signs you out after a while | Logins last 12 hours. Sign in again. Changing `JWT_SECRET` also signs everyone out. |
| `401` or "Unauthorized" when saving in admin | The session expired. Sign in again. |
| Port 4000 already in use | Change `PORT` in `backend/.env` and `VITE_API_URL` in `frontend/.env` to match. |
| Uploaded images do not show | `PUBLIC_API_URL` must be the address the browser can reach (`http://localhost:4000`). Images saved earlier keep their old address if you change it. |
| Checkout says an item "is no longer available" | Someone reserved it, or an earlier unpaid order is holding it. In admin **Orders**, set that order to **cancelled** to release the artwork. |
| After paying, order stays "pending" | Paystack could not confirm. Check `PAYSTACK_SECRET_KEY` is the test key matching test mode, and that the amount matches. The backend terminal logs "Amount mismatch" or Paystack errors. |
| Webhook: `401` in the Paystack dashboard log | Signature check failed. The secret key in `.env` differs from the one in that Paystack mode (test vs live), or a proxy changed the request body. Use the key from the same mode as the webhook URL you set. |
| Webhook never arrives locally | `localhost` is unreachable from the internet. Run ngrok (section 6) and use the ngrok URL ending in `/api/payments/webhook`. |
| Paystack redirect lands on the wrong address | `FRONTEND_URL` (first entry) is used for the return address. Fix it and restart the backend. |
| No emails arrive | If `SMTP_HOST` is empty they only print in the terminal. Otherwise check the terminal for `Could not send`, check spam, use a Gmail app password (not your normal password), and for Resend use a verified domain in `MAIL_FROM`. |
| `Too Many Requests` (429) | Rate limits: 5 logins per minute, 10 messages and 10 orders per minute per visitor. Wait a minute. |
| Video upload fails | File over 200 MB, or not mp4/webm. For bigger videos, upload to YouTube or Vimeo and paste the link. |

To check the backend's core logic at any time: `cd backend && npm run test:smoke`. It runs the order, stock, admin and webhook checks against an in-memory database, so it needs no MongoDB.

## 10. Going live

**Before you deploy**
- [ ] Use a MongoDB Atlas cluster (not a local database).
- [ ] New, long `JWT_SECRET`. A strong `ADMIN_PASSWORD`. Run `npm run seed` against the production database (set `MONGODB_URI` to the production string for that one command).
- [ ] Decide where uploads live (persistent disk, Cloudinary or S3).
- [ ] Have your privacy policy and terms reviewed.

**Backend on Render or Railway**
1. Push the project to GitHub.
2. Create a Web Service from the repo. Set the **root directory** to `backend`.
3. Build command: `npm install && npm run build`. Start command: `npm run start`.
4. Add every variable from `backend/.env` in the host's dashboard. Set:
   - `FRONTEND_URL` = your Vercel address (add your custom domain too, comma separated)
   - `PUBLIC_API_URL` = the backend's public address
5. Add a persistent disk mounted at `uploads` if you are keeping local uploads.
6. Check `https://YOUR-API/api/public` loads.

**Frontend on Vercel**
1. Import the repo. Set the **root directory** to `frontend`. Framework: Vite.
2. Add the environment variable `VITE_API_URL` = your backend's public address (no trailing slash).
3. Deploy. The site uses hash routes (`/#/blog`), so no rewrite rules are needed.

**Paystack live**
1. Complete Paystack's business verification to go live.
2. Put the **live** secret key (`sk_live_...`) in the backend's environment.
3. Set the **Live Webhook URL** in Paystack to `https://YOUR-API/api/payments/webhook`.
4. Make one real small payment and confirm the order, the email and the webhook log.

**After launch:** turn on Atlas backups, keep your secrets out of Git (`.env` is already ignored), and set up a free uptime monitor, because free hosts may sleep when idle.

## 11. What is not built yet

Worth knowing so nothing surprises you:
- **Unpaid orders never expire.** An order that was started but not paid keeps the artwork reserved until you cancel it in admin.
- **One admin account.** While signed in, change the password from the **Password** tab. If you get locked out, edit `ADMIN_PASSWORD` in `backend/.env` and run `npm run seed` from `backend/` to reset it.
- **Likes and loves** are limited per browser, not per person. Someone determined could inflate them.
- **Uploads trust the file type the browser reports.** That is acceptable because only the signed-in admin can upload.
- **Sold-out originals** can still have prints sold, by design. Set the print price to 0 to stop that.
- **Refunds** are handled in the Paystack dashboard. Then set the order to cancelled in admin.
