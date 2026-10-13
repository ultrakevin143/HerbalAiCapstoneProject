import { describe, expect, it } from 'vitest';
import { parseAdditionalFrontendOrigins, trustedFrontendOrigins, trustedRequestOrigins } from '../src/config/frontend-origins.js';

const preview = 'https://approved-preview.example.test';

describe('explicit frontend origin configuration', () => {
  it.each([undefined, '', '  '])('does not add origins when unset (%s)', value => {
    expect(parseAdditionalFrontendOrigins(value)).toEqual([]);
  });

  it('accepts and deduplicates exact HTTPS origins with optional trailing root slash', () => {
    expect(parseAdditionalFrontendOrigins(` ${preview}/, ${preview}, https://second-preview.example.test `))
      .toEqual([preview, 'https://second-preview.example.test']);
  });

  it.each([
    '*', 'https://*.vercel.app', 'https://good.example.test,', 'null', '//good.example.test',
    'http://good.example.test', 'javascript:alert(1)', 'https://user:password@good.example.test',
    'https://good.example.test/path', 'https://good.example.test/?query=1',
    'https://good.example.test/#fragment', 'https://good.example.test/../',
    'https://GOOD.example.test', 'https://good.example.test:443',
  ])('fails closed for unsafe or ambiguous configuration (%s)', value => {
    expect(() => parseAdditionalFrontendOrigins(value)).toThrow(/FRONTEND_ADDITIONAL_ORIGINS/);
  });

  it('bounds configured origin count', () => {
    const origins = Array.from({ length: 9 }, (_, index) => `https://preview${index}.example.test`);
    expect(() => parseAdditionalFrontendOrigins(origins.join(','))).toThrow(/at most eight/);
  });

  it('preserves the primary frontend without adding blanket Vercel or local socket access', () => {
    const origins = trustedFrontendOrigins('https://www.herbalai.site', [preview]);
    expect([...origins]).toEqual(['https://www.herbalai.site', preview]);
    for (const origin of ['https://other.vercel.app', preview + '.evil.test', 'http://localhost:3000', 'null']) {
      expect(origins.has(origin)).toBe(false);
    }
  });

  it('retains only existing loopback request origins in addition to configured frontend origins', () => {
    const origins = trustedRequestOrigins('https://www.herbalai.site', [preview]);
    expect(origins.has(preview)).toBe(true);
    expect(origins.has('http://localhost:3000')).toBe(true);
    expect(origins.has('http://127.0.0.1:3001')).toBe(true);
    expect(origins.has('http://localhost:4000')).toBe(false);
  });
});
