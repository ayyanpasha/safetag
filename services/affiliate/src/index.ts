import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createLogger } from '@safetag/service-utils';
import { registerRoutes } from './routes.js';
import { startCommissionListener } from './services/commission.js';

const logger = createLogger('affiliate');
const PORT = parseInt(process.env.AFFILIATE_PORT || '3006', 10);

const app = Fastify({ logger: false });

await app.register(cors, { origin: true });

app.get('/health', async () => ({ status: 'ok', service: 'affiliate' }));

registerRoutes(app);

// Start listening for subscription events
startCommissionListener();

app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    logger.error({ err }, 'Failed to start affiliate service');
    process.exit(1);
  }
  logger.info(`Affiliate service listening on ${address}`);
});
