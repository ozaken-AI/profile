/**
 * 旧サイトのサムネイルを取り込み直す。
 *
 *   node scripts/news-thumbs-fetch.mjs
 *
 * 旧サイトのCDNは、URL末尾の _middle を外すと元の解像度の画像を返す。
 * 表示用に幅1600の webp と、一覧用に幅560の webp を public/news/ に置く。
 * （元が小さい画像は拡大しない）
 *
 * 一度実行すれば結果はリポジトリに入るので、普段は動かす必要はない。
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const SRC = new URL('../docs/legacy/cms_content_20260824.json', import.meta.url);
const OUT = new URL('../public/news/', import.meta.url);

const MAIN_WIDTH = 1600;
const SMALL_WIDTH = 560;

/** 末尾の _middle / _small を外すと元データが取れる。無いURLもある。 */
const fullSizeUrl = (url) => url.replace(/_(middle|small|large)\.webp$/, '.webp');

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const { posts } = JSON.parse(await readFile(SRC, 'utf8'));
await mkdir(OUT, { recursive: true });

let ok = 0;
const failed = [];

for (const post of posts) {
  const id = post.slug.replace(/[^A-Za-z0-9_-]/g, '-');
  let buf;
  try {
    buf = await get(fullSizeUrl(post.thumbnail));
  } catch {
    // 元サイズが無いものは配信用のURLをそのまま使う。
    try {
      buf = await get(post.thumbnail);
    } catch (e) {
      failed.push(`${id}: ${e.message}`);
      continue;
    }
  }

  const base = sharp(buf);
  await base
    .clone()
    .resize({ width: MAIN_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(new URL(`${id}.webp`, OUT).pathname);
  await base
    .clone()
    .resize({ width: SMALL_WIDTH, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(new URL(`${id}-sm.webp`, OUT).pathname);

  ok++;
  if (ok % 25 === 0) console.log(`  ${ok}/${posts.length}`);
}

console.log(`${ok}/${posts.length}件を書き出しました`);
if (failed.length) {
  console.error(`取得できなかったもの ${failed.length}件:`);
  failed.forEach((m) => console.error('  ' + m));
}
