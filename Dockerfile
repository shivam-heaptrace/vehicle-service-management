# Build stage
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install

COPY src/ ./src
COPY public/ ./public
RUN npm run build

# Runtime stage
FROM node:20-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public

EXPOSE 8080
USER node

CMD ["node", "build/index.js"]
