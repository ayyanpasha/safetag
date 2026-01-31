import Fastify from 'fastify';
import cors from '@fastify/cors';
import { logger } from '@safetag/service-utils';
import { registerRoutes } from './routes.js';

const PORT = Number(process.env.SHERIFF_PORT) || 3003;
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const app = Fastify({ logger: false });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  app.get('/health', async () => ({ status: 'ok', service: 'sheriff' }));

  registerRoutes(app);

  await app.listen({ port: PORT, host: HOST });
  logger.info(`Sheriff service listening on ${HOST}:${PORT}`);
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start sheriff service');
  process.exit(1);
});
