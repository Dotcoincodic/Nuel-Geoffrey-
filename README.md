# Artist website

- `frontend/` — React site and admin dashboard (Vite)
- `backend/` — NestJS API connected to MongoDB
- `GUIDE.md` — complete setup, Atlas/local MongoDB instructions, admin setup, payments, email, uploads, and deployment

## Quick start

1. Set `MONGODB_URI` in `backend/.env`. Copy `backend/.env.example` if you do not have a backend `.env` yet. Use the local MongoDB address for a local database, or paste your MongoDB Atlas connection string after `MONGODB_URI=`. For Atlas, replace any password placeholder with your database user's password and allow your current IP in Atlas Network Access.
2. In a terminal, run `cd backend`, `npm install`, `npm run seed`, then `npm run start:dev`. The seed command creates the admin account and default site settings; set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` first.
3. Set `VITE_API_URL=http://localhost:4000` in `frontend/.env`. In a second terminal, run `cd frontend`, `npm install`, then `npm run dev` and open the address Vite prints.

The frontend talks to the backend at `http://localhost:4000/api`; the backend talks to MongoDB. See `GUIDE.md` for details and troubleshooting.
