import { randomUUID } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { getDatabase } from '@netlify/database';
import { getDevice, jsonResponse } from './_shared/session.mjs';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
function matchesImageType(bytes, type) {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === 'image/webp') return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  return false;
}
export default async (request) => {
  try {
    const { deviceId, cookie } = getDevice(request);
    const db = getDatabase();
    if (request.method === 'GET') {
      const photos = await db.sql`
        SELECT p.id, p.author_name, p.created_at,
          COUNT(r.reaction) FILTER (WHERE r.reaction = 'like')::int AS likes,
          COUNT(r.reaction) FILTER (WHERE r.reaction = 'excellent')::int AS excellents,
          COUNT(r.reaction) FILTER (WHERE r.reaction = 'eco')::int AS ecos,
          COALESCE(ARRAY_AGG(DISTINCT r.reaction) FILTER (WHERE r.device_id = ${deviceId}::uuid), ARRAY[]::text[]) AS mine
        FROM eco_huevo_photos p LEFT JOIN eco_huevo_reactions r ON r.photo_id = p.id
        GROUP BY p.id ORDER BY p.created_at DESC LIMIT 100
      `;
      return jsonResponse({ photos: photos.map((photo) => ({ ...photo, counts: { like: photo.likes, excellent: photo.excellents, eco: photo.ecos } })) }, 200, cookie);
    }
    if (request.method !== 'POST') return jsonResponse({ error: 'Método no permitido.' }, 405, cookie);
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_IMAGE_BYTES + 64 * 1024) return jsonResponse({ error: 'La foto supera el límite de 4 MB.' }, 413, cookie);
    const form = await request.formData();
    const file = form.get('photo');
    if (!(file instanceof File) || !IMAGE_TYPES.has(file.type)) return jsonResponse({ error: 'Selecciona una imagen JPG, PNG o WebP.' }, 400, cookie);
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) return jsonResponse({ error: 'La foto debe pesar hasta 4 MB.' }, 413, cookie);
    const imageBuffer = Buffer.from(await file.arrayBuffer());
    if (!matchesImageType(imageBuffer, file.type)) return jsonResponse({ error: 'El archivo no coincide con el formato de imagen indicado.' }, 400, cookie);
    const id = randomUUID(), imageKey = `${id}.${file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]}`;
    const authorName = String(form.get('authorName') || '').trim().slice(0, 50) || 'Estudiante';
    const store = getStore('eco-huevo-photos');
    await store.set(imageKey, imageBuffer, { metadata: { contentType: file.type } });
    try {
      await db.sql`INSERT INTO eco_huevo_photos (id, device_id, author_name, image_key, content_type) VALUES (${id}::uuid, ${deviceId}::uuid, ${authorName}, ${imageKey}, ${file.type})`;
    } catch (error) { await store.delete(imageKey); throw error; }
    return jsonResponse({ ok: true, id }, 201, cookie);
  } catch (error) {
    console.error('Netlify gallery error:', error);
    return jsonResponse({ error: error.message || 'Error interno de la galería.' }, 500);
  }
};
