# SmartTodo

> Task Management App — React + Express + PostgreSQL + Dokploy

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Express.js
- **Database:** PostgreSQL 16
- **Deploy:** Dokploy + Cloudflare Tunnel

## Run Locally

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install
cd ..

# Run dev (both client + server)
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3000
- Health check: http://localhost:3000/api/health

## Deploy

```bash
# Build & run with Docker
docker-compose up -d
```

## Project Structure

```
SmartTodo/
├── client/          # React frontend
├── server/          # Express backend
├── Dockerfile       # Multi-stage build
├── docker-compose.yml
└── package.json     # Root scripts
```
