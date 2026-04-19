#!/usr/bin/env node
/**
 * Lista vídeos Bunny Stream de uma coleção (UUID).
 * Uso: node scripts/bunny-list-collection.mjs 00d0e25c-3430-44f6-9909-503009d19264
 * Requer .env: BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getBunnyStreamConfig,
  listBunnyVideos,
  bunnyStreamEmbedUrl,
} from '../api/lib/bunnyStream.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadDotEnvFiles() {
  const apply = (filePath) => {
    if (!fs.existsSync(filePath)) return;
    const text = fs.readFileSync(filePath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 1) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  };
  apply(path.join(root, '.env'));
  apply(path.join(root, '.env.local'));
}

loadDotEnvFiles();

const collectionId = String(process.argv[2] || process.env.BUNNY_STREAM_COLLECTION_ID || '').trim();
if (!collectionId) {
  console.error('Uso: node scripts/bunny-list-collection.mjs <UUID_DA_COLECAO>');
  console.error('Ou: BUNNY_STREAM_COLLECTION_ID=... no .env');
  process.exit(1);
}

const cfg = getBunnyStreamConfig();
if (!cfg) {
  console.error('Configure BUNNY_STREAM_LIBRARY_ID e BUNNY_STREAM_API_KEY no .env');
  process.exit(1);
}

const data = await listBunnyVideos(cfg, {
  collection: collectionId,
  page: Math.max(1, Number(process.env.BUNNY_LIST_PAGE || 1)),
  itemsPerPage: 100,
});

const items = Array.isArray(data?.items) ? data.items : [];
const summary = items.map((it) => {
  const guid = it?.guid || it?.Guid;
  return {
    title: it?.title,
    guid,
    lengthSeconds: it?.length,
    status: it?.status,
    embedUrl: guid ? bunnyStreamEmbedUrl(cfg.libraryId, guid) : null,
  };
});

console.log(
  JSON.stringify(
    {
      collectionId,
      libraryId: cfg.libraryId,
      totalItems: data?.totalItems,
      currentPage: data?.currentPage,
      itemsPerPage: data?.itemsPerPage,
      count: summary.length,
      videos: summary,
    },
    null,
    2
  )
);
