const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

export async function api(path: string, options: RequestOptions = {}) {
  const { method = 'GET', body, headers = {}, token } = options;

  const reqHeaders: Record<string, string> = { ...headers };

  if (body !== undefined) {
    reqHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${GATEWAY_URL}${path}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);
  return { status: res.status, body: json };
}

/**
 * Authenticate by sending OTP and verifying it.
 * Returns { accessToken, refreshToken, user }.
 */
export async function authenticate(phone = '+919876543210') {
  const sendRes = await api('/api/auth/otp/send', {
    method: 'POST',
    body: { phone },
  });

  if (!sendRes.body?.success) {
    throw new Error(`Failed to send OTP: ${JSON.stringify(sendRes.body)}`);
  }

  const otp = sendRes.body.data?.otp;
  if (!otp) {
    throw new Error('OTP not returned in dev mode — is NODE_ENV=production?');
  }

  const verifyRes = await api('/api/auth/otp/verify', {
    method: 'POST',
    body: { phone, otp },
  });

  if (!verifyRes.body?.success) {
    throw new Error(`Failed to verify OTP: ${JSON.stringify(verifyRes.body)}`);
  }

  return verifyRes.body.data as {
    accessToken: string;
    refreshToken: string;
    user: { id: string; phone: string; role: string };
    isNewUser: boolean;
  };
}
