# --- SECTION: Metadata ---
ARG BUN_VERSION=1.2

FROM oven/bun:${BUN_VERSION}-alpine

LABEL maintainer="Clovis Mugaruka <clovis.mugaruka@gmail.com>"

# --- SECTION: App ---
WORKDIR /app

COPY server.js index.html ./
COPY public/ public/

EXPOSE 3000

CMD ["bun", "server.js"]
