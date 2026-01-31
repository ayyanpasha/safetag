import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createLogger } from '@safetag/service-utils';
import { registerRoutes } from './routes.js';

const logger = createLogger('auth');
const PORT = parseInt(process.env.AUTH_PORT || '3001', 10);

const app = Fastify({ logger: false });

await app.register(cors, { origin: true });

app.get('/health', async () => ({ status: 'ok', service: 'auth' }));

registerRoutes(app);

app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    logger.error({ err }, 'Failed to start auth service');
    process.exit(1);
  }
  logger.info(`Auth service listening on ${address}`);
});
