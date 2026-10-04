# Galería Eco-Huevo en Netlify

La galería usa servicios compartidos del lado del servidor: Netlify Database (Postgres) guarda publicaciones y reacciones; Netlify Blobs conserva las imágenes. El navegador no guarda publicaciones en `localStorage`.

## Publicación completa (incluye galería compartida)

**Netlify Drop publica la página estática, pero no despliega estas Netlify Functions.** Si usas Drop, el sitio se verá, pero las fotos compartidas, las reacciones y la galería no funcionarán. Para publicar también el backend sin configurar Git, usa Netlify CLI:

1. Abre una terminal en esta carpeta e instala los paquetes: `npm install`.
2. Inicia sesión: `npx netlify login`.
3. Crea y vincula un sitio vacío con `npx netlify sites:create`.
4. Crea la base con `npx netlify database init`.
5. En el panel del sitio, abre **Project configuration → Environment variables** y crea `NETLIFY_GALLERY_SECRET` con una clave aleatoria de 32 caracteres o más. No la pongas en el HTML ni la compartas públicamente.
6. Publica la versión completa con `npm run deploy`.

La migración `netlify/database/migrations/0001_eco_huevo_gallery.sql` crea las tablas durante el despliegue. Netlify documenta el uso de `netlify deploy` para publicaciones manuales con funciones y `netlify database init` para añadir una base de datos a un proyecto existente.

Para desarrollo local, ejecuta `npx netlify dev`. El almacenamiento local de Netlify es un entorno de desarrollo separado del almacenamiento de producción.

## Qué incluye

- `netlify/functions/gallery.mjs`: lista y publica fotos en Blobs y registra sus metadatos en Postgres.
- `netlify/functions/photo.mjs`: sirve fotos publicadas desde el almacenamiento compartido.
- `netlify/functions/reactions.mjs`: guarda reacciones con una restricción única por foto, dispositivo y tipo.
- `netlify/functions/_shared/session.mjs`: crea una identidad anónima con cookie firmada por el servidor. La restricción evita repetir una misma reacción en ese navegador. Si se borran cookies o se usa otro dispositivo, la identidad será distinta.
- `netlify/database/migrations/0001_eco_huevo_gallery.sql`: tablas e índices.

La galería vuelve a consultar el servidor cada 8 segundos para reflejar nuevas fotos y reacciones. Las imágenes públicas se limitan a JPG, PNG o WebP de 4 MB.

## Costos

Netlify Database y Blobs están sujetos al plan de Netlify, sus límites y consumo de créditos. Revisa el panel de uso y precios de tu cuenta antes de compartir públicamente la galería. Las páginas estáticas locales (`file://`) no pueden ejecutar estas funciones; se necesita el sitio desplegado en Netlify.
