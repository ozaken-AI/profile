/**
 * お知らせを1件、microCMS に登録する。
 *
 * GitHub Actions の「お知らせを投稿」から呼ばれる想定。
 * 入力はすべて環境変数で受け取る（コマンドラインに載せると、
 * 本文に含まれる記号でシェルが誤動作するため）。
 *
 * 必要な環境変数
 *   MICROCMS_SERVICE_DOMAIN … 既定は ozaken
 *   MICROCMS_WRITE_API_KEY  … news の PUT を許可したキー
 *   IN_TITLE / IN_CATEGORY / IN_BODY … 必須
 *   IN_DATE / IN_EXCERPT / IN_EVENT / IN_URL / IN_ID / IN_STATUS … 任意
 *   DRY_RUN … 入れると、送らずに内容だけ表示する
 */

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN || 'ozaken';
const KEY = process.env.MICROCMS_WRITE_API_KEY;

const CATEGORIES = ['登壇', 'メディア', 'イベント', 'リリース'];

const input = (name) => (process.env[name] ?? '').trim();

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

if (!KEY) fail('MICROCMS_WRITE_API_KEY が設定されていません。リポジトリの Secrets に登録してください。');

const title = input('IN_TITLE');
const category = input('IN_CATEGORY');
const bodyText = process.env.IN_BODY ?? '';

if (!title) fail('タイトルが空です。');
if (!CATEGORIES.includes(category)) fail(`カテゴリは ${CATEGORIES.join(' / ')} のいずれかにしてください（受け取った値：${category}）`);
if (!bodyText.trim()) fail('本文が空です。');

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ESC[c]);

/** 空行で段落を割り、残った改行は <br> にする。 */
function toHtml(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => `<p>${esc(t).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** 抜粋。本文の書き出しを、文の切れ目で110字くらいに詰める。 */
function toExcerpt(text) {
  const first = text.replace(/\r\n?/g, '\n').split(/\n{2,}/)[0].replace(/\s+/g, ' ').trim();
  if (first.length <= 110) return first;
  const cut = first.slice(0, 110);
  const stop = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('！'), cut.lastIndexOf('？'));
  return stop > 40 ? cut.slice(0, stop + 1) : cut + '…';
}

/** 日本時間の今日。Actions のランナーはUTCなので9時間ぶん寄せる。 */
function todayInJapan() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

/**
 * YYYY-MM-DD → 2026-07-29T03:00:00.000Z
 * 日本時間の正午にしておくと、UTCで見ても日本時間で見ても日付がずれない。
 */
function toIso(ymd) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) fail(`掲載日は YYYY-MM-DD で入れてください（受け取った値：${ymd}）`);
  return `${ymd}T03:00:00.000Z`;
}

/** microCMS のコンテンツID。小文字の英数字と - _ のみ、先頭は英字。 */
function toId(raw, ymd) {
  if (!raw) {
    const suffix = Math.random().toString(36).slice(2, 6);
    return `news-${ymd.replace(/-/g, '')}-${suffix}`;
  }
  let id = raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '');
  if (!id) fail(`記事IDに使える文字がありません（受け取った値：${raw}）`);
  if (!/^[a-z]/.test(id)) id = `n${id}`;
  if (id.length < 3) id = `${id}-1`;
  return id;
}

const date = input('IN_DATE') || todayInJapan();
const publishedDate = toIso(date);
const id = toId(input('IN_ID'), date);
const draft = input('IN_STATUS') === '下書き';

const fields = {
  title,
  category: [category],
  publishedDate,
  excerpt: input('IN_EXCERPT') || toExcerpt(bodyText),
  body: toHtml(bodyText),
};
const eventName = input('IN_EVENT');
const externalUrl = input('IN_URL');
if (eventName) fields.eventName = eventName;
if (externalUrl) fields.externalUrl = externalUrl;

const url = new URL(`https://${DOMAIN}.microcms.io/api/v1/news/${id}`);
if (draft) url.searchParams.set('status', 'draft');

// 送らずに、送る内容だけ見たいとき
if (process.env.DRY_RUN) {
  console.log(`PUT ${url}`);
  console.log(JSON.stringify(fields, null, 2));
  process.exit(0);
}

const res = await fetch(url, {
  method: 'PUT',
  headers: { 'X-MICROCMS-API-KEY': KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify(fields),
});

if (!res.ok) {
  fail(`microCMS が受け付けませんでした（${res.status}）: ${await res.text().catch(() => '')}`);
}

const summary = [
  `## ${draft ? '下書きとして保存しました' : '公開しました'}`,
  '',
  `- **タイトル**：${title}`,
  `- **カテゴリ**：${category}`,
  `- **掲載日**：${date}`,
  `- **記事ID**：\`${id}\``,
  externalUrl ? `- **外部リンク**：${externalUrl}` : `- **URL**：https://ozaken.ai/news/${id}/`,
  '',
  draft
    ? 'microCMS で内容を確認して、公開ボタンを押してください。'
    : 'Webhook が動いていれば、1〜2分でサイトに出ます。',
].join('\n');

console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import('node:fs/promises');
  await appendFile(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
}
