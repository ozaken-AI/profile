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
        // line_click は隠しコマンドの到達数。ここに入れ忘れると、誰も見つけて
        // いないのか、そもそも数えていないのかが区別できない。
        inListFilter: { values: ['contact_submit', 'contact_cta', 'outbound_click', 'line_click'] },
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

// 指名検索。自分の名前・屋号でどう見られているかを追う。
// 表記ゆれを拾うため、クエリ文字列に対する部分一致で判定する。
const BRAND = /ozaken|おざけん|オザケン|小澤\s*健祐|おざわ\s*けんすけ|ozawa\s*kensuke/i;

/** 表示回数で重みづけした平均掲載順位。単純平均だと、1表示のクエリが同じ重さで効いてしまう。 */
const weightedPosition = (rows) => {
  const imp = rows.reduce((a, r) => a + r.impressions, 0);
  if (!imp) return null;
  return rows.reduce((a, r) => a + r.position * r.impressions, 0) / imp;
};

const arrow = (from, to) => {
  if (from == null || to == null) return '';
  const d = from - to;                      // 順位は小さいほど上
  if (Math.abs(d) < 0.5) return '→ 横ばい';
  return d > 0 ? `↑ ${d.toFixed(1)}上がった` : `↓ ${(-d).toFixed(1)}下がった`;
};

async function gscTrend() {
  const res = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: isoDaysAgo(DAYS + 3),
      endDate: isoDaysAgo(0),
      dimensions: ['date', 'query'],
      rowLimit: 25000,
    },
  });
  const all = res.data.rows || [];
  if (!all.length) {
    console.log(`\n■ Search Console — 推移（直近${DAYS}日）`);
    console.log('  （データなし。反映まで2〜3日かかります）');
    return;
  }

  const byDate = new Map();      // 日 → 全クエリの行
  const brandByDate = new Map(); // 日 → 指名クエリの行
  const byQuery = new Map();     // クエリ → 行
  for (const r of all) {
    const [date, query] = r.keys;
    (byDate.get(date) || byDate.set(date, []).get(date)).push(r);
    if (BRAND.test(query)) {
      (brandByDate.get(date) || brandByDate.set(date, []).get(date)).push(r);
      (byQuery.get(query) || byQuery.set(query, []).get(query)).push({ ...r, date });
    }
  }
  const dates = [...byDate.keys()].sort();

  const daily = (map) => dates.map((d) => {
    const rows = map.get(d) || [];
    const pos = weightedPosition(rows);
    return [
      d,
      rows.reduce((a, r) => a + r.clicks, 0),
      rows.reduce((a, r) => a + r.impressions, 0),
      pos == null ? '-' : pos.toFixed(1),
    ];
  });

  console.log(`\n■ Search Console — 日ごとの推移：サイト全体`);
  console.log(table(daily(byDate), ['日付', 'クリック', '表示回数', '平均掲載順位']));

  console.log(`\n■ Search Console — 日ごとの推移：指名検索だけ（${BRAND.source} に一致）`);
  console.log(table(daily(brandByDate), ['日付', 'クリック', '表示回数', '平均掲載順位']));

  // 日ごとだと表示が数件しかなく振れるので、期間を半分に割って前後で比べる
  const half = Math.ceil(dates.length / 2);
  const first = new Set(dates.slice(0, half));
  const rows = [...byQuery.entries()]
    .map(([q, rs]) => {
      const a = rs.filter((r) => first.has(r.date));
      const b = rs.filter((r) => !first.has(r.date));
      const pa = weightedPosition(a);
      const pb = weightedPosition(b);
      return {
        q,
        imp: rs.reduce((x, r) => x + r.impressions, 0),
        row: [q, rs.reduce((x, r) => x + r.impressions, 0),
              pa == null ? '-' : pa.toFixed(1),
              pb == null ? '-' : pb.toFixed(1),
              arrow(pa, pb)],
      };
    })
    .sort((x, y) => y.imp - x.imp)
    .map((x) => x.row);

  console.log(`\n■ Search Console — 指名クエリ：前半（${dates[0]}〜）と後半（${dates[half]}〜）の比較`);
  console.log(table(rows, ['クエリ', '表示回数', '前半の順位', '後半の順位', '向き']));
  console.log('  ※ 順位は表示回数で重みづけした平均。表示が数件のクエリは大きく振れます。');
  console.log('  ※ Search Console は ozaken.ai の順位しか持っていません。旧サイトの順位は含みません。');
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
    await gaEventDetail('contact_submit', 'result', 'フォーム送信の結果');
    await gaEventDetail('line_click', 'place', 'LINEへの入口（どこから開いたか）');
  },
  queries: gscQueries,
  'search-pages': gscPages,
  trend: gscTrend,
};
RUN.all = async () => {
  await gaPages();
  await gaSources();
  await gaEvents();
  await RUN['events-detail']();
  await gscQueries();
  await gscPages();
  await gscTrend();
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
