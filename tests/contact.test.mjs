import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/contact.js';

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
