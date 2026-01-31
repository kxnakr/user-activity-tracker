FROM oven/bun:1.3.4

WORKDIR /app

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY apps/web/package.json ./package.json
RUN bun install

COPY apps/web/tsconfig.json ./tsconfig.json
COPY apps/web/vite.config.ts ./vite.config.ts
COPY apps/web/index.html ./index.html
COPY apps/web/public ./public
COPY apps/web/src ./src

RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "serve"]
