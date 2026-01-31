import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { createLogger } from '@safetag/service-utils';
import { registerRoutes } from './routes.js';

const logger = createLogger('incident');
const PORT = Number(process.env.INCIDENT_PORT) || 3007;

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
});

await app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

app.get('/health', async () => {
  return { status: 'ok', service: 'incident', timestamp: new Date().toISOString() };
});

registerRoutes(app);

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  logger.info(`Incident service listening on port ${PORT}`);
} catch (err) {
  logger.error(err, 'Failed to start incident service');
  process.exit(1);
}
