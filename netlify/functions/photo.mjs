import { getStore } from '@netlify/blobs';
import { getDatabase } from '@netlify/database';
export default async (request) => {
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return new Response('Not found', { status: 404 });
    const db = getDatabase();
    const [photo] = await db.sql`SELECT image_key, content_type FROM eco_huevo_photos WHERE id = ${id}::uuid`;
    if (!photo) return new Response('Not found', { status: 404 });
    const image = await getStore('eco-huevo-photos').get(photo.image_key, { type: 'arrayBuffer', consistency: 'strong' });
    if (!image) return new Response('Not found', { status: 404 });
    return new Response(image, { headers: { 'Content-Type': photo.content_type, 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) {
    console.error('Netlify photo error:', error);
    return new Response('Image unavailable', { status: 500 });
  }
};
