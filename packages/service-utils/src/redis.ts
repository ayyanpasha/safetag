import Redis from 'ioredis';
import { logger } from './logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export function createRedisClient(): Redis {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      return Math.min(times * 200, 5000);
    },
  });

  client.on('error', (err) => logger.error({ err }, 'Redis connection error'));
  client.on('connect', () => logger.info('Redis connected'));

  return client;
}

export const redis = createRedisClient();

export async function publishEvent(event: string, payload: unknown): Promise<void> {
  await redis.publish(event, JSON.stringify(payload));
}

export async function subscribeToEvent(
  event: string,
  handler: (payload: unknown) => void | Promise<void>,
): Promise<void> {
  const sub = createRedisClient();
  await sub.subscribe(event);
  sub.on('message', async (channel, message) => {
    if (channel === event) {
      try {
        const data = JSON.parse(message);
        await handler(data);
      } catch (err) {
        logger.error({ err, event }, 'Event handler error');
      }
    }
  });
}
