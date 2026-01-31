FROM oven/bun:1.3.4

WORKDIR /app

COPY apps/api/package.json ./package.json
RUN bun install

COPY apps/api/tsconfig.json ./tsconfig.json
COPY apps/api/src ./src

EXPOSE 8000

CMD ["bun", "src/index.ts"]
