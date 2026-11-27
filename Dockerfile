FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-slim AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM node:20-slim
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/drizzle ./drizzle
COPY --from=backend-builder /app/backend/public ./public
COPY --from=frontend-builder /app/frontend/dist ./public

RUN mkdir -p /app/public/images && chown -R node:node /app
USER node

EXPOSE 3000
CMD ["npm", "start"]