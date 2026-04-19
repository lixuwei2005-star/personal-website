FROM node:20-slim AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-slim AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts

RUN mkdir -p data public/uploads

ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production

EXPOSE 4321

CMD ["node", "dist/server/entry.mjs"]
