import nodemailer from 'nodemailer';
import { describe, expect, it } from 'vitest';

describe('Gmail MIME composer', () => {
  it('produces a buffered RFC 5322 message without sending email', async () => {
    const transporter = nodemailer.createTransport({ streamTransport: true, buffer: true });
    const result = await transporter.sendMail({
      from: '"Herbal-Ai" <sender@example.com>',
      to: 'recipient@example.com',
      subject: 'Verify your email',
      html: '<p>Verify your email</p>',
    });

    expect(Buffer.isBuffer(result.message)).toBe(true);
    const message = result.message.toString('utf8');
    expect(message).toContain('From: "Herbal-Ai" <sender@example.com>');
    expect(message).toContain('To: recipient@example.com');
    expect(message).toContain('Subject: Verify your email');
    expect(message).toContain('Verify your email</p>');
  });
});
