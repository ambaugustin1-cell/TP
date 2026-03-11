# ── Stage 1 : installation des dépendances ──
FROM node:20-alpine AS builder

WORKDIR /app

COPY src/package*.json ./

RUN npm install --omit=dev

# ── Stage 2 : image finale ──
FROM node:20-alpine AS production
RUN apk update && apk upgrade
LABEL maintainer="ton.email@exemple.com"
LABEL version="1.0.0"

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules
COPY src/server.js ./

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
