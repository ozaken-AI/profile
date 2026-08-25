#!/usr/bin/env node
/**
 * GA4 と Search Console の数字を、チャットからそのまま読める形で出す。
 *
 * 使い方:
 *   node scripts/analytics-report.mjs all
 *   node scripts/analytics-report.mjs pages --days 28
 *   node scripts/analytics-report.mjs events
 *   node scripts/analytics-report.mjs queries
 *
 * 必要な環境変数（docs/analytics-api.md 参照）:
 *   GOOGLE_SERVICE_ACCOUNT_JSON … サービスアカウントの鍵。JSON文字列そのもの、または base64
 *   GA4_PROPERTY_ID             … 数字のプロパティID（測定ID "G-..." ではない）
 *   SITE_URL                    … Search Console に登録した URL（例: https://ozaken.ai/）
 */
import { google } from 'googleapis';

const DAYS = Number((process.argv.find((a) => a.startsWith('--days=')) || '').split('=')[1]) ||
  Number(process.argv[process.argv.indexOf('--days') + 1]) || 28;
const CMD = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'all';

function need(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`環境変数 ${name} が設定されていません。docs/analytics-api.md の手順で用意してください。`);
    process.exit(1);
  }
  return v;
}

function loadKey() {
  const raw = need('GOOGLE_SERVICE_ACCOUNT_JSON');
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch {
      console.error('GOOGLE_SERVICE_ACCOUNT_JSON を JSON として読めませんでした。鍵ファイルの中身そのまま、または base64 のどちらかで入れてください。');
      process.exit(1);
    }
  }
}

const key = loadKey();
const PROPERTY = need('GA4_PROPERTY_ID').replace(/^properties\//, '');
const SITE_URL = need('SITE_URL');

const auth = new google.auth.JWT({
  email: key.client_email,
  key: key.private_key,
  scopes: [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly',
  ],
});

const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
const webmasters = google.webmasters({ version: 'v3', auth });

const range = () => [{ startDate: `${DAYS}daysAgo`, endDate: 'today' }];

function table(rows, headers) {
  if (!rows.length) return '  （データなし）';
  const widths = headers.map((h, i) => Math.max(String(h).length, ...rows.map((r) => String(r[i]).length)));
  const line = (cols) => '  ' + cols.map((c, i) => String(c).padEnd(widths[i])).join('  ');
  return [line(headers), line(widths.map((w) => '─'.repeat(w))), ...rows.map((r) => line(r))].join('\n');
}

async function runReport(opts) {
  const res = await analyticsdata.properties.runReport({
    property: `properties/${PROPERTY}`,
    requestBody: { dateRanges: range(), ...opts },
  });
  const d = res.data;
  const rows = (d.rows || []).map((r) => [
    ...r.dimensionValues.map((v) => v.value),
    ...r.metricValues.map((v) => v.value),
  ]);
  const headers = [
    ...(d.dimensionHeaders || []).map((h) => h.name),
    ...(d.metricHeaders || []).map((h) => h.name),
  ];
  return { rows, headers };
}

async function gaPages() {
  console.log(`\n■ GA4 — ページ別（直近${DAYS}日）`);
  const { rows, headers } = await runReport({
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }, { name: 'averageSessionDuration' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 20,
  });
  console.log(table(rows, headers));
}

async function gaSources() {
  console.log(`\n■ GA4 — 参照元（直近${DAYS}日）`);
  const { rows, headers } = await runReport({
    dimensions: [{ name: 'sessionSourceMedium' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    orderBys: [{ metric: { metricName: 'sessions' } , desc: true }],
    limit: 15,
  });
  console.log(table(rows, headers));
}

async function gaEvents() {
  console.log(`\n■ GA4 — 送信しているイベント（直近${DAYS}日）`);
  const { rows, headers } = await runReport({
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: ['contact_submit', 'contact_cta', 'line_click', 'outbound_click', 'line_panel_open'] },
      },
    },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
  });
  console.log(table(rows, headers));
}

// イベントパラメータの内訳。GA4側でカスタムディメンションとして登録していないと
// 「Field customEvent:xxx is not a valid dimension」で失敗するので、その場合は案内だけ出す。
async function gaEventDetail(eventName, paramApiName, label) {
  console.log(`\n■ GA4 — ${label}（直近${DAYS}日）`);
  try {
    const { rows, headers } = await runReport({
      dimensions: [{ name: `customEvent:${paramApiName}` }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: eventName } } },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    });
    console.log(table(rows, headers));
  } catch (e) {
    console.log(`  内訳を見るには、GA4の管理画面でカスタムディメンションの登録が要ります。`);
    console.log(`  範囲＝イベント／イベントパラメータ＝${paramApiName}（docs/analytics-api.md 参照）`);
  }
}

async function gscQueries() {
  console.log(`\n■ Search Console — 検索クエリ別（直近${DAYS}日）`);
  const res = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: isoDaysAgo(DAYS + 3), // GSCは直近2〜3日分の反映が遅れるので、その分も含めて取る
      endDate: isoDaysAgo(0),
      dimensions: ['query'],
      rowLimit: 20,
    },
  });
  const rows = (res.data.rows || []).map((r) => [
    r.keys[0], r.clicks, r.impressions, (r.ctr * 100).toFixed(1) + '%', r.position.toFixed(1),
  ]);
  console.log(table(rows, ['クエリ', 'クリック', '表示回数', 'CTR', '平均掲載順位']));
}

async function gscPages() {
  console.log(`\n■ Search Console — ページ別（直近${DAYS}日）`);
  const res = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: isoDaysAgo(DAYS + 3),
      endDate: isoDaysAgo(0),
      dimensions: ['page'],
      rowLimit: 20,
    },
  });
  const rows = (res.data.rows || []).map((r) => [
    r.keys[0], r.clicks, r.impressions, (r.ctr * 100).toFixed(1) + '%', r.position.toFixed(1),
  ]);
  console.log(table(rows, ['ページ', 'クリック', '表示回数', 'CTR', '平均掲載順位']));
}

function isoDaysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const RUN = {
  pages: gaPages,
  sources: gaSources,
  events: gaEvents,
  'events-detail': async () => {
    await gaEventDetail('contact_cta', 'from', 'お問い合わせへの入口（どのページから）');
    await gaEventDetail('line_click', 'place', 'LINEの入口');
    await gaEventDetail('contact_submit', 'result', 'フォーム送信の結果');
  },
  queries: gscQueries,
  'search-pages': gscPages,
};
RUN.all = async () => {
  await gaPages();
  await gaSources();
  await gaEvents();
  await RUN['events-detail']();
  await gscQueries();
  await gscPages();
};

const job = RUN[CMD];
if (!job) {
  console.error(`不明なコマンド: ${CMD}\n使えるもの: ${Object.keys(RUN).join(' / ')}`);
  process.exit(1);
}
try {
  await job();
} catch (e) {
  console.error('取得に失敗しました:', e.errors?.[0]?.message || e.message || e);
  process.exit(1);
}
