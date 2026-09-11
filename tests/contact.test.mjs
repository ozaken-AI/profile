import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/contact.js';
import { contactSelection } from '../src/lib/contact.js';

const valid = { name: 'フォーム確認', email: 'test@example.com', message: '再送してもこの本文を保持する', elapsed: 3000 };
function submit(payload, env = { RESEND_API_KEY: 'test-only' }) {
  return onRequestPost({
    request: new Request('https://example.com/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    }), env,
  });
}

test('3秒未満の送信は成功にせず、3秒後に同じ内容で再送できる', async t => {
  const sent = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    sent.push(JSON.parse(options.body));
    return new Response('{"id":"test-only"}', { status: 200 });
  });
  const early = await submit({ ...valid, elapsed: 1500 });
  assert.equal(early.status, 429);
  const error = await early.json();
  assert.equal(error.ok, false);
  assert.match(error.error, /もう一度/);
  assert.equal(sent.length, 0);

  const retry = await submit(valid);
  assert.equal(retry.status, 200);
  assert.deepEqual(await retry.json(), { ok: true });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].reply_to, valid.email);
  assert.ok(sent[0].text.includes(valid.message));
});

test('メール配信サービスが失敗したら成功を返さない', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('test failure', { status: 503 }));
  t.mock.method(console, 'error', () => {});
  const response = await submit(valid);
  assert.equal(response.status, 502);
  assert.equal((await response.json()).ok, false);
});

test('不正な形式や入力不足を送信しない', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', () => assert.fail('外部送信しない'));
  for (const payload of [null, [], 'invalid', { ...valid, name: '' }, { ...valid, email: 'bad' }, { ...valid, message: '' }]) {
    const response = await submit(payload);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).ok, false);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('未設定の場合はメーラーへの切替を返す', async () => {
  const response = await submit(valid, {});
  assert.deepEqual(await response.json(), { ok: false, configured: false });
});

test('長い本文を切り捨てて送らず、上限の本文はそのまま送る', async t => {
  const sent = [];
  t.mock.method(globalThis, 'fetch', async (_, options) => {
    sent.push(JSON.parse(options.body));
    return new Response('{"id":"test-only"}', { status: 200 });
  });
  const over = await submit({ ...valid, message: 'あ'.repeat(8001) });
  assert.equal(over.status, 400);
  assert.equal((await over.json()).field, 'message');
  assert.equal(sent.length, 0);
  const exact = await submit({ ...valid, message: 'あ'.repeat(8000) });
  assert.equal(exact.status, 200);
  assert.ok(sent[0].text.includes('あ'.repeat(8000)));
});

test('任意欄も上限を超えると外部送信しない', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('外部送信しない'));
  for (const [field, max] of [['company', 200], ['tel', 60], ['topic', 100], ['date', 200]]) {
    const response = await submit({ ...valid, [field]: 'a'.repeat(max + 1) });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).field, field);
  }
});

test('顧問の受信メールは開催人数ではなく期間と関与範囲で案内する', async t => {
  let sent;
  t.mock.method(globalThis, 'fetch', async (_, options) => {
    sent = JSON.parse(options.body);
    return new Response('{"id":"test-only"}', { status: 200 });
  });
  await submit({ ...valid, kind: 'アドバイザリー・顧問', date: '11月から', audience: '経営陣', topic: 'gemini' });
  assert.match(sent.text, /開始希望時期・想定期間：11月から/);
  assert.match(sent.text, /相談する方・対象部門・関与範囲：経営陣/);
  assert.match(sent.subject, /顧問・アドバイザー/);
  assert.doesNotMatch(sent.text, /Gemini/);
});

test('旧伴走支援の問い合わせは統合後も組織への浸透という意図を保持する', async t => {
  const sent = [];
  t.mock.method(globalThis, 'fetch', async (_, options) => {
    sent.push(JSON.parse(options.body));
    return new Response('{"id":"test-only"}', { status: 200 });
  });
  for (const kind of ['partner', '導入プロジェクトの伴走支援']) {
    const selection = contactSelection(kind, null);
    assert.equal(selection.kind.id, 'advisory');
    assert.equal(selection.topic.id, 'ai-adoption');
    const response = await submit({ ...valid, kind, audience: '全社の推進担当' });
    assert.equal(response.status, 200);
    assert.match(sent.at(-1).text, /ご依頼の種類：顧問・アドバイザー/);
    assert.match(sent.at(-1).text, /相談したい内容：組織への浸透・定着/);
    assert.match(sent.at(-1).text, /全社の推進担当/);
    assert.match(sent.at(-1).subject, /顧問・アドバイザー/);
  }
});

test('顧問の相談内容は許可された種別にだけ引き継ぐ', () => {
  for (const topic of ['ai-strategy', 'ai-adoption', 'other-advisory']) {
    assert.equal(contactSelection('advisory', topic).topic.id, topic);
    assert.equal(contactSelection('training', topic).topic, undefined);
    assert.equal(contactSelection('unknown', topic).topic, undefined);
  }
  assert.equal(contactSelection('アドバイザリー・顧問', 'ai-strategy').kind.id, 'advisory');
  assert.equal(contactSelection('advisory', 'gemini').topic, undefined);
});

test('研修の選択内容が読みやすい名称でメールに残る', async t => {
  let sent;
  t.mock.method(globalThis, 'fetch', async (_, options) => {
    sent = JSON.parse(options.body);
    return new Response('{"id":"test-only"}', { status: 200 });
  });
  await submit({ ...valid, kind: '社内研修・ワークショップ', topic: 'copilot' });
  assert.match(sent.text, /Microsoft 365 Copilot活用研修/);
  assert.match(sent.text, /研修内容：Microsoft 365 Copilot活用研修/);
});

test('講演・研修のその他の希望が相談本文と一緒に受信メールへ届く', async t => {
  const sent = [];
  t.mock.method(globalThis, 'fetch', async (_, options) => {
    sent.push(JSON.parse(options.body));
    return new Response('{"id":"test-only"}', { status: 200 });
  });
  for (const [kind, topic, label] of [
    ['講演・登壇', 'other-keynote', '講演テーマ'],
    ['社内研修・ワークショップ', 'other-training', '研修内容'],
  ]) {
    const message = '掲載のテーマ以外で、開催趣旨に合わせて相談したい';
    const response = await submit({ ...valid, kind, topic, message });
    assert.equal(response.status, 200);
    assert.ok(sent.at(-1).text.includes(`${label}：その他`));
    assert.ok(sent.at(-1).text.includes(message));
    assert.doesNotMatch(sent.at(-1).text, /テーマ・研修/);
  }
});
