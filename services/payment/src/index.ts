import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createLogger } from '@safetag/service-utils';
import { registerRoutes } from './routes.js';

const logger = createLogger('payment');
const PORT = parseInt(process.env.PAYMENT_PORT || '3005', 10);

const app = Fastify({
  logger: false,
});

// Register raw body support for webhook signature verification
app.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  (req, body, done) => {
    try {
      const rawBody = body as string;
      (req as any).rawBody = rawBody;
      const json = JSON.parse(rawBody);
      done(null, json);
    } catch (err: any) {
      done(err, undefined);
    }
  },
);

await app.register(cors, { origin: true });

app.get('/health', async () => ({ status: 'ok', service: 'payment' }));

registerRoutes(app);

app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    logger.error({ err }, 'Failed to start payment service');
    process.exit(1);
  }
  logger.info(`Payment service listening on ${address}`);
});
