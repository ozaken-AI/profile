/**
 * microCMS にいま入っているお知らせのIDを一覧する。
 *
 *   MICROCMS_SERVICE_DOMAIN=ozaken MICROCMS_API_KEY=xxxxx node scripts/news-ids.mjs
 *
 * 用途は2つ。
 *   1. 公開後に記事が欠落していないかを、サイトを見ずに確かめる。
 *   2. 旧サイトから引き継いだIDが生きているかを調べる。
 *      docs/legacy/news-import.json のIDと突き合わせ、消えているものを出す。
 *      検索に載ったまま404になっているURLは、ここに出る。
 */
import { readFile } from 'node:fs/promises';

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY || process.env.MICROCMS_WRITE_API_KEY;

if (!DOMAIN || !KEY) {
  console.error('MICROCMS_SERVICE_DOMAIN と MICROCMS_API_KEY を設定してください。');
  process.exit(1);
}

const PAGE = 100;

async function fetchAll() {
  const items = [];
  let total = Infinity;
  while (items.length < total) {
    const url = new URL(`https://${DOMAIN}.microcms.io/api/v1/news`);
    url.searchParams.set('limit', String(PAGE));
    url.searchParams.set('offset', String(items.length));
    url.searchParams.set('orders', '-publishedDate');
    url.searchParams.set('fields', 'id,title,publishedDate');
    const res = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': KEY } });
    if (!res.ok) throw new Error(`microCMS ${res.status} ${await res.text().catch(() => '')}`);
    const page = await res.json();
    total = page.totalCount;
    if (!page.contents?.length) break;
    items.push(...page.contents);
  }
  return items;
}

const live = await fetchAll();
console.log(`■ microCMS にあるお知らせ：${live.length}件\n`);
for (const it of live) {
  console.log(`  ${String(it.publishedDate ?? '').slice(0, 10)}  ${it.id}`);
}

const legacy = JSON.parse(
  await readFile(new URL('../docs/legacy/news-import.json', import.meta.url), 'utf8'),
);
const liveIds = new Set(live.map((i) => i.id));
const missing = legacy.filter((r) => !liveIds.has(r.id));

console.log(`\n■ 旧サイトから取り込んだはずで、いま無いID：${missing.length}件`);
console.log('  該当URL（/news/<id>/）は404になります。\n');
for (const r of missing) {
  console.log(`  ${r.id}  ${r.title}`);
}
