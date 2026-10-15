import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

// Read-only public requests. No cookies, credentials, mail, AI or content writes.
const base = new URL(process.env.QA_PUBLIC_URL || 'https://www.herbalai.site');
if (base.protocol !== 'https:' || !['www.herbalai.site', 'herbalai.site', 'herbalaiph.vercel.app'].includes(base.hostname)) throw new Error('Explicit known public HTTPS origin required');
const output = new URL('../output/live-qa-2026-10-15/', import.meta.url);
await mkdir(output, { recursive: true });
const results = [];
const notes = [];
const check = (name, pass, detail) => results.push({ name, pass: Boolean(pass), detail });
async function request(path, options = {}) {
  const start = performance.now();
  const response = await fetch(new URL(path, base), { ...options, signal: AbortSignal.timeout(20000) });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = null; }
  return { status: response.status, body, ms: Math.round(performance.now() - start), headers: Object.fromEntries(response.headers), url: response.url };
}
async function bounded(items, operation) {
  let index = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (index < items.length) { const item = items[index++]; await operation(item); }
  }));
}
const health = await request('/api/health');
check('API health', health.status === 200 && health.body?.status === 'success', { status: health.status, ms: health.ms });
check('HTTPS and security headers', health.url.startsWith('https:') && health.headers['strict-transport-security'] && health.headers['x-content-type-options'] === 'nosniff' && health.headers['content-security-policy'], {});
const all = [];
let total;
for (let page = 1; page <= 10; page++) {
  const result = await request(`/api/herbs?limit=100&page=${page}`);
  check(`Herb list page ${page}`, result.status === 200 && Array.isArray(result.body?.data?.herbs), { status: result.status, ms: result.ms });
  if (result.status !== 200 || !result.body?.data) break;
  total = result.body.data.total;
  all.push(...result.body.data.herbs);
  if (page >= result.body.data.totalPages) break;
}
check('Complete catalog pagination without duplicate IDs', total === all.length && new Set(all.map(h => h.id)).size === all.length, { total, returned: all.length });
const required = ['localName', 'scientificName', 'category', 'medicinalUses', 'preparationMethod', 'dosage', 'warnings', 'imageUrl'];
const fields = all.flatMap(h => required.filter(k => !String(h[k] ?? '').trim()).map(field => ({ id: h.id, name: h.localName, field })));
check('Required public herb fields populated', fields.length === 0, fields);
check('Only verified published records returned', all.every(h => h.isVerified && h.publicationStatus === 'PUBLISHED'), {});
const identities = new Map();
for (const h of all) { const key = h.scientificName.trim().toLowerCase(); identities.set(key, [...(identities.get(key) || []), h.localName]); }
notes.push({ name: 'Repeated scientific identities for editorial review', records: [...identities].filter(([, names]) => names.length > 1) });
const missingSources = all.filter(h => !h.sources?.length).map(h => ({ id: h.id, name: h.localName }));
check('Every herb has at least one source', missingSources.length === 0, missingSources);
const genericSources = all.filter(h => h.sources?.length && h.sources.every(s => { try { return new URL(s.url).pathname.replaceAll('/', '') === ''; } catch { return true; } })).map(h => ({ id: h.id, name: h.localName }));
notes.push({ name: 'Records whose source URLs all point to homepages or are absent; citation precision needs review', count: genericSources.length, records: genericSources });
const catalog = await request('/api/herbs/catalog');
check('Catalog and paginated herb IDs agree', catalog.status === 200 && catalog.body?.data?.herbs?.length === all.length && catalog.body.data.herbs.every(h => all.some(a => a.id === h.id)), { status: catalog.status, total: catalog.body?.data?.herbs?.length });
const categories = await request('/api/herbs/categories');
check('Categories endpoint', categories.status === 200 && Array.isArray(categories.body?.data?.categories), { status: categories.status, count: categories.body?.data?.categories?.length });
await bounded(all, async h => {
  try {
    const d = await request(`/api/herbs/${encodeURIComponent(h.id)}`);
    check(`Herb detail ${h.localName}`, d.status === 200 && d.body?.data?.herb?.id === h.id, { status: d.status, ms: d.ms });
  } catch (e) { check(`Herb detail ${h.localName}`, false, { error: e.name }); }
});
const images = [...new Set(all.map(h => h.imageUrl).filter(Boolean))];
await bounded(images, async image => {
  try {
    const u = new URL(image, base);
    const r = await fetch(u, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
    check(`Image ${u.pathname}`, r.ok && r.headers.get('content-type')?.startsWith('image/'), { status: r.status, contentType: r.headers.get('content-type') });
  } catch (e) { check(`Image ${image}`, false, { error: e.name }); }
});
for (const [query, expected] of [['Lagundi','Lagundi'],['Vitex negundo','Lagundi'],['Dangla','Lagundi'],['  Lagundi  ','Lagundi']]) {
  const r = await request(`/api/herbs?search=${encodeURIComponent(query)}`);
  check(`Search ${query}`, r.status === 200 && r.body?.data?.herbs?.some(h => h.localName === expected), { status: r.status, count: r.body?.data?.total });
}
const empty = await request('/api/herbs?search=qa-unknown-plant-20261015');
check('Unknown herb search empty', empty.status === 200 && empty.body?.data?.total === 0, {});
const doh = await request('/api/herbs?isDohApproved=true&limit=100');
check('DOH filter', doh.status === 200 && doh.body?.data?.herbs?.length > 0 && doh.body.data.herbs.every(h => h.isDohApproved), { total: doh.body?.data?.total });
for (const category of ['Respiratory', 'Dermatological (Toxic)', 'qa-nonexistent-category']) {
  const r = await request(`/api/herbs?category=${encodeURIComponent(category)}&limit=100`);
  check(`Category ${category}`, r.status === 200 && r.body?.data?.herbs?.every(h => h.category === category), { count: r.body?.data?.total });
}
for (const path of ['/api/herbs?search=a&search=b', '/api/herbs?isDohApproved=invalid', '/api/forum/threads/0', '/api/forum/threads/1.5']) {
  const r = await request(path); check(`Invalid public input ${path}`, r.status === 400, { status: r.status });
}
for (const path of ['/api/herbs/qa-missing-herb-20261015','/api/forum/threads/2147483647']) {
  const r = await request(path); check(`Missing record ${path}`, r.status === 404, { status: r.status });
}
for (const path of ['/api/auth/me','/api/auth/users','/api/auth/socket-token','/api/messages/users','/api/messages/conversations','/api/notifications','/api/admin/audit-logs','/api/stats/dashboard','/api/knowledge-base/all','/api/knowledge-base/page','/api/credits']) {
  const r = await request(path); check(`Anonymous access denied ${path}`, r.status === 401, { status: r.status, cache: r.headers['cache-control'] });
}
for (const path of ['/api/chat','/api/chat/stream','/api/suggest','/api/forum/threads','/api/messages','/api/credits/checkout']) {
  const r = await request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  check(`Anonymous mutation denied ${path}`, r.status === 401, { status: r.status });
}
for (const path of ['/api/auth/signup','/api/auth/login','/api/auth/forgot-password','/api/auth/resend-email-verification','/api/auth/reset-password']) {
  const r = await request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  check(`Empty authentication form ${path}`, r.status === 400, { status: r.status });
}
const threads = await request('/api/forum/threads?page=1&limit=3');
check('Public community listing', threads.status === 200 && threads.body?.status === 'success', { status: threads.status });
for (const path of ['/', '/library', '/about', '/sources', '/privacy', '/signin', '/signup', '/forgot-password', '/community', '/chat', '/messenger', '/suggest', '/credits', '/admin']) {
  const r = await request(path); check(`Page HTTP ${path}`, r.status === 200, { status: r.status, ms: r.ms });
}
const report = { at: new Date().toISOString(), base: base.origin, publicReadOnly: true, summary: { checks: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, herbs: all.length, uniqueImages: images.length }, failures: results.filter(r => !r.pass), notes, results };
await writeFile(new URL('public-api-audit.json', output), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report.summary, failures: report.failures, notes: notes.map(n => ({ name: n.name, count: n.count ?? n.records.length })) }, null, 2));
if (report.summary.failed) process.exitCode = 1;
