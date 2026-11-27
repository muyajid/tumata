FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM node:20-slim
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/drizzle ./drizzle
COPY --from=backend-builder /app/backend/public ./public

COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 3000
CMD ["npm", "start"]