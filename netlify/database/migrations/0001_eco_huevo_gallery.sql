CREATE TABLE IF NOT EXISTS eco_huevo_photos (
  id UUID PRIMARY KEY,
  device_id UUID NOT NULL,
  author_name VARCHAR(50) NOT NULL DEFAULT 'Estudiante',
  image_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS eco_huevo_photos_created_idx ON eco_huevo_photos (created_at DESC);
CREATE TABLE IF NOT EXISTS eco_huevo_reactions (
  photo_id UUID NOT NULL REFERENCES eco_huevo_photos(id) ON DELETE CASCADE,
  device_id UUID NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('like', 'excellent', 'eco')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (photo_id, device_id, reaction)
);
