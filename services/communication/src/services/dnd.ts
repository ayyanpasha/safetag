import { PrismaClient } from '../../generated/prisma/index.js';
import { createLogger } from '@safetag/service-utils';
import { notifyOwner } from './whatsapp.js';

const prisma = new PrismaClient();
const logger = createLogger('dnd');

/**
 * Check whether DND is currently active for a given user.
 */
export async function isDndActive(userId: string): Promise<boolean> {
  const config = await prisma.dndConfig.findUnique({ where: { userId } });

  if (!config || !config.enabled) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = config.startTime.split(':').map(Number);
  const [endH, endM] = config.endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Handle overnight ranges (e.g. 22:00 - 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  // Same-day range (e.g. 13:00 - 15:00)
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Queue a message to be sent later (when DND ends).
 */
export async function queueMessage(
  userId: string,
  content: string,
  channel: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const config = await prisma.dndConfig.findUnique({ where: { userId } });

  // Calculate next morning (endTime) as scheduledFor
  const now = new Date();
  const [endH, endM] = (config?.endTime || '07:00').split(':').map(Number);

  const scheduledFor = new Date(now);
  scheduledFor.setHours(endH, endM, 0, 0);

  // If we're already past end time today, schedule for tomorrow morning
  if (scheduledFor <= now) {
    scheduledFor.setDate(scheduledFor.getDate() + 1);
  }

  await prisma.queuedMessage.create({
    data: {
      userId,
      content,
      channel,
      metadata: (metadata as any) ?? undefined,
      scheduledFor,
    },
  });

  logger.info({ userId, channel, scheduledFor: scheduledFor.toISOString() }, 'Message queued for later delivery');
}

/**
 * Process the message queue — send all unsent messages whose scheduledFor <= now.
 * Intended to be called by a cron job or scheduler.
 */
export async function processQueue(): Promise<number> {
  const now = new Date();

  const pendingMessages = await prisma.queuedMessage.findMany({
    where: {
      sent: false,
      scheduledFor: { lte: now },
    },
  });

  let sentCount = 0;

  for (const msg of pendingMessages) {
    try {
      await notifyOwner(
        msg.userId,
        msg.content,
        (msg.metadata as Record<string, unknown>) ?? undefined
      );

      await prisma.queuedMessage.update({
        where: { id: msg.id },
        data: { sent: true },
      });

      sentCount++;
      logger.info({ messageId: msg.id, userId: msg.userId }, 'Queued message sent');
    } catch (err) {
      logger.error({ err, messageId: msg.id }, 'Failed to send queued message');
    }
  }

  logger.info({ sentCount, total: pendingMessages.length }, 'Queue processing complete');
  return sentCount;
}
