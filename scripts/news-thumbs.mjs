/**
 * public/news/ の画像から、スラッグ → [幅, 高さ] の対応表を書き出す。
 *
 *   node scripts/news-thumbs.mjs
 *
 * 旧サイト（studio.site）から取り込んだ232件のサムネイルは microCMS の
 * メディアフィールドではなくリポジトリ内の静的ファイルとして持っている。
 * <img> に width/height を出してレイアウトのガタつきを防ぐため、
 * 実ファイルの寸法をここで一度だけ測って JSON にしておく。
 */
import { readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DIR = new URL('../public/news/', import.meta.url);
const OUT = new URL('../src/data/news-thumbs.json', import.meta.url);

const files = (await readdir(DIR))
  .filter((f) => f.endsWith('.webp') && !f.endsWith('-sm.webp'))
  .sort();

const map = {};
for (const file of files) {
  const { width, height } = await sharp(fileURLToPath(new URL(file, DIR))).metadata();
  map[file.replace(/\.webp$/, '')] = [width, height];
}

await writeFile(OUT, JSON.stringify(map, null, 0) + '\n');
console.log(`${files.length}件の寸法を ${fileURLToPath(OUT)} に書き出しました`);
