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

**チャットから投稿できます。** 内容を伝えると GitHub Actions が microCMS に登録し、
Webhook 経由でサイトに反映されます。手順は `docs/news-post.md`。

GitHub の Actions タブ →「お知らせを投稿」から自分で実行することもできます。

microCMS の管理画面から直接書いても構わない。どちらの場合も Webhook で
Cloudflare Pages のデプロイが走り、1〜2分でサイトに反映される。
CMS側の設定手順は `docs/microcms-setup.md`。

登壇の報告もここに投稿する。カテゴリ「登壇」で絞れば実績アーカイブとして読める。

## 画像

`src/assets/photos/` に置く。**元データのまま置けばよい。**
ビルド時に WebP へ変換し、表示サイズに応じた複数解像度を生成する。
自分でリサイズすると画質が落ちるだけなので、縮小しないこと。

どの写真をどこで使っているかは `src/assets/photos/README.md`。

## ページ構成

| URL | 内容 | 狙い |
|---|---|---|
| `/` | トップ | 指名検索（「小澤健祐」「おざけん AI」）の受け皿 |
| `/speaking/` | 講演依頼・テーマ一覧・FAQ | **SEOの主戦場**（「生成AI 講演」「AIエージェント 研修」） |
| `/news/` | お知らせ一覧（カテゴリ絞り込み） | 更新の受け皿 |
| `/news/[id]/` | 個別記事 | **ロングテールの本体**。登壇報告が積み上がる |
| `/about/` | プロフィール・経歴・役職 | 人物の信頼 |
| `/press/` | プレスキット | 主催者が告知を作るための素材 |
| `/contact/` | お問い合わせフォーム | 依頼の受け口 |

`/news/[id]/` は microCMS の記事数だけ生成される。CMSが空・未設定なら生成されない
（ビルドは通る）。

## プレスキット

`public/press/` に配布用の高解像度写真とプロフィールのテキストを置いてある。
プロフィール文の本体は `src/lib/site.ts` の `BIO`。**テキストファイルはそこから生成した
コピーなので、文面を変えたら `public/press/ozaken-profile.txt` も更新すること。**
