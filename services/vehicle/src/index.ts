import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createLogger } from '@safetag/service-utils';
import { registerRoutes } from './routes.js';

const logger = createLogger('vehicle');
const PORT = Number(process.env.VEHICLE_PORT) || 3002;

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
});

app.get('/health', async () => {
  return { status: 'ok', service: 'vehicle', timestamp: new Date().toISOString() };
});

registerRoutes(app);

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  logger.info(`Vehicle service listening on port ${PORT}`);
} catch (err) {
  logger.error(err, 'Failed to start vehicle service');
  process.exit(1);
}
