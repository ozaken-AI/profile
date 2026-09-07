# ozaken.ai

小澤健祐（おざけん）の公式プロフィールサイト。Astroの静的書き出し、microCMSのお知らせ、Cloudflare PagesとPages Functionsで運用する。

**AIが引き継ぐときは [AGENTS.md](AGENTS.md) から読む。** 作業手順と決定事項をリポジトリ内に残し、チャット履歴に依存させない。

## 運用の入口

| やりたいこと | 読む文書 |
|---|---|
| 開発・検証・公開・トラブル対応 | [運用ガイド](docs/operations.md) |
| 資料・PDF・ワークシートの作成 | [資料作成ガイド](docs/materials.md) |
| プロフィール・実績・SEO・告知用素材 | [文章・素材の運用](docs/content-and-assets.md) |
| 見た目・アニメーション・隠しLINE | [デザインと動き](docs/design-and-motion.md) |
| お知らせの投稿・訂正 | [投稿手順](docs/news-post.md) |
| CMSの設定・過去記事の移行 | [CMS設定](docs/microcms-setup.md)、[移行の記録](docs/news-import.md) |
| お問い合わせのメール | [メール設定](docs/contact-email.md) |
| アクセス・検索の分析 | [解析設定](docs/analytics.md)、[解析API](docs/analytics-api.md) |
| これまでの判断と理由 | [決定事項](docs/decisions.md) |

## サイトとリポジトリ

2026-09-07確認。開始時に設定を照合する。

| | プロフィールサイト（このリポジトリ） | 資料サイト |
|---|---|---|
| URL | [ozaken.ai](https://ozaken.ai/) | [content.ozaken.ai](https://content.ozaken.ai/) |
| GitHub | [ozaken-AI/profile](https://github.com/ozaken-AI/profile) | [ozaken-AI/ozaken-materials](https://github.com/ozaken-AI/ozaken-materials) |
| 本番ブランチ | **`claude/ozaken-portfolio-site-a0aggr`** | **`main`** |
| Cloudflare Pages | `profile` | `ozaken-materials` |
| ビルド | `npm run build` → `dist` | 資料側READMEを参照（静的HTML） |

プロフィールサイトの本番は `main` ではない。講演資料の作成・配信も別の処理である。

## 開発

Node.js 22を使用する。リポジトリのルートで実行する。

```bash
npm ci
npm run dev -- --host 127.0.0.1
npm run build
npm run preview -- --host 127.0.0.1
```

`.env.example` にmicroCMSの変数名がある。未設定ならお知らせは空でビルドされる。**本番で空になってよいという意味ではない。** 設定・検証・公開の詳細は[運用ガイド](docs/operations.md)へ。

## 主な編集場所

| 場所 | 内容 |
|---|---|
| `src/lib/site.ts` | 本人情報、役職、実績、著書、依頼メニュー、FAQ、プロフィール文 |
| `src/lib/microcms.ts` | 掲載日の降順でお知らせを取得。未設定・失敗は空配列 |
| `src/pages/` | 各ページの構成・説明文・ルーティング |
| `src/components/` | 共通表示、開幕演出、ヒーロー粒子、本文の動き |
| `src/layouts/Base.astro` | メタ情報、構造化データ、解析、共通の表示処理 |
| `src/styles/global.css` | 色・書体・レイアウト・共通演出 |
| `src/assets/photos/` | サイト用写真の原本。Astro Imageで変換 |
| `public/press/` | 顔写真・ロゴの配布ファイル |
| `scripts/ogp/` | OGP画像の生成元と手順 |
| `functions/api/contact.js` | 問い合わせの受信・Resendへの転送 |
| `scripts/`、`.github/workflows/` | CMS投稿・移行、解析レポート |

すべての文言が定数に入っているわけではない。修正時は `site.ts` に加え、ページ・コンポーネント・OGP元データの同じ表現も検索する。

## 主なページ

`/`（活動全体）、`/speaking/`（依頼概要）、`/speaking/keynote/`・`training/`・`partner/`・`advisory/`（依頼の4形式）、`/news/`、`/news/[id]/`、`/about/`、`/press/`、`/contact/`、`/privacy/`。

トップのお知らせはヒーロー直後に最新8件。`/news/` は取得した記事の一覧とカテゴリ絞り込み。プレスキットのプロフィール文は `BIO` を画面からコピーする構成で、現在 `public/press/ozaken-profile.txt` は存在しない。
