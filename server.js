const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = Bun.file('.' + path);
    if (!await file.exists()) return new Response('Not found', { status: 404 });
    return new Response(file);
  }
});

console.log(`
\x1b[32m
,---.|              |                                 |
|---||    ,---.,---.|---.,---.,---.,---.,---.,---.,---|,---.
|   ||    |   ||---'|   ||    ,---||    |   ||   ||   |,---|
\`   '\`---'\`---|'---'\`---'\`    \`---^\`---'\`---'\`   '\`---'\`---^
          \`---'                                             \x1b[0m

\x1b[32m  Slither · Solve · Survive\x1b[0m
  \x1b[2mhttp://localhost:${server.port}\x1b[0m
`);
