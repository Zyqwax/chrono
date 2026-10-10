FROM node:20-alpine AS base

# Pnpm kurulumu
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Bağımlılık dosyalarını kopyala
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY apps/server/prisma ./apps/server/prisma/

# Bağımlılıkları yükle
RUN pnpm install --frozen-lockfile

# Kaynak kodları kopyala
COPY apps/server ./apps/server

# Prisma client üret ve NestJS build al
WORKDIR /app/apps/server
RUN pnpm prisma:generate
RUN pnpm build

# Production imajı
FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=base /app/apps/server/dist ./apps/server/dist
COPY --from=base /app/apps/server/prisma ./apps/server/prisma
COPY --from=base /app/apps/server/package.json ./apps/server/package.json

WORKDIR /app/apps/server

EXPOSE 3001

CMD ["node", "dist/main.js"]
