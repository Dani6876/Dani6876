import { getDatabase } from '@netlify/database';
import { getDevice, jsonResponse } from './_shared/session.mjs';
const ALLOWED = new Set(['like', 'excellent', 'eco']);
export default async (request) => {
  try {
    const { deviceId, cookie } = getDevice(request);
    if (request.method !== 'POST') return jsonResponse({ error: 'Método no permitido.' }, 405, cookie);
    const { photoId, reaction } = await request.json();
    if (typeof photoId !== 'string' || !/^[0-9a-f-]{36}$/i.test(photoId) || !ALLOWED.has(reaction)) return jsonResponse({ error: 'La foto o la reacción no son válidas.' }, 400, cookie);
    const db = getDatabase();
    const rows = await db.sql`INSERT INTO eco_huevo_reactions (photo_id, device_id, reaction) SELECT p.id, ${deviceId}::uuid, ${reaction} FROM eco_huevo_photos p WHERE p.id = ${photoId}::uuid ON CONFLICT (photo_id, device_id, reaction) DO NOTHING RETURNING photo_id`;
    const exists = await db.sql`SELECT id FROM eco_huevo_photos WHERE id = ${photoId}::uuid`;
    if (!exists.length) return jsonResponse({ error: 'No encontramos esa foto.' }, 404, cookie);
    return jsonResponse({ ok: true, alreadyReacted: rows.length === 0 }, 200, cookie);
  } catch (error) {
    console.error('Netlify reaction error:', error);
    return jsonResponse({ error: error.message || 'No se pudo guardar la reacción.' }, 500);
  }
};
