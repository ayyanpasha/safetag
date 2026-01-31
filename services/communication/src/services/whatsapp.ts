import { createLogger } from '@safetag/service-utils';

const logger = createLogger('whatsapp');

const WHATSAPP_API_URL_SCANNER = process.env.WHATSAPP_API_URL_SCANNER || 'https://api.whatsapp.com/scanner';
const WHATSAPP_API_URL_OWNER = process.env.WHATSAPP_API_URL_OWNER || 'https://api.whatsapp.com/owner';
const WHATSAPP_TOKEN_SCANNER = process.env.WHATSAPP_TOKEN_SCANNER || '';
const WHATSAPP_TOKEN_OWNER = process.env.WHATSAPP_TOKEN_OWNER || '';

/**
 * WhatsApp API #1 — scanner-facing: send thank-you message to scanner
 */
export async function sendScannerThankYou(
  phone: string,
  problemType: string,
  language: string
): Promise<{ success: boolean; messageId?: string }> {
  const messages: Record<string, string> = {
    en: `Thank you for reporting the ${problemType} issue. The vehicle owner has been notified.`,
    hi: `${problemType} समस्या की रिपोर्ट करने के लिए धन्यवाद। वाहन मालिक को सूचित कर दिया गया है।`,
    kn: `${problemType} ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ವಾಹನ ಮಾಲೀಕರಿಗೆ ತಿಳಿಸಲಾಗಿದೆ.`,
  };

  const content = messages[language] || messages['en'];

  try {
    logger.info({ phone, problemType, language }, 'Sending scanner thank-you via WhatsApp API #1');

    if (WHATSAPP_TOKEN_SCANNER) {
      const response = await fetch(`${WHATSAPP_API_URL_SCANNER}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${WHATSAPP_TOKEN_SCANNER}`,
        },
        body: JSON.stringify({
          to: phone,
          type: 'text',
          text: { body: content },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error({ status: response.status, errorBody }, 'WhatsApp API #1 request failed');
        return { success: false };
      }

      const data = (await response.json()) as { messages?: { id: string }[] };
      logger.info({ messageId: data.messages?.[0]?.id }, 'Scanner thank-you sent');
      return { success: true, messageId: data.messages?.[0]?.id };
    }

    // Simulated mode — no token configured
    logger.info({ phone, content }, '[SIMULATED] Scanner thank-you WhatsApp message');
    return { success: true, messageId: `sim_${Date.now()}` };
  } catch (err) {
    logger.error({ err, phone }, 'Failed to send scanner thank-you');
    return { success: false };
  }
}

/**
 * WhatsApp API #2 — owner-facing: notify owner of a complaint or arbitrary message
 */
export async function notifyOwner(
  ownerId: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; messageId?: string }> {
  try {
    logger.info({ ownerId, metadata }, 'Sending owner notification via WhatsApp API #2');

    if (WHATSAPP_TOKEN_OWNER) {
      const response = await fetch(`${WHATSAPP_API_URL_OWNER}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${WHATSAPP_TOKEN_OWNER}`,
        },
        body: JSON.stringify({
          to: ownerId,
          type: 'text',
          text: { body: message },
          metadata,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error({ status: response.status, errorBody }, 'WhatsApp API #2 request failed');
        return { success: false };
      }

      const data = (await response.json()) as { messages?: { id: string }[] };
      logger.info({ messageId: data.messages?.[0]?.id }, 'Owner notification sent');
      return { success: true, messageId: data.messages?.[0]?.id };
    }

    // Simulated mode
    logger.info({ ownerId, message }, '[SIMULATED] Owner WhatsApp notification');
    return { success: true, messageId: `sim_${Date.now()}` };
  } catch (err) {
    logger.error({ err, ownerId }, 'Failed to notify owner');
    return { success: false };
  }
}
