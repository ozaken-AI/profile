# お問い合わせをメールで受け取る設定

`ozaken.ai/contact/` のフォームは、送信を Cloudflare Pages の関数
（`functions/api/contact.js`）が受けて、メールで転送します。

**設定済み（2026年8月）。** フォームから送ると `kensuke.ozawa@aicx.jp` に届きます。

以下は、キーを入れ直すときや受信先を変えるときの手順です。
`RESEND_API_KEY` が未設定になると、フォームは自動でメーラーの起動に切り替わります
（送信できずに行き止まりにはなりません）。

---

## 1. Resend に登録する

https://resend.com/ で登録します。

**登録に使うメールアドレスは `kensuke.ozawa@aicx.jp` にしてください。**
ドメイン認証をしていない間、Resend は「登録に使ったアドレス宛」にしか送れません。
ここを合わせておけば、ドメイン認証をしなくてもすぐ届きます。

## 2. APIキーを作る

Resend の **API Keys** → **Create API Key**

- Name：`ozaken.ai contact`
- Permission：**Sending access**
- Domain：All domains

作成直後の一度しか表示されないので、その場でコピーします。

## 3. Cloudflare に登録する

Cloudflare ダッシュボード → **Workers & Pages** → `profile` → **Settings** →
**Variables and Secrets**（Environment variables）

**Production** に追加します。

| 変数名 | 値 | 種類 |
|---|---|---|
| `RESEND_API_KEY` | 2で作ったキー（`re_` で始まる） | **Secret** |

**必ず Secret（暗号化）を選んでください。** Text にすると管理画面で誰でも読めます。

保存したら **Deployments** → 最新のデプロイの **Retry deployment**。
環境変数はビルドし直さないと反映されません。

## 4. 確認する

`https://ozaken.ai/contact/` から自分でテスト送信します。

- **「送信しました」と出て、メールが届く** … 完了です
- **メーラーが起動する** … `RESEND_API_KEY` が読めていません。変数名のスペルと、
  Production 側に入っているか、再デプロイしたかを確認してください
- **「送信に失敗しました」と出る** … キーが無効か、Resend 側で宛先が許可されていません。
  1の「登録アドレスを合わせる」を確認してください

---

## 届くメール

```
件名  【ozaken.ai】講演・研修／小澤 健祐
差出人 ozaken.ai <onboarding@resend.dev>
返信先 送信者が入力したメールアドレス
```

**そのまま返信すれば相手に届きます。**

本文にはフォームの全項目と、送信元IP・受信日時が入ります。

---

## 任意：差出人を自分のドメインにする

`onboarding@resend.dev` のままでも動きますが、迷惑メール扱いされにくくするなら
Resend で `ozaken.ai` を認証して、差出人を変えられます。

1. Resend の **Domains** → **Add Domain** → `ozaken.ai`
2. 表示された DNS レコード（SPF / DKIM）を Cloudflare の DNS に追加
3. 認証されたら、Cloudflare に環境変数をもう1つ足す

| 変数名 | 値 |
|---|---|
| `CONTACT_FROM` | `ozaken.ai <noreply@ozaken.ai>` |

ここまでやると、登録アドレス以外にも送れるようになります。
受信先を変えたいときは `CONTACT_TO` を足してください（未設定なら `kensuke.ozawa@aicx.jp`）。

---

## 迷惑メールフォルダに入るとき

`onboarding@resend.dev` は共用の差出人なので、環境によっては迷惑メール判定されます。
一度「迷惑メールではない」を押すか、上のドメイン認証をしてください。
