import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Main Redis client for operations
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err: Error) {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    return targetErrors.some((e) => err.message.includes(e));
  },
});

// Separate client for pub/sub (subscriber cannot be used for other commands)
export const redisSub = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Event names for pub/sub
export const EVENTS = {
  USER_CREATED: 'user:created',
  SUBSCRIPTION_ACTIVATED: 'subscription:activated',
  SUBSCRIPTION_CANCELED: 'subscription:canceled',
  SCAN_VERIFIED: 'scan:verified',
  COMPLAINT_CREATED: 'complaint:created',
  EMERGENCY_CREATED: 'emergency:created',
  VOIP_CALL_INITIATED: 'voip:call:initiated',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// Publish event to Redis
export async function publishEvent<T>(
  event: EventName,
  payload: T
): Promise<void> {
  await redis.publish(event, JSON.stringify(payload));
}

// Subscribe to events
export function subscribeToEvent<T>(
  event: EventName,
  handler: (payload: T) => void | Promise<void>
): void {
  redisSub.subscribe(event);
  redisSub.on('message', async (channel: string, message: string) => {
    if (channel === event) {
      try {
        const payload = JSON.parse(message) as T;
        await handler(payload);
      } catch (error) {
        console.error(`Error handling event ${event}:`, error);
      }
    }
  });
}

// Graceful shutdown
async function shutdown() {
  await redis.quit();
  await redisSub.quit();
}

process.on('beforeExit', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Connection event handlers
redis.on('error', (err: Error) => console.error('Redis error:', err));
redis.on('connect', () => console.log('Redis connected'));

redisSub.on('error', (err: Error) => console.error('Redis sub error:', err));
