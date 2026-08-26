/**
 * Sube el backup de Supabase a Vercel Blob + Neon
 * Ejecutar: node scripts/upload-backup.mjs
 *
 * Requiere en .env.local:
 *   BLOB_READ_WRITE_TOKEN=...
 *   DATABASE_URL=...
 */

import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { createHash } from 'crypto';

const BACKUP_DIR = '/Users/creavity/Downloads/thafylagblxtfwivkbwb/portfolio';

// Load env
const envFile = readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const BLOB_TOKEN = env.BLOB_READ_WRITE_TOKEN;
const DATABASE_URL = env.DATABASE_URL;

if (!BLOB_TOKEN || !DATABASE_URL) {
  console.error('❌ Faltan BLOB_READ_WRITE_TOKEN o DATABASE_URL en .env.local');
  process.exit(1);
}

// Dynamic imports
const { put } = await import('@vercel/blob');
const { neon } = await import('@neondatabase/serverless');
const sql = neon(DATABASE_URL);

// Create tables
console.log('📦 Creando tablas en Neon...');
await sql`
  CREATE TABLE IF NOT EXISTS portfolio_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'general',
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;
await sql`
  CREATE TABLE IF NOT EXISTS portfolio_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    website_url TEXT DEFAULT '',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;
await sql`
  CREATE TABLE IF NOT EXISTS portfolio_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT DEFAULT '',
    photo_url TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;
console.log('✅ Tablas listas');

// Upload a file to Vercel Blob
async function uploadToBlob(filePath, folder) {
  const ext = extname(filePath);
  const filename = `${folder}/${Date.now()}-${createHash('md5').update(filePath).digest('hex').slice(0,8)}${ext}`;
  const buffer = readFileSync(filePath);
  const blob = await put(filename, buffer, { access: 'public', token: BLOB_TOKEN });
  return blob.url;
}

// Upload videos
const videosDir = join(BACKUP_DIR, 'videos');
const thumbsDir = join(BACKUP_DIR, 'thumbnails');
const videoFiles = readdirSync(videosDir).filter(f => !f.startsWith('.'));
const thumbFiles = readdirSync(thumbsDir).filter(f => !f.startsWith('.'));

console.log(`\n🎬 Subiendo ${videoFiles.length} videos...`);
for (let i = 0; i < videoFiles.length; i++) {
  const file = videoFiles[i];
  console.log(`  [${i+1}/${videoFiles.length}] ${file}`);
  const video_url = await uploadToBlob(join(videosDir, file), 'videos');

  // Match thumbnail by index if available
  let thumbnail_url = null;
  if (thumbFiles[i]) {
    thumbnail_url = await uploadToBlob(join(thumbsDir, thumbFiles[i]), 'thumbnails');
  }

  await sql`
    INSERT INTO portfolio_videos (title, video_url, thumbnail_url)
    VALUES (${`Video ${i + 1}`}, ${video_url}, ${thumbnail_url})
  `;
  console.log(`  ✅ Subido: ${video_url.split('/').pop()}`);
}

// Upload brands
const brandsDir = join(BACKUP_DIR, 'brands');
const brandFiles = readdirSync(brandsDir).filter(f => !f.startsWith('.'));
console.log(`\n🏷️  Subiendo ${brandFiles.length} logos de marcas...`);
for (let i = 0; i < brandFiles.length; i++) {
  const file = brandFiles[i];
  console.log(`  [${i+1}/${brandFiles.length}] ${file}`);
  const logo_url = await uploadToBlob(join(brandsDir, file), 'brands');
  await sql`
    INSERT INTO portfolio_brands (name, logo_url)
    VALUES (${`Marca ${i + 1}`}, ${logo_url})
  `;
  console.log(`  ✅ Subido`);
}

console.log('\n🎉 ¡Migración completa!');
console.log('📝 Abre el panel de admin para renombrar los videos y marcas.');
