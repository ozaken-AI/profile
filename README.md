# ozaken.ai

小澤健祐（おざけん）のポートフォリオサイト。

- **技術構成**: Astro（静的書き出し）+ microCMS + Cloudflare Pages
- **デザイン**: ダーク基調 × 巨大タイポ。墨の地に生成り紙の面を1枚差し込む二層構成
- **書体**: 見出し Shippori Mincho B1 ／ 数字 Archivo ／ 本文 Zen Kaku Gothic New

## 開発

```bash
npm install
npm run dev     # http://localhost:4321
npm run build   # dist/ に書き出し
npm run preview # 書き出したものを確認
```

`.env` に microCMS の値を入れる（`.env.example` を複製）。**未設定でもビルドは通り**、
お知らせが空の状態でサイトが出る。

## ディレクトリ

```
src/
  assets/photos/   写真。ビルド時に WebP と複数解像度へ自動変換される
  components/      Ticker（関与先の流れる帯）、NewsList（お知らせ一覧）
  layouts/Base     HTML の外枠、メタ情報、左レール、スクロール演出
  lib/microcms.ts  お知らせの取得。失敗しても空配列を返しビルドを止めない
  lib/site.ts      文言と定数。数字・肩書き・依頼メニュー・FAQ はここ1か所
  pages/           ルーティング
  styles/global.css デザインシステム
functions/api/     Cloudflare Pages Functions（お問い合わせフォームの受け口）
public/            そのまま配信するファイル
```

**文言を直すときは `src/lib/site.ts` を見る。** 数字・役職・依頼メニュー・依頼の流れ・FAQ は
すべてここに集めてあるので、ページ本体を触らずに直せる。

## Cloudflare Pages の設定

| 項目 | 値 |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `main` |

### 環境変数

| 変数名 | 用途 | 種別 |
|---|---|---|
| `MICROCMS_SERVICE_DOMAIN` | `ozaken` | Text |
| `MICROCMS_API_KEY` | microCMS の APIキー（GETのみ） | **Secret** |
| `RESEND_API_KEY` | お問い合わせフォームの送信 | **Secret** |
| `CONTACT_TO` | `kensuke.ozawa@aicx.jp` | Text |
| `CONTACT_FROM` | Resend で認証済みドメインのアドレス | Text |

`NODE_VERSION` は `22` を指定しておくと安定する。

## お知らせの更新

microCMS の管理画面から投稿する。Webhook で Cloudflare Pages のデプロイが走り、
数十秒でサイトに反映される。設定手順は `docs/microcms-setup.md`。

登壇の報告もここに投稿する。カテゴリ「登壇」で絞れば実績アーカイブとして読める。

## 画像

`src/assets/photos/` に置く。**元データのまま置けばよい。**
ビルド時に WebP へ変換し、表示サイズに応じた複数解像度を生成する。
自分でリサイズすると画質が落ちるだけなので、縮小しないこと。

どの写真をどこで使っているかは `src/assets/photos/README.md`。

## 実装状況

- [x] トップページ
- [ ] `/news/` お知らせ一覧、`/news/[id]/` 個別記事
- [ ] `/speaking/` 講演依頼（SEOの主戦場）
- [ ] `/about/` 詳細プロフィール
- [ ] `/press/` プレスキット
- [ ] `/contact/` お問い合わせフォーム

トップページからこれらへのリンクは既に張ってあるため、**下層ページを作るまでは404になる。**
本番ブランチへ反映するのは、下層ページが揃ってからにすること。
