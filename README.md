# SmartTodo

SmartTodo adalah aplikasi task management full-stack untuk mencatat agenda harian dengan autentikasi user, refresh-token cookie, dan penyimpanan task per pengguna.

> Live app: https://smarttodo.sudoman.my.id

## Status Stack Terbaru

SmartTodo sekarang berjalan sebagai dua service Dokploy terpisah:

- **Frontend service:** React SPA dibuild dengan Vite, lalu diserve oleh Nginx container.
- **Backend service:** Express API container terpisah, fokus untuk auth, task API, migrasi database, dan koneksi PostgreSQL.
- **Database:** PostgreSQL via `DATABASE_URL`.
- **Ingress:** Dokploy + Traefik, diekspos lewat Cloudflare Tunnel ke domain `smarttodo.sudoman.my.id`.

Pembagian ini menggantikan model lama yang terkesan satu container full-stack. `Dockerfile` dipakai untuk frontend/Nginx, sedangkan `Dockerfile.api` dipakai untuk backend API.

## Tech Stack

### Frontend

- React 19
- Vite 8
- React Router 7
- Axios
- Tailwind CSS 4
- Nginx Alpine untuk static serving di production

### Backend

- Node.js 20 Alpine
- Express 5
- PostgreSQL driver `pg`
- JWT access token + refresh token cookie
- bcryptjs untuk password hashing
- Helmet, CORS, cookie-parser
- SQL migrations saat server start

### Deployment

- Dokploy untuk build/deploy services
- Traefik sebagai reverse proxy bawaan Dokploy
- Cloudflare Tunnel untuk public hostname
- PostgreSQL sebagai backing database

## Fitur Utama

- Register dan login user
- Access token JWT berdurasi pendek
- Refresh token di HTTP-only cookie
- Auto-refresh token dari frontend saat API mengembalikan `401`
- CRUD task per user
- Filter task by date atau month
- Field task: title, description, date, time, location, priority, done
- Migrasi database otomatis untuk tabel `users` dan `tasks`
- SPA routing via React Router + fallback Nginx

## Project Structure

```text
SmartTodo/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Layout, auth form, protected route
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # Login, register, dashboard
│   │   └── utils/api.js     # Axios instance + token refresh interceptor
│   └── package.json
├── server/                  # Express backend API
│   ├── db/
│   │   ├── index.js         # PostgreSQL pool
│   │   ├── migrate.js       # SQL migration runner
│   │   └── migrations/      # users + tasks schema
│   ├── middleware/auth.js   # JWT auth middleware
│   ├── routes/              # auth + tasks API routes
│   └── index.js             # app bootstrap
├── Dockerfile               # Frontend build + Nginx static server
├── Dockerfile.api           # Backend API image
├── docker-compose.yml       # Local/simple frontend container example
├── nginx.conf               # SPA fallback + asset caching
├── .env.example             # Backend environment template
└── package.json             # Root dev scripts
```

## Environment Variables

Backend membutuhkan environment berikut:

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=change_me
JWT_REFRESH_SECRET=change_me_too
DATABASE_URL=postgresql://user:password@host:5432/smarttodo
CORS_ORIGIN=https://smarttodo.sudoman.my.id
```

Catatan:

- `JWT_SECRET` dipakai untuk access token.
- `JWT_REFRESH_SECRET` dipakai untuk refresh token cookie.
- `DATABASE_URL` wajib valid karena backend melakukan test koneksi dan migrasi saat startup.
- `CORS_ORIGIN` bisa dipakai untuk origin tambahan selain origin default yang sudah ada di kode.

## Run Locally

Install dependencies frontend dan backend:

```bash
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

Siapkan environment backend:

```bash
cp .env.example server/.env
# lalu edit server/.env sesuai database lokal
```

Jalankan frontend dan backend bersamaan:

```bash
npm run dev
```

Default local URLs:

- Frontend dev server: http://localhost:5173
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/api/health

## Build Frontend

```bash
npm run build
```

Output build berada di:

```text
client/dist/
```

## API Overview

### Health

- `GET /api/health` — cek status backend.

### Auth

- `POST /api/auth/register` — buat user baru.
- `POST /api/auth/login` — login dan menerima access token.
- `POST /api/auth/refresh` — refresh access token dari cookie.
- `POST /api/auth/logout` — hapus refresh token cookie.

### Tasks

Semua route task membutuhkan header:

```http
Authorization: Bearer <accessToken>
```

Routes:

- `GET /api/tasks` — list semua task milik user.
- `GET /api/tasks?date=YYYY-MM-DD` — filter task per tanggal.
- `GET /api/tasks?month=YYYY-MM` — filter task per bulan.
- `POST /api/tasks` — buat task baru.
- `PATCH /api/tasks/:id` — update task milik user.
- `DELETE /api/tasks/:id` — hapus task milik user.

## Docker Notes

### Frontend image

`Dockerfile` melakukan:

1. Build React app dari `client/`.
2. Copy hasil `client/dist` ke Nginx.
3. Serve SPA di port `3000`.

### Backend image

`Dockerfile.api` melakukan:

1. Install production dependencies dari `server/package*.json`.
2. Copy source backend.
3. Jalankan `node index.js` di port `3000`.

Backend akan connect ke PostgreSQL dan menjalankan SQL migrations sebelum mulai listen.

## Deployment Notes

Deployment production dilakukan dari GitHub ke Dokploy, bukan edit manual folder deployment server.

Service production saat ini:

- Frontend: `smarttodo-frontend-ockgko`
- Backend API: `smarttodo-api-sjqjvb`
- Public domain: `smarttodo.sudoman.my.id`

Checklist saat deploy perubahan:

1. Commit dan push perubahan ke repository GitHub.
2. Redeploy service terkait di Dokploy.
3. Jika frontend berubah, redeploy frontend service.
4. Jika backend/API/env berubah, redeploy backend service.
5. Verify health endpoint:

```bash
curl https://smarttodo.sudoman.my.id/api/health
```

## Important Implementation Notes

- Frontend memakai `baseURL: '/api'`, jadi request API mengikuti domain yang sama.
- Access token disimpan di `sessionStorage`.
- Refresh token disimpan sebagai HTTP-only cookie.
- Task ownership divalidasi di backend lewat `user_id` dari JWT.
- Migrations bersifat `CREATE TABLE IF NOT EXISTS`, jadi aman dijalankan ulang untuk bootstrap schema.
