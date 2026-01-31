import { describe, it, expect, vi } from 'vitest';

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    send = vi.fn().mockResolvedValue({});
  },
  PutObjectCommand: class {
    constructor(public input: any) {}
  },
}));

import { uploadPhoto } from '../services/s3.js';

describe('uploadPhoto', () => {
  it('uploads a valid JPEG file', async () => {
    const buffer = Buffer.alloc(1024);
    const url = await uploadPhoto(buffer, 'photo.jpg');
    expect(url).toContain('incidents/');
    expect(url).toContain('photo.jpg');
  });

  it('uploads a valid PNG file', async () => {
    const buffer = Buffer.alloc(1024);
    const url = await uploadPhoto(buffer, 'photo.png');
    expect(url).toContain('photo.png');
  });

  it('rejects files larger than 5MB', async () => {
    const buffer = Buffer.alloc(6 * 1024 * 1024);
    await expect(uploadPhoto(buffer, 'big.jpg')).rejects.toThrow('File size exceeds 5MB limit');
  });

  it('rejects invalid file types', async () => {
    const buffer = Buffer.alloc(1024);
    await expect(uploadPhoto(buffer, 'malware.exe')).rejects.toThrow('Invalid file type');
  });

  it('sanitizes directory traversal in filename', async () => {
    const buffer = Buffer.alloc(1024);
    const url = await uploadPhoto(buffer, '../../etc/passwd.jpg');
    expect(url).not.toContain('..');
    expect(url).toContain('etcpasswd.jpg');
  });

  it('strips special characters from filename', async () => {
    const buffer = Buffer.alloc(1024);
    const url = await uploadPhoto(buffer, 'photo <script>.jpg');
    expect(url).not.toContain('<');
    expect(url).not.toContain('>');
  });

  it('truncates long filenames to 100 chars', async () => {
    const buffer = Buffer.alloc(1024);
    const longName = 'a'.repeat(90) + '.jpg';
    const url = await uploadPhoto(buffer, longName);
    const parts = url.split('/');
    const filenamePart = parts[parts.length - 1];
    const dashIndex = filenamePart.indexOf('-');
    const sanitized = filenamePart.slice(dashIndex + 1);
    expect(sanitized.length).toBeLessThanOrEqual(100);
  });
});
