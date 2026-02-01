import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    post: vi.fn(),
    upload: vi.fn(),
  },
}));

const { api } = await import('../client');
const { sendWhatsAppComplaint, initiateVoipCall, sendVoipOtp, reportEmergency } = await import('../contact');

beforeEach(() => vi.clearAllMocks());

describe('contact API', () => {
  it('sendWhatsAppComplaint sends problem type', async () => {
    (api.post as any).mockResolvedValue({ success: true });
    await sendWhatsAppComplaint({ sessionToken: 'tok', problemType: 'WRONG_PARKING' });
    expect(api.post).toHaveBeenCalledWith('/api/contact/whatsapp', {
      sessionToken: 'tok',
      problemType: 'WRONG_PARKING',
    });
  });

  it('initiateVoipCall sends phone and otp', async () => {
    (api.post as any).mockResolvedValue({ success: true, data: { signalingUrl: 'ws://x', callId: 'c1' } });
    await initiateVoipCall({ sessionToken: 'tok', phone: '+919876543210', otp: '123456' });
    expect(api.post).toHaveBeenCalledWith('/api/contact/voip/initiate', {
      sessionToken: 'tok',
      phone: '+919876543210',
      otp: '123456',
    });
  });

  it('sendVoipOtp sends sessionToken', async () => {
    (api.post as any).mockResolvedValue({ success: true });
    await sendVoipOtp('tok-123');
    expect(api.post).toHaveBeenCalledWith('/api/contact/voip/otp', { sessionToken: 'tok-123' });
  });

  it('reportEmergency uses upload', async () => {
    (api.upload as any).mockResolvedValue({ success: true, data: { incidentId: 'i1' } });
    const fd = new FormData();
    await reportEmergency(fd);
    expect(api.upload).toHaveBeenCalledWith('/api/contact/emergency', fd);
  });
});
