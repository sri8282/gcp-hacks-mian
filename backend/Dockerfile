# Stage 1: Build / dependencies stage
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --production

# Stage 2: Runtime stage
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
