import { prisma } from '../lib/prisma.js';
import { redis, publishEvent, EVENTS } from '../lib/redis.js';
import { generateOtp } from '../lib/crypto.js';
import { validateSessionToken } from './scan.service.js';
import { getUserById } from './auth.service.js';
import { NotFoundError, UnauthorizedError } from '../middleware/error-handler.js';

const VOIP_OTP_EXPIRY_MINUTES = 5;
const CALL_SESSION_EXPIRY_SECONDS = 300; // 5 minutes

export interface WhatsAppComplaintResult {
  success: boolean;
  message: string;
  conversationId: string;
}

export interface VoipInitiateResult {
  callId: string;
  signalingUrl: string;
  turnServers: Array<{
    urls: string[];
    username: string;
    credential: string;
  }>;
}

export interface ConversationInfo {
  id: string;
  channel: string;
  createdAt: Date;
  messages: Array<{
    id: string;
    direction: string;
    content: string;
    sentAt: Date;
  }>;
}

// Problem type translations
const PROBLEM_TRANSLATIONS: Record<string, { en: string; hi: string; kn: string }> = {
  WRONG_PARKING: {
    en: 'Wrong Parking',
    hi: 'गलत पार्किंग',
    kn: 'ತಪ್ಪಾಗಿ ಪಾರ್ಕ್ ಮಾಡಲಾಗಿದೆ',
  },
  GETTING_TOWED: {
    en: 'Getting Towed',
    hi: 'वाहन टो हो रहा है',
    kn: 'ವಾಹನ ಎಳೆಯಲಾಗುತ್ತಿದೆ',
  },
  LIGHTS_ON: {
    en: 'Lights On',
    hi: 'लाइट्स चालू हैं',
    kn: 'ಲೈಟ್‌ಗಳು ಆನ್ ಆಗಿವೆ',
  },
  BLOCKING_DRIVEWAY: {
    en: 'Blocking Driveway',
    hi: 'ड्राइववे अवरुद्ध है',
    kn: 'ಡ್ರೈವ್‌ವೇ ಬ್ಲಾಕ್ ಆಗಿದೆ',
  },
  ALARM_GOING_OFF: {
    en: 'Alarm Going Off',
    hi: 'अलार्म बज रहा है',
    kn: 'ಅಲಾರಂ ಬಾರಿಸುತ್ತಿದೆ',
  },
  DOOR_OPEN: {
    en: 'Door Open',
    hi: 'दरवाजा खुला है',
    kn: 'ಬಾಗಿಲು ತೆರೆದಿದೆ',
  },
  OTHER: {
    en: 'Other Issue',
    hi: 'अन्य समस्या',
    kn: 'ಇತರ ಸಮಸ್ಯೆ',
  },
};

// Check if user has DND active
export async function isDndActive(userId: string): Promise<boolean> {
  const dndConfig = await prisma.dndConfig.findUnique({
    where: { userId },
  });

  if (!dndConfig || !dndConfig.enabled) {
    return false;
  }

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  const start = dndConfig.startTime;
  const end = dndConfig.endTime;

  // Handle overnight DND (e.g., 22:00 - 07:00)
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }

  return currentTime >= start && currentTime < end;
}

// Get DND end time
function getDndEndTime(dndConfig: { startTime: string; endTime: string }): Date {
  const now = new Date();
  const [endHour, endMin] = dndConfig.endTime.split(':').map(Number);
  const endTime = new Date(now);
  endTime.setHours(endHour, endMin, 0, 0);

  // If end time is before now, it's tomorrow
  if (endTime < now) {
    endTime.setDate(endTime.getDate() + 1);
  }

  return endTime;
}

// Send WhatsApp message (mock implementation - replace with actual API)
async function sendWhatsAppMessage(
  phone: string,
  message: string,
  _type: 'scanner' | 'owner'
): Promise<boolean> {
  // In production, integrate with WhatsApp Business API
  const whatsappUrl =
    _type === 'scanner'
      ? process.env.WHATSAPP_API_URL_SCANNER
      : process.env.WHATSAPP_API_URL_OWNER;
  const whatsappToken =
    _type === 'scanner'
      ? process.env.WHATSAPP_TOKEN_SCANNER
      : process.env.WHATSAPP_TOKEN_OWNER;

  if (!whatsappUrl || !whatsappToken) {
    console.log(`[MOCK] WhatsApp to ${phone}: ${message}`);
    return true;
  }

  try {
    const response = await fetch(whatsappUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${whatsappToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: `91${phone}`,
        type: 'text',
        text: { body: message },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return false;
  }
}

// Send complaint via WhatsApp
export async function sendWhatsAppComplaint(
  sessionToken: string,
  problemType: string,
  additionalMessage?: string
): Promise<WhatsAppComplaintResult> {
  // Validate session token
  const { valid, payload } = await validateSessionToken(sessionToken);

  if (!valid || !payload) {
    throw new UnauthorizedError('Invalid or expired session token');
  }

  // Get owner info
  const owner = await getUserById(payload.ownerId);

  if (!owner) {
    throw new NotFoundError('Vehicle owner not found');
  }

  // Check DND status
  const dndActive = await isDndActive(payload.ownerId);

  // Create conversation
  const session = await prisma.scanSession.findFirst({
    where: { vehicleId: payload.vehicleId },
    orderBy: { createdAt: 'desc' },
  });

  if (!session) {
    throw new NotFoundError('Scan session not found');
  }

  const conversation = await prisma.conversation.create({
    data: {
      ownerId: payload.ownerId,
      scannerSessionId: session.id,
      channel: 'WHATSAPP',
    },
  });

  // Build message content
  const problem = PROBLEM_TRANSLATIONS[problemType] || PROBLEM_TRANSLATIONS.OTHER;
  const location = `${payload.latitude.toFixed(6)}, ${payload.longitude.toFixed(6)}`;
  const mapLink = `https://maps.google.com/?q=${payload.latitude},${payload.longitude}`;

  const ownerMessage = `
🚗 SafeTag Alert!

Vehicle: ${payload.vehicleNumber}
Issue: ${problem.en} | ${problem.hi}
Location: ${mapLink}
${additionalMessage ? `\nMessage: ${additionalMessage}` : ''}

Please check your vehicle.
`.trim();

  // Store message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: 'OUTBOUND',
      content: ownerMessage,
      metadata: { problemType, location },
    },
  });

  if (dndActive) {
    // Queue message for later
    const dndConfig = await prisma.dndConfig.findUnique({
      where: { userId: payload.ownerId },
    });

    if (dndConfig) {
      await prisma.queuedMessage.create({
        data: {
          userId: payload.ownerId,
          content: ownerMessage,
          channel: 'WHATSAPP',
          metadata: { problemType, conversationId: conversation.id },
          scheduledFor: getDndEndTime(dndConfig),
        },
      });
    }

    return {
      success: true,
      message: 'Message queued (owner has DND active)',
      conversationId: conversation.id,
    };
  }

  // Send to owner
  await sendWhatsAppMessage(owner.phone, ownerMessage, 'owner');

  // Publish event
  await publishEvent(EVENTS.COMPLAINT_CREATED, {
    conversationId: conversation.id,
    vehicleId: payload.vehicleId,
    ownerId: payload.ownerId,
    problemType,
  });

  return {
    success: true,
    message: 'Complaint sent to vehicle owner',
    conversationId: conversation.id,
  };
}

// Send OTP for VoIP call
export async function sendVoipOtp(
  sessionToken: string,
  phone: string
): Promise<{ success: boolean; expiresIn: number }> {
  // Validate session token
  const { valid, payload } = await validateSessionToken(sessionToken);

  if (!valid || !payload) {
    throw new UnauthorizedError('Invalid or expired session token');
  }

  // Generate and store OTP
  const otp = generateOtp();
  const key = `voip:otp:${phone}`;
  await redis.setex(key, VOIP_OTP_EXPIRY_MINUTES * 60, otp);

  // Send OTP via SMS (mock for now)
  console.log(`[DEV] VoIP OTP for ${phone}: ${otp}`);

  return {
    success: true,
    expiresIn: VOIP_OTP_EXPIRY_MINUTES * 60,
  };
}

// Verify VoIP OTP
async function verifyVoipOtp(phone: string, otp: string): Promise<boolean> {
  const key = `voip:otp:${phone}`;
  const storedOtp = await redis.get(key);

  if (!storedOtp || storedOtp !== otp) {
    return false;
  }

  await redis.del(key);
  return true;
}

// Initiate VoIP call
export async function initiateVoipCall(
  sessionToken: string,
  phone: string,
  otp: string
): Promise<VoipInitiateResult> {
  // Validate session token
  const { valid, payload } = await validateSessionToken(sessionToken);

  if (!valid || !payload) {
    throw new UnauthorizedError('Invalid or expired session token');
  }

  // Verify OTP
  if (!(await verifyVoipOtp(phone, otp))) {
    throw new UnauthorizedError('Invalid or expired OTP');
  }

  // Get owner info
  const owner = await getUserById(payload.ownerId);

  if (!owner) {
    throw new NotFoundError('Vehicle owner not found');
  }

  // Check DND status (can still call but with warning)
  const dndActive = await isDndActive(payload.ownerId);

  // Generate call ID
  const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  // Store call session in Redis
  const callSession = {
    callId,
    vehicleId: payload.vehicleId,
    ownerId: payload.ownerId,
    ownerPhone: owner.phone,
    scannerPhone: phone,
    dndActive,
    status: 'pending',
    createdAt: Date.now(),
  };

  await redis.setex(
    `call:${callId}`,
    CALL_SESSION_EXPIRY_SECONDS,
    JSON.stringify(callSession)
  );

  // Publish VoIP event (for WebSocket notification to owner)
  await publishEvent(EVENTS.VOIP_CALL_INITIATED, {
    callId,
    ownerId: payload.ownerId,
    vehicleNumber: payload.vehicleNumber,
    dndActive,
  });

  // Get TURN server config
  const turnServers = [
    {
      urls: [process.env.TURN_SERVER_URL || 'turn:turn.safetag.app:3478'],
      username: process.env.TURN_USERNAME || 'safetag',
      credential: process.env.TURN_CREDENTIAL || 'safetag-turn-cred',
    },
  ];

  const wsProtocol = process.env.NODE_ENV === 'production' ? 'wss' : 'ws';
  const host = process.env.PUBLIC_HOST || 'localhost:8080';

  return {
    callId,
    signalingUrl: `${wsProtocol}://${host}/api/contact/voip/signal`,
    turnServers,
  };
}

// Get call status
export async function getCallStatus(
  callId: string
): Promise<{ status: string; dndActive: boolean } | null> {
  const callData = await redis.get(`call:${callId}`);

  if (!callData) {
    return null;
  }

  const session = JSON.parse(callData) as { status: string; dndActive: boolean };
  return { status: session.status, dndActive: session.dndActive };
}

// Update call status
export async function updateCallStatus(
  callId: string,
  status: 'ringing' | 'answered' | 'ended' | 'missed'
): Promise<void> {
  const callData = await redis.get(`call:${callId}`);

  if (callData) {
    const session = JSON.parse(callData);
    session.status = status;
    await redis.setex(
      `call:${callId}`,
      CALL_SESSION_EXPIRY_SECONDS,
      JSON.stringify(session)
    );
  }
}

// Get user's conversations
export async function getUserConversations(
  userId: string,
  limit: number = 20
): Promise<ConversationInfo[]> {
  const conversations = await prisma.conversation.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      messages: {
        orderBy: { sentAt: 'asc' },
        take: 50,
      },
    },
  });

  return conversations.map((c) => ({
    id: c.id,
    channel: c.channel,
    createdAt: c.createdAt,
    messages: c.messages.map((m) => ({
      id: m.id,
      direction: m.direction,
      content: m.content,
      sentAt: m.sentAt,
    })),
  }));
}

// Process queued messages (called by scheduler)
export async function processQueuedMessages(): Promise<number> {
  const now = new Date();

  const messages = await prisma.queuedMessage.findMany({
    where: {
      sent: false,
      scheduledFor: { lte: now },
    },
    include: {
      user: true,
    },
  });

  let processed = 0;

  for (const msg of messages) {
    await sendWhatsAppMessage(msg.user.phone, msg.content, 'owner');

    await prisma.queuedMessage.update({
      where: { id: msg.id },
      data: { sent: true },
    });

    processed++;
  }

  return processed;
}
