# Stage 1: Build React
FROM node:20-alpine AS builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# Stage 2: Express + static files
FROM node:20-alpine AS runner
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/ ./server/
COPY --from=builder /app/client/dist ./client/dist
EXPOSE 3000
CMD ["node", "server/index.js"]
