import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { createLogger } from '@safetag/service-utils';
import { registerRoutes } from './routes.js';

const logger = createLogger('communication');
const PORT = Number(process.env.COMMUNICATION_PORT) || 3004;

const app = Fastify({ logger: false });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
});

await app.register(websocket);

app.get('/health', async () => {
  return { status: 'ok', service: 'communication', timestamp: new Date().toISOString() };
});

registerRoutes(app);

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  logger.info(`Communication service listening on port ${PORT}`);
} catch (err) {
  logger.error(err, 'Failed to start communication service');
  process.exit(1);
}
