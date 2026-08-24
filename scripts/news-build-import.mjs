/**
 * 旧サイト（ozaken-ai.studio.site）から取り出した232件のお知らせを、
 * microCMS に取り込める形に整える。
 *
 *   node scripts/news-build-import.mjs
 *
 * 入力  docs/legacy/cms_content_20260824.json
 * 出力  docs/legacy/news-import.json … 管理APIで流し込む用（scripts/news-import.mjs が読む）
 *       docs/legacy/news-import.csv  … 管理画面のインポート機能に読ませる用
 *
 * サムネイルは持たせない。一覧は日付・カテゴリ・タイトルだけの行で出す。
 */
import { readFile, writeFile } from 'node:fs/promises';

const SRC = new URL('../docs/legacy/cms_content_20260824.json', import.meta.url);
const OUT_JSON = new URL('../docs/legacy/news-import.json', import.meta.url);
const OUT_CSV = new URL('../docs/legacy/news-import.csv', import.meta.url);
const SCHEMA = new URL('../docs/microcms-news-schema.json', import.meta.url);

/** シェアボタンのリンク。本文の関連リンクには出さない。 */
const SHARE_HOSTS = /^https?:\/\/(www\.)?(twitter\.com|x\.com|facebook\.com|linkedin\.com|line\.me)\//;

/**
 * カテゴリの割り当て。タイトルの語だけで決める。
 * 「〜イベントに登壇しました」のように語が重なるので、判定の順番に意味がある。
 */
const RULES = [
  // 「基調講演の内容が掲載されました」のように、登壇そのものではなく
  // 記事になったことの報告は先にメディアへ寄せる。
  ['メディア', /(内容|様子|模様|レポート|記事|全文)[^。]{0,8}(掲載|公開|紹介)/],
  ['登壇', /登壇|講演|公演|基調|セミナー|ウェビナー|モデレータ|モデレーター|パネル|司会|ワークショップ|研修|勉強会|カンファレンス|サミット|フォーラム|トークセッション/],
  ['メディア', /出演|掲載|取材|インタビュー|寄稿|対談|連載|番組|MCを務め|コメント|紹介いただ|取り上げ|オウンドメディア|テレビ|ラジオ|新聞|雑誌|記事|Podcast|ポッドキャスト|YouTube/],
  ['リリース', /刊行|出版|発売|書籍|就任|設立|参画|立ち上げ|リリース|提供開始|公開しました|発表|フェロー|委員|理事|アドバイザー|顧問/],
  ['イベント', /主催|開催|ご招待|お会いしました|お話しさせて|訪問|視察/],
];

function categoryOf(title) {
  for (const [cat, re] of RULES) if (re.test(title)) return cat;
  // 大半が登壇報告なので、判断がつかないものは登壇に寄せる。
  return '登壇';
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ESC[c]);

/**
 * 段落配列 → richEditorV2 に入る HTML。
 * 1つの段落のなかに空行が入っていることがあるので、そこでも段落を割る。
 * 残った改行は <br> にする（CSVに生の改行を残さないためでもある）。
 */
function toHtml(paragraphs, links) {
  const body = paragraphs
    .flatMap((t) => t.replace(/\r\n?/g, '\n').split(/\n{2,}/))
    .map((t) => t.replace(/＝\s*$/, '').trim())
    .filter(Boolean)
    .map((t) => `<p>${esc(t).replace(/\n/g, '<br>')}</p>`);

  if (links.length) {
    body.push('<h3>関連リンク</h3>');
    body.push(
      '<ul>' +
        links.map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u)}</a></li>`).join('') +
        '</ul>'
    );
  }
  return body.join('');
}

/** 抜粋。本文の1段落目を、文の切れ目で110字くらいに詰める。 */
function toExcerpt(paragraphs) {
  const first = (paragraphs[0] ?? '').replace(/\s+/g, ' ').trim();
  if (first.length <= 110) return first;
  const cut = first.slice(0, 110);
  const stop = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('！'), cut.lastIndexOf('？'));
  return stop > 40 ? cut.slice(0, stop + 1) : cut + '…';
}

/**
 * 2026/7/29 → 2026-07-29T03:00:00.000Z
 * 日本時間の正午にしておくと、UTCで見ても日本時間で見ても日付がずれない。
 */
function toIso(raw) {
  const m = String(raw).match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) throw new Error(`日付の形式が想定外です: ${raw}`);
  const [, y, mo, d] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T03:00:00.000Z`;
}

/**
 * microCMS のコンテンツIDに直す。
 * 大文字が混じっていると弾かれるので小文字に寄せ、
 * 先頭は英字、3文字以上になるようにそろえる。
 */
function toId(slug) {
  let id = String(slug)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '');
  if (!id) throw new Error(`IDに変換できません: ${slug}`);
  if (!/^[a-z]/.test(id)) id = `n${id}`;
  if (id.length < 3) id = `${id}-1`;
  return id;
}

const { posts } = JSON.parse(await readFile(SRC, 'utf8'));

// 小文字にそろえると `AIdiver1` と `aidiver1` のように衝突するものが出る。
// 後から出てきたほうに連番を足して逃がす。
const seen = new Set();
const records = posts.map((p) => {
  const base = toId(p.slug);
  let id = base;
  for (let n = 2; seen.has(id); n++) id = `${base}-${n}`;
  seen.add(id);

  const links = (p.external_links ?? []).filter((u) => /^https?:\/\//.test(u) && !SHARE_HOSTS.test(u));

  return {
    id,
    title: p.title.trim(),
    category: [categoryOf(p.title)],
    publishedDate: toIso(p.date),
    excerpt: toExcerpt(p.body),
    body: toHtml(p.body, links),
  };
});

// 掲載日の新しい順に揃えておく。
records.sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));

await writeFile(OUT_JSON, JSON.stringify(records, null, 2) + '\n');

/* --- CSV ---
 * microCMS のインポートは「スキーマの全フィールド＋コンテンツID」がそろっていないと
 * 列数の不一致で弾かれる。使わない欄も空で並べるため、列はスキーマ定義から組み立てる。
 */
const schema = JSON.parse(await readFile(SCHEMA, 'utf8'));
const COLUMNS = ['id', ...schema.apiFields.map((f) => f.fieldId)];

const cell = (v) => `"${String(Array.isArray(v) ? v[0] : (v ?? '')).replace(/"/g, '""')}"`;
const csv =
  '﻿' + // Excel で開いたときに文字化けしないよう BOM を付ける
  [COLUMNS.join(','), ...records.map((r) => COLUMNS.map((c) => cell(r[c])).join(','))].join('\r\n') +
  '\r\n';
await writeFile(OUT_CSV, csv);

const counts = {};
for (const r of records) counts[r.category[0]] = (counts[r.category[0]] ?? 0) + 1;
console.log(`${records.length}件を書き出しました`);
console.log(`CSVの列（${COLUMNS.length}）: ${COLUMNS.join(', ')}`);
console.log(counts);
