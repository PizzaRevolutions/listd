# Listd - Unified Cross-Platform Media Tracker

Unified cross-platform application (Web, Mobile, Desktop) for tracking movies, TV shows, anime, manga, video games, and music.

## 🚀 Architecture Overview

- **Monorepo Structure**:
  - `/backend`: Node.js, Fastify, TypeScript, Prisma ORM, PostgreSQL 16, Redis, Socket.io.
  - `/frontend`: Vue 3 (Composition API), Vite, Tailwind CSS, Pinia, Capacitor (Android/iOS), PWA.
- **Infrastructure**:
  - Docker Compose for orchestration.
  - Deployed on **Proxmox VE (LXC)**.
  - Public access via **Cloudflare Tunnel (`cloudflared`)** with automatic SSL and zero exposed router ports.

---

## 🛠️ Quickstart (Development)

### Prerequisites
- Node.js >= 20
- Docker & Docker Compose
- Git

### 1. Clone & Configure
```bash
git clone <repository_url>
cd Listd
cp .env.example .env
```

Fill in the external API keys in `.env` (free tier):
- **TMDB**: [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
- **RAWG**: [https://rawg.io/apidocs](https://rawg.io/apidocs)
- **Spotify**: [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)

### 2. Start PostgreSQL & Redis with Docker
```bash
docker compose up -d postgres redis
```

### 3. Install Dependencies
```bash
# In the backend directory
cd backend
npm install
npx prisma migrate dev --name init

# In the frontend directory
cd ../frontend
npm install
```

### 4. Run the Dev Servers
```bash
# Start backend (http://localhost:3000)
cd backend && npm run dev

# Start frontend (http://localhost:5173)
cd frontend && npm run dev
```

---

## 🚢 Proxmox VE Deployment Guide

1. Create a Debian/Alpine LXC container in Proxmox.
2. Install Docker and Docker Compose inside the LXC container.
3. Clone this repository into `/opt/listd`.
4. Copy `.env.example` to `.env` and set your `CLOUDFLARE_TUNNEL_TOKEN`.
5. Start the complete stack:
   ```bash
   docker compose --profile tunnel up -d --build
   ```
6. Your instance is now reachable securely through your Cloudflare custom domain.

---

## 👥 Team & Git Conventions

- **Branching**: `main` (stable production), `dev` (integration), `feature/<name>` (new features).
- **Commit Messages**: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- **Environment Secrets**: Never commit `.env` or sensitive API keys. Use `.env.example` for documenting new variables.
