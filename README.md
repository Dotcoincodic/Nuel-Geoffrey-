# Nuel Artist Website

Existing React + Vite storefront and studio admin dashboard, backed by a NestJS REST API and MongoDB. The site uses hash-based navigation (`#/...`), so Vercel does not need an SPA rewrite for its current routes.

## Architecture and data flow

- `frontend/` is the existing React storefront and admin interface.
- `backend/` is the NestJS API. Mongoose stores artworks, tracks, videos, posts, settings, messages, orders, and the admin account in MongoDB.
- Public content and checkout load from the API. The browser keeps only the cart, the visitor's reaction selections, theme choice, and the short-lived admin bearer token.
- The project has a single seeded admin account. It does not currently have public registration, user accounts, or a separate user dashboard.
- Admin writes are protected by backend JWT checks. A password change increments the account token version and signs out active sessions.

## Local development

Use Node.js 22. Install and run each application in its own directory:

```powershell
cd backend
npm ci
Copy-Item .env.example .env
npm run start:dev
```

Set `MONGODB_URI` and a `JWT_SECRET` of at least 32 characters in `backend/.env`. In a second terminal:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

The frontend example points to `http://localhost:4000/api`. The API defaults to port 4000 locally. To create the first admin and default site settings, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`, then run `npm run seed` from `backend/`. Running the seed command again updates that admin password and revokes existing tokens; it does not clear content or orders. `npm run seed:sample` adds sample content only when each relevant collection is empty; do not use it for production content.

## Environment variables

### Backend

| Variable                                                                       | Required                     | Purpose                                                                                                      |
| ------------------------------------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `MONGODB_URI`                                                                  | Yes                          | MongoDB connection string. Use Atlas in production.                                                          |
| `JWT_SECRET`                                                                   | Yes                          | Private signing secret, at least 32 characters.                                                              |
| `FRONTEND_URL`                                                                 | Yes                          | Vercel site origin. Comma-separate explicit origins if needed.                                               |
| `CORS_ORIGIN`                                                                  | No                           | Additional comma-separated browser origins.                                                                  |
| `PORT`                                                                         | Render provides it           | API listen port; defaults to 4000 locally.                                                                   |
| `PUBLIC_API_URL`                                                               | Render blueprint provides it | Public API origin used for local media URLs.                                                                 |
| `UPLOADS_DIR`                                                                  | No                           | Local upload folder or persistent volume mount path.                                                         |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`         | No                           | Enables permanent production media uploads to Cloudinary. Keep the secret only on the backend.               |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`                                                | For seeding                  | Initial or reset admin credentials. Do not put these in Vercel.                                              |
| `PAYSTACK_SECRET_KEY`                                                          | No                           | Enables Paystack checkout and signed webhook verification. Without it, checkout uses the bank-transfer flow. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | No                           | Sends order and contact emails. Without SMTP, notifications are logged by the API.                           |
| `ADMIN_NOTIFY_EMAIL`, `BANK_DETAILS`                                           | No                           | Order/message notifications and bank transfer instructions.                                                  |

`backend/.env.example` has placeholder values. Never copy a real `.env` file to Vercel or commit it. Backend `.env` is ignored by Git.

### Frontend

Set `VITE_API_URL` to the backend API base, including `/api`, for example:

```text
VITE_API_URL=https://your-api.onrender.com/api
```

This is a public URL, not a secret. The client also accepts a backend origin without `/api` and adds the prefix. Production builds without this variable or with a loopback URL show a configuration error instead of attempting to call localhost.

## MongoDB Atlas setup

1. Create an Atlas cluster and a database user with read/write access to the application database.
2. Add the Render service's outbound IP ranges to the Atlas network access list. Use the current values shown in the Render service settings; avoid a broad `0.0.0.0/0` rule unless you consciously accept that exposure.
3. Set `MONGODB_URI` on Render using the Atlas connection string. URL-encode special characters in the database password.
4. Run `npm run seed` once from an environment connected to that database with `ADMIN_EMAIL` and `ADMIN_PASSWORD` configured. The seed creates or updates the single admin and inserts defaults only when missing; it does not delete existing content or orders.

## Render backend deployment

The root `render.yaml` describes the existing API as a Web Service with `backend/` as its root directory. Connect the repository to Render and create/sync the Blueprint. Its build, start, and health-check settings are:

- Build: `npm ci --include=dev && npm run build && npm prune --omit=dev`
- Start: `npm run start:prod`
- Health: `/api/health`

Set the following in the Render service Environment page:

- `MONGODB_URI`: Atlas connection string.
- `JWT_SECRET`: a private random value of at least 32 characters. The Blueprint generates one.
- `FRONTEND_URL`: the exact deployed Vercel origin, without a path or trailing slash.
- `CORS_ORIGIN`: optional additional explicit origins, comma-separated.
- `PUBLIC_API_URL`: the Blueprint maps this to Render's public service URL.
- `PAYSTACK_SECRET_KEY`, SMTP values, and notification settings when those features are enabled.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` for durable production admin uploads.

Render supplies `PORT`; the API binds to `0.0.0.0`. CORS allows only the configured origins in production. Development also allows `http://localhost:5173` and `http://127.0.0.1:5173`. The API does not use cookie authentication, so cross-origin credentials are disabled.

The Render free service filesystem is ephemeral. Production uploads return a clear error unless Cloudinary is configured or `UPLOADS_DIR` is set to the absolute mount path of a persistent disk. Do not rely on the default `uploads/` directory to keep files across Render restarts. Render persistent disks may require a paid plan; Cloudinary is supported without keeping uploads on the service filesystem.

## Vercel frontend configuration

Keep the existing Vercel project and deployment. In **Project → Settings → Environment Variables**, set `VITE_API_URL` to `https://your-api.onrender.com/api` for Production (and Preview if previews should call the same API). Redeploy the frontend from Vercel to apply a changed Vite variable. No backend secret belongs in a `VITE_*` variable. Hash navigation means the current `/`, `#/admin`, `#/blog`, and `#/videos` routes work without extra rewrite rules.

The actual Vercel and Render URLs are environment-specific and are not embedded in this repository. Set the same Vercel origin in Render's `FRONTEND_URL`; add any preview origin explicitly via `CORS_ORIGIN`.

## API reference

Interactive OpenAPI/Swagger docs are available at `/api/docs`; health is checked at `/api/health`.

| Method                             | Path                                                     | Access                  | Purpose                                                         |
| ---------------------------------- | -------------------------------------------------------- | ----------------------- | --------------------------------------------------------------- |
| `GET`                              | `/api/public`                                            | Public                  | Load works, tracks, videos, posts, and settings.                |
| `GET`                              | `/api/settings`                                          | Public                  | Read site settings.                                             |
| `PUT`                              | `/api/settings`                                          | Admin bearer token      | Update site settings.                                           |
| `GET`                              | `/api/works`, `/api/tracks`, `/api/videos`, `/api/posts` | Public                  | List content.                                                   |
| `POST`, `PUT /:id`, `DELETE /:id`  | Same content paths                                       | Admin bearer token      | Manage content.                                                 |
| `POST`                             | `/api/auth/login`                                        | Public, rate-limited    | Admin login. Returns a 12-hour JWT.                             |
| `POST`                             | `/api/auth/change-password`                              | Admin bearer token      | Change admin password and revoke active tokens.                 |
| `POST`                             | `/api/orders`                                            | Public, rate-limited    | Create an order; prices and availability are read from MongoDB. |
| `GET`                              | `/api/orders/verify/:ref`                                | Public                  | Verify payment and return non-personal order status.            |
| `GET`                              | `/api/orders`                                            | Admin bearer token      | List orders.                                                    |
| `PATCH`                            | `/api/orders/:id`                                        | Admin bearer token      | Update order status.                                            |
| `POST`                             | `/api/payments/webhook`                                  | Paystack HMAC signature | Process payment success events.                                 |
| `POST`                             | `/api/messages`                                          | Public, rate-limited    | Submit a contact message or video comment.                      |
| `GET`, `PATCH /:id`, `DELETE /:id` | `/api/messages`                                          | Admin bearer token      | Manage the inbox.                                               |
| `POST`                             | `/api/videos/:id/react`                                  | Public, rate-limited    | Update a like/love count.                                       |
| `POST`                             | `/api/uploads`                                           | Admin bearer token      | Upload image, video, or audio media.                            |

Admin endpoints accept `Authorization: Bearer <token>`. The Vercel client sends this token from session storage and never receives MongoDB credentials or backend secrets.

Order status transitions are constrained (`pending → paid/cancelled → shipped/delivered`). Cancelling a paid order does not issue a Paystack refund and keeps the original marked sold; process the refund through Paystack separately. A late payment for an already-cancelled order is logged for manual review and does not reopen inventory.

## Verification

From `backend/`, run `npm run build` and `npm run test:smoke`. From `frontend/`, run `npm run build`. The smoke suite uses in-memory model fakes and verifies key auth, authorization, checkout pricing/stock, Paystack signature, and message validation paths. A live MongoDB connection and actual Paystack, SMTP, Cloudinary, Render, and Vercel integration still require their external service configuration.

nuel_user_1
password: NuelGeoffrey1
