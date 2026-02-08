import { FastifyInstance } from 'fastify';
import authRoutes from './auth.js';
import vehicleRoutes from './vehicles.js';
import scanRoutes from './scan.js';
import contactRoutes from './contact.js';
import paymentRoutes from './payments.js';
import affiliateRoutes from './affiliate.js';
import incidentRoutes from './incidents.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Register all route modules with their prefixes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(vehicleRoutes, { prefix: '/api/vehicles' });
  await app.register(scanRoutes, { prefix: '/api/scan' });
  await app.register(contactRoutes, { prefix: '/api/contact' });
  await app.register(paymentRoutes, { prefix: '/api/payments' });
  await app.register(affiliateRoutes, { prefix: '/api/affiliate' });
  await app.register(incidentRoutes, { prefix: '/api/incidents' });

  // Health check endpoint
  app.get('/api/health', async (_request, reply) => {
    return reply.send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  // Root redirect
  app.get('/', async (_request, reply) => {
    return reply.redirect('/api/health');
  });
}

export default registerRoutes;
