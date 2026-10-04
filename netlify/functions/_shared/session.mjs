import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
const COOKIE_NAME = 'eco_huevo_device';
function sign(value, secret) { return createHmac('sha256', secret).update(value).digest('hex'); }
export function getDevice(request) {
  const secret = process.env.NETLIFY_GALLERY_SECRET;
  if (!secret || secret.length < 32) throw new Error('Falta configurar NETLIFY_GALLERY_SECRET (mínimo 32 caracteres) en Netlify.');
  const entry = (request.headers.get('cookie') || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  const value = entry?.slice(COOKIE_NAME.length + 1);
  if (value) {
    const [deviceId, signature] = value.split('.');
    if (deviceId && signature) {
      const actual = Buffer.from(signature), expected = Buffer.from(sign(deviceId, secret));
      if (actual.length === expected.length && timingSafeEqual(actual, expected)) return { deviceId, cookie: null };
    }
  }
  const deviceId = randomUUID();
  return { deviceId, cookie: `${COOKIE_NAME}=${deviceId}.${sign(deviceId, secret)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000` };
}
export function jsonResponse(data, status = 200, cookie = null) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  if (cookie) headers['Set-Cookie'] = cookie;
  return new Response(JSON.stringify(data), { status, headers });
}
