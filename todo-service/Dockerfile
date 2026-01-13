FROM oven/bun:latest AS base

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .

RUN bunx prisma generate

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
