/**
 * docs/legacy/news-import.json を microCMS に流し込む。
 *
 *   MICROCMS_SERVICE_DOMAIN=ozaken \
 *   MICROCMS_WRITE_API_KEY=xxxxx \
 *   node scripts/news-import.mjs           # 実行
 *   node scripts/news-import.mjs --dry-run # 送る内容だけ表示
 *
 * PUT /api/v1/news/{id} なので、同じIDに対して何度実行しても結果は同じ。
 * 途中で止まっても、そのまま実行し直せばよい。
 *
 * APIキーは microCMS の「APIキー」画面で news の PUT を許可したものを使う。
 * 公開ページで使っている読み取り専用のキーでは書き込めない。
 */
import { readFile } from 'node:fs/promises';

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_WRITE_API_KEY || process.env.MICROCMS_API_KEY;
const DRY = process.argv.includes('--dry-run');

if (!DOMAIN || !KEY) {
  console.error('MICROCMS_SERVICE_DOMAIN と MICROCMS_WRITE_API_KEY を設定してください。');
  process.exit(1);
}

const records = JSON.parse(await readFile(new URL('../docs/legacy/news-import.json', import.meta.url), 'utf8'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function put(record, attempt = 1) {
  const { id, ...fields } = record;
  const res = await fetch(`https://${DOMAIN}.microcms.io/api/v1/news/${id}`, {
    method: 'PUT',
    headers: { 'X-MICROCMS-API-KEY': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (res.ok) return;

  // 429（レート制限）と5xxは間隔を空けて数回まで試す。
  if ((res.status === 429 || res.status >= 500) && attempt < 4) {
    await sleep(1000 * 2 ** attempt);
    return put(record, attempt + 1);
  }
  throw new Error(`${id}: ${res.status} ${await res.text().catch(() => '')}`);
}

let done = 0;
const failed = [];

for (const record of records) {
  if (DRY) {
    console.log(`PUT /api/v1/news/${record.id}  ${record.publishedDate.slice(0, 10)}  ${record.category[0]}  ${record.title}`);
    done++;
    continue;
  }
  try {
    await put(record);
    done++;
  } catch (e) {
    failed.push(e.message);
  }
  if (done % 20 === 0) process.stdout.write(`  ${done}/${records.length}\n`);
  // 書き込みAPIには回数制限がある。詰めすぎない。
  await sleep(250);
}

console.log(`${done}/${records.length}件を${DRY ? '確認' : '登録'}しました`);
if (failed.length) {
  console.error(`失敗 ${failed.length}件:`);
  failed.forEach((m) => console.error('  ' + m));
  process.exit(1);
}
