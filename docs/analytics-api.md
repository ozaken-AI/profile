# AIからGA4・Search Consoleを読む

実装確認：2026-09-07。[計測と指標の意味](analytics.md)が前提。特定のAI製品に依存せず、認証済みのGitHub操作手段から手動workflowを実行してログを読める。これは解析レポートの取得であり、GA4の設定を変更するスクリプトではない。

## 必要な設定

`scripts/analytics-report.mjs` はGoogleのサービスアカウントを使い、AnalyticsとSearch Consoleのread-onlyスコープで取得する。

1. Google Cloudで利用するプロジェクトとサービスアカウントを確認する。Google Analytics Data APIとSearch Console APIを利用できる状態にする。
2. サービスアカウントの `client_email` に、対象GA4プロパティとSearch Consoleプロパティの閲覧に必要な権限を設定する。新しいアカウントを重複作成する前に既存設定を調べる。
3. 下表をGitHubリポジトリ `ozaken-AI/profile` のActions Secretsに設定する。現在のworkflowは3つとも `secrets` から読む。

| 名前 | 内容 |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | サービスアカウント鍵のJSONそのもの、またはbase64表現 |
| `GA4_PROPERTY_ID` | 数字のプロパティID。測定ID `G-...` とは別 |
| `SITE_URL` | 登録済みのSearch Consoleプロパティと一致する値。例 `https://ozaken.ai/` |

鍵は安全なSecrets管理経路から設定する。base64は暗号化ではない。鍵の内容をターミナルへ表示してコピーさせたり、会話やGitへ貼ったりしない。実行コードがSecretsを扱うため、変更したworkflowや依存先も確認する。Secretsという名前だけで漏えいしないと保証しない。

Cloudflareの `PUBLIC_GA_ID` とActionsの上記設定は用途が違う。ローカルで直接実行する場合も、利用環境が提供する安全な方法で設定し、値をコマンドに埋め込まない。

## イベントの内訳

GA4でイベント範囲のカスタムディメンションを確認する。スクリプトが問い合わせるパラメータは次のとおり。

| パラメータ | 用途 |
|---|---|
| `from` | `contact_cta` の元ページ |
| `result` | `contact_submit` の処理結果 |
| `place` | 旧 `line_click` の内訳。現在のLINE表示では送信されない |

`events-detail` は `customEvent:<パラメータ名>` を使う。未登録・利用できない場合は、その状態を欠測として扱う。現在の分析のために `place` の新規計測が必要とは限らない。LINEの制約と成功数の扱いは[解析ガイド](analytics.md)を読む。

## GitHub Actionsから取得する

`.github/workflows/analytics-report.yml`、表示名「アクセスを見る」。手動実行のみで、このworkflowに定期スケジュールはない。

以下を `analytics-input.json` に保存する。`days` は正の整数で指定する。既定は28。

```json
{"report":"all","days":"28"}
```

```bash
gh workflow run analytics-report.yml --repo ozaken-AI/profile   --ref claude/ozaken-portfolio-site-a0aggr --json < analytics-input.json
gh run list --repo ozaken-AI/profile --workflow analytics-report.yml   --branch claude/ozaken-portfolio-site-a0aggr --limit 10
```

開始時刻・workflow・branchで対象runを特定して `gh run watch <run ID>`、`gh run view <run ID> --log` を使う。実行受付と取得成功を区別する。同時実行があれば、最新1件を自分の結果と決めつけない。

## レポート一覧

リポジトリの依存をインストールし、必要な環境設定がある場合は、同じスクリプトを直接実行できる。現行コードでは、個別レポートでも起動時に3つの設定を要求する。

```bash
node scripts/analytics-report.mjs pages --days 7
```

| `report` / コマンド | 内容 |
|---|---|
| `pages` | GA4のページ別 |
| `sources` | GA4の参照元別 |
| `events` | 指定イベントの発生回数 |
| `events-detail` | CTA元ページ・フォーム結果・旧LINE内訳 |
| `queries` | Search Consoleの検索語別 |
| `search-pages` | Search Consoleのページ別 |
| `trend` | Search Consoleの推移と比較 |
| `all` | 上記すべて。`trend` も含む |

ログの数値を期間・指標・制約付きで要約し、依頼者に返す。取得を依頼されていない文書整備で、動作確認のためだけにレポートを実行しない。

## 取得できない場合

- 環境変数不足：ActionsのSecrets名と対象リポジトリを確認する。
- JSON解釈の失敗：鍵の形式を安全な経路で再設定する。値をログへ出さない。
- 403 / `PERMISSION_DENIED`：APIの有効化、サービスアカウント、プロパティへの権限、ID・URLの一致を調べる。
- `events-detail` の一部だけ取得不可：カスタムディメンションとその反映状況を確認する。
- 検索データなし：新規登録・反映遅延・対象期間・URL・権限を調べる。すぐ「検索流入ゼロ」と言い換えない。

外部サービスの画面名・権限仕様は変わるため、設定を変更する際は現在の公式手順を確認する。取得の失敗を埋めるために推定値を実測値として出さない。
