# サイト運用ガイド

最終確認：2026-09-11。対象は `ozaken-AI/profile`。資料の運用は[資料作成ガイド](materials.md)から別リポジトリへ進む。

## 作業開始

リポジトリのルートで、変更と公開ブランチを確認する。

```bash
git status --short --branch
git diff
git remote -v
git fetch origin
gh repo view ozaken-AI/profile --json defaultBranchRef,url
```

確認時点の既定・本番ブランチは `claude/ozaken-portfolio-site-a0aggr`。未コミットの作業を保護してから、このブランチを元に用途が分かる作業ブランチを作る。`reset --hard` やforce pushは通常の手順に含めない。

GitHubコネクタで不足する操作は、認証済みの `gh` と `git` でも行える。2026-09の作業ではコネクタの書き込みに制限があり、CLIでPRを作成・マージした。利用可能な正規の手段を使う。

## 開発環境

Node.js 22.23.2（`.node-version`）、`package-lock.json` に従う依存関係を使用する。

```bash
npm ci
npm run dev -- --host 127.0.0.1
```

開発URLは通常 `http://127.0.0.1:4321/`。ポートが使用中なら既存の作業を止めず、起動結果のURLを確認する。

```bash
npm run build
npm run preview -- --host 127.0.0.1
```

`preview` はビルド済み `dist/` の確認。変更後は再ビルド・再読み込みが必要。`dev` / `preview` だけではCloudflare Pages Functionsの実行確認にならない。

## 設定と秘密情報

下表はコードが参照する設定。外部サービスに現在登録済みかどうかは対象環境で別途確認する。値そのものをログや文書に残さない。

| 場所 | 名前 | 用途 |
|---|---|---|
| Cloudflare / ローカルのビルド環境 | `MICROCMS_SERVICE_DOMAIN` | CMSサービスID。現在 `ozaken` |
| 同上・Secret | `MICROCMS_API_KEY` | `news` を読むGET用キー |
| Cloudflare Pages・Secret | `RESEND_API_KEY` | フォームのメール送信 |
| Cloudflare Pages | `CONTACT_TO` / `CONTACT_FROM` | 受信先・差出人。省略時は関数の定数を参照 |
| ビルド環境 | `PUBLIC_GA_ID` | 公開されるGA4測定ID。省略時はタグなし |
| Cloudflareビルド設定 | `NODE_VERSION` | `22` |
| GitHub Actions・Secret | `MICROCMS_WRITE_API_KEY` | 投稿用。新規PUT、既存更新PATCH |
| GitHub Actions・Secret | `GOOGLE_SERVICE_ACCOUNT_JSON` | 解析の閲覧用サービスアカウント鍵 |
| GitHub Actions | `GA4_PROPERTY_ID` / `SITE_URL` | 現行workflowではSecretsから読む。測定IDとは別 |

CloudflareのProductionとPreview、GitHub Actions、ローカルは別の設定領域。片方にあるから他方も使えるとは考えない。キーは利用可能なSecrets管理経路で設定し、会話への貼り付けを求めない。秘密に `PUBLIC_` を付けない。

CMSデプロイフックのURLも実行権限を持つ値なので、リポジトリに保存しない。

## 変更別の検証

| 変更 | 確認 |
|---|---|
| Markdownのみ | 差分、実装との対応、相対リンク・参照ファイル、古い指示との矛盾。資料作成や配信スクリプトを試しに実行しない |
| Astro / TypeScript | `npm run build`、必要な型診断、影響するページ |
| 文言・実績・SEO | 日付・根拠、title / description / H1、canonical、JSON-LD、表示とメタ情報の一致 |
| CSS / 動き / 画像 | PCと390px、必要に応じ320px。明暗両状態、スクロール、横はみ出し、操作、画面外停止 |
| 開幕演出・共通レイアウト | 見出しが先に出る、暗幕解除、操作による終了、ヒーロー粒子、LINE、下層ページ |
| フォーム / Pages Function | `npm test` と変更に対応する画面確認。実送信は別の操作 |
| お知らせ / CMS取得 | 最新8件、一覧、記事、外部リンク、カテゴリ、掲載日。本番で欠落がないか確認 |
| 写真 / ロゴ / OGP | 実寸・切り抜き・配布先・OGPサイズ・表示文言・キャッシュ更新 |

`npm run check`、`npm test`、`npm run build`を実行する。`@astrojs/check`とTypeScriptはdevDependenciesに含む。PRと本番ブランチのpushでは `.github/workflows/site-checks.yml` が同じ検証と `npm audit --audit-level=moderate` を行う。PRへCMS等のSecretsを渡さず、本番のニュース生成はCloudflare側で別に確認する。

フォームのテストは通信を模擬し、実メールを送らない。2026-09-11時点の型診断の既存ヒントは、LINEコピーの `execCommand` 非推奨。新しい診断と分けて報告する。

動きは静止画だけで判断せず、時間差の透明度・位置と画面上の見え方を確認する。OS設定の実機切替をしていなければ、コード確認と区別する。ブラウザがロック等で使えない場合は、その制約を明記する。

## 公開

公開を依頼された作業、またはセッションで許可済みの範囲では、検証後にPR・公開まで進める。新たな許可が必要な場合も、先に差分と検証結果を具体化する。

1. 変更ファイルだけをステージし、commit、作業ブランチへpushする。
2. 本番ブランチをbaseにPRを作る。説明には変更後の動作・検証・未確認事項を残す。複数行の本文はファイルに書いて `--body-file` で渡す。
3. `gh pr checks <PR番号> --watch --interval 20` でCloudflare Pagesを確認する。チェックがまだ現れていなければ少し待って再確認する。
4. `gh pr view <PR番号> --json headRefOid,mergeable,statusCheckRollup` で対象のheadを確認する。
5. 許可された範囲で `gh pr merge <PR番号> --squash --match-head-commit <確認したhead SHA>` を実行する。
6. `gh pr view <PR番号> --json state,mergeCommit` でマージコミットを取得する。
7. **マージコミット**のチェックを `gh api repos/ozaken-AI/profile/commits/<マージSHA>/check-runs` で確認する。PRのプレビュー成功だけでは本番公開成功にならない。
8. [本番](https://ozaken.ai/)で最新のコード・データを確認し、公開URLと結果を報告する。

Cloudflare Pagesのプロジェクトは `profile`、ビルド `npm run build`、出力 `dist`。CMS更新もビルド時の取り込みなので、投稿後はWebhookによる再デプロイが必要。

所要時間は保証しない。デプロイ成功の表示と公開ページを根拠にする。2026-09には単純なHTTP取得が403、検索側が旧版キャッシュになったことがある。これだけでサイト障害や最新版と判断せず、利用可能な通常のブラウザで確認する。

## 投稿と解析をチャットから実行する

入力をシェル文字列に直接連結しない。改行・引用符・バッククォートを保てるJSONファイルを作り、workflowへ渡す。

```bash
gh workflow run news-post.yml --repo ozaken-AI/profile --ref claude/ozaken-portfolio-site-a0aggr --json < news-input.json
gh workflow run analytics-report.yml --repo ozaken-AI/profile --ref claude/ozaken-portfolio-site-a0aggr --json < analytics-input.json
```

入力は[投稿手順](news-post.md)・[解析API](analytics-api.md)を参照。`workflow run` の受付は完了ではない。同じworkflow・branch・開始時刻のrunを `gh run list` から特定し、`gh run watch <run ID>`、`gh run view <run ID> --log` で成否を読む。同時実行があれば「最新1件」を自分のrunと決めつけない。

解析結果は依頼者に返す。集計値や検索語を自動で公開リポジトリへ追加しない。

## 障害時の切り分けと戻し方

| 症状 | 最初に見るところ |
|---|---|
| ビルド成功なのにお知らせが空 | CMS取得ログ、Productionの設定、`getNews()`の空配列への切替 |
| CMS投稿成功なのに画面が古い | Webhook、対象ブランチ、マージ後のデプロイ、通常のブラウザの再読み込み |
| 投稿の訂正に失敗 | 同じ記事IDか、PATCH権限があるか。別IDでの再試行は重複を作る |
| フォームにメーラーへの案内が出る | `RESEND_API_KEY` と対象環境。表示成功と配送成功を混同しない |
| 429でフォームが戻る | 3秒未満の送信。入力が保持され、再送できるか |
| 502・通信失敗 | Pages FunctionとResend。ログを公開場所へ貼り付けない |
| 本文が隠れたまま | reveal、`.on`、JSエラー、noscript / reduced-motionの代替表示 |
| 背景が動き始めない | `motion-active`、交差判定、タブ可視状態、OS設定。[境界の修正理由](design-and-motion.md)も参照 |
| 画像・SNSカードが古い | Astroのハッシュ、配布ファイルのキャッシュ、`OG_VERSION`、[OGP手順](../scripts/ogp/README.md) |

コードの戻しは公開済みの該当コミットを確認し、作業ブランチでrevertして通常のPR・検証・公開を通す。緊急のCloudflareロールバックも対象デプロイを記録し、Gitの状態と後で整合させる。コードを戻してもCMS本文・外部設定・配送済みメールは戻らない。

## 引き継ぎの残し方

PRには「目的／変更箇所／根拠／検証／公開コミットと結果／残作業」を残す。恒常ルールは該当ガイド、判断理由は[決定事項](decisions.md)へ追記する。端末固有の絶対パスや一時ファイルを、次のAIに必要な唯一の参照先にしない。
