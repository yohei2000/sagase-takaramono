import { createServer } from 'vite';

const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const hostIndex = args.indexOf('--host');

const port =
  portIndex >= 0 && args[portIndex + 1] && Number.isFinite(Number(args[portIndex + 1]))
    ? Number(args[portIndex + 1])
    : 5173;
const host = hostIndex >= 0 && args[hostIndex + 1] ? args[hostIndex + 1] : '127.0.0.1';
const strictPort = args.includes('--strictPort');

const server = await createServer({
  server: {
    host,
    port,
    strictPort
  }
});

await server.listen();
server.printUrls();

const close = async () => {
  await server.close();
  process.exit(0);
};

process.on('SIGINT', close);
process.on('SIGTERM', close);

// Keep the process alive when launched without an interactive stdin.
setInterval(() => {}, 2 ** 30);
