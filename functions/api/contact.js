/**
 * お問い合わせフォームの受け口（Cloudflare Pages Function）
 *
 * POST /api/contact
 *
 * 必要な環境変数（Cloudflare Pages → Settings → Variables and Secrets）
 *   RESEND_API_KEY  … Resend の API キー。Secret で入れる。
 *                     未設定ならフォームはメーラー起動に切り替わる
 *   CONTACT_TO      … 受信アドレス（未設定なら kensuke.ozawa@aicx.jp）
 *   CONTACT_FROM    … 送信元（未設定なら onboarding@resend.dev）
 *                     ドメイン認証をしていない間、Resend は Resend の登録アドレス宛にしか
 *                     送れない。受信先と登録アドレスを合わせておけば、認証なしでも届く。
 *
 * 手順は docs/contact-email.md にある。
 */

const DEFAULT_TO = 'kensuke.ozawa@aicx.jp';
const DEFAULT_FROM = 'ozaken.ai <onboarding@resend.dev>';

const FIELDS = [
  ['name', 'お名前', 200],
  ['company', '会社・団体名', 200],
  ['email', 'メールアドレス', 200],
  ['tel', '電話番号', 60],
  ['kind', 'ご依頼の種類', 100],
  ['date', '開催希望日・時期', 200],
  ['audience', '対象者・想定人数', 200],
  ['message', 'ご相談内容', 8000],
];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// 制御文字（改行・タブを除く）。件名や差出人に混ぜられるヘッダインジェクションを潰す。
const CTRL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

/** 1行フィールド用：制御文字と改行を落として長さを詰める。 */
function cleanLine(value, max) {
  if (typeof value !== 'string') return '';
  return value.replace(CTRL_RE, '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

/** 本文用：改行は残しつつ制御文字だけ落とす。 */
function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  return value.replace(CTRL_RE, '').replace(/\r\n?/g, '\n').trim().slice(0, max);
}

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'リクエストの形式が正しくありません。' }, 400);
  }

  // ハニーポット：人間には見えない欄が埋まっていれば bot。
  // 成功を返して、弾いたことを気づかせない。
  if (cleanLine(payload.website, 200)) {
    return json({ ok: true });
  }

  // フォームを開いてから3秒未満での送信も bot とみなす。
  const elapsed = Number(payload.elapsed);
  if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < 3000) {
    return json({ ok: true });
  }

  const data = {};
  for (const [key, , max] of FIELDS) {
    data[key] = key === 'message' ? cleanText(payload[key], max) : cleanLine(payload[key], max);
  }

  if (!data.name) return json({ ok: false, error: 'お名前を入力してください。' }, 400);
  if (!EMAIL_RE.test(data.email)) {
    return json({ ok: false, error: 'メールアドレスの形式を確認してください。' }, 400);
  }
  if (!data.message) return json({ ok: false, error: 'ご相談内容を入力してください。' }, 400);

  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    // 未設定。クライアント側でメーラー起動にフォールバックさせる。
    return json({ ok: false, configured: false }, 200);
  }

  const body = FIELDS.map(([key, label]) => `${label}：${data[key] || '（未入力）'}`).join('\n');

  const meta = [
    '',
    '--',
    `送信元IP: ${request.headers.get('CF-Connecting-IP') || '不明'}`,
    `受信日時: ${new Date().toISOString()}`,
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM || DEFAULT_FROM,
      to: [env.CONTACT_TO || DEFAULT_TO],
      reply_to: data.email,
      subject: `【ozaken.ai】${data.kind || 'お問い合わせ'}／${data.name}`,
      text: body + meta,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('resend failed', res.status, detail);
    return json({ ok: false, error: '送信に失敗しました。時間をおいて再度お試しください。' }, 502);
  }

  return json({ ok: true });
}

/** POST 以外は受け付けない。 */
export async function onRequestGet() {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
