# お知らせを投稿・訂正する

最終確認：2026-09-07。実装は `scripts/news-post.mjs` と `.github/workflows/news-post.yml`。[CMS設定](microcms-setup.md)／[共通の公開手順](operations.md)。どのAIでも、認証済みのGitHub操作手段から同じworkflowを実行できる。

## 依頼から公開まで

1. 本人の依頼から、タイトル・本文・カテゴリ・掲載日・リンク先を作る。実績・役割・開催日を資料や一次情報と照合する。未来の予定を登壇済みと書かない。
2. 対象記事を検索し、新規か訂正かを決める。**記事IDを決めて記録する。** 訂正なら既存IDを使う。
3. 公開を指示されている範囲はそのまま進める。下書き作成の依頼なら下書きのままにする。確認が必要な場合は、先に文面・日付・掲載先を具体化する。
4. workflowに入力し、対象runのログでCMS登録の成否とIDを確認する。
5. 公開・更新に伴うWebhookとCloudflareの本番デプロイを確認する。
6. トップの最新8件、`/news/`、記事または外部リンクを確認し、結果を報告する。下書きは公開ページへ出ないことが正常。

CMS登録の成功だけではサイト反映の完了にならない。サイトはビルド時にCMSを読み込むため、公開後に再デプロイが必要。

## 設定

GitHub Actions Secret `MICROCMS_WRITE_API_KEY` に、`news` の新規作成に必要なPUT、訂正に必要なPATCHの権限を持つキーを設定する。実装は既存IDへのPUTが重複エラーになった場合、PATCHへ切り替える。通常の投稿にDELETEは不要。

サイトのビルド用は `MICROCMS_API_KEY`（GET）。可能な構成では用途ごとに分け、契約プランの上限は設定時に確認する。値を会話・ログ・Gitに貼らない。CloudflareとGitHubのSecretsは別の設定領域。

## 入力項目

| workflowの項目 | 内容 |
|---|---|
| `title`（必須） | 記事見出し |
| `category`（必須） | 登壇／メディア／イベント／リリース |
| `body`（必須） | 本文。空行で段落、単独の改行は改行として表示 |
| `publishedDate` | `YYYY-MM-DD`。空なら日本時間の当日。実際に存在する日付か確認する |
| `excerpt` | 記事のリード・説明文用。空なら本文の先頭から約110文字で生成 |
| `eventName` | イベント名（任意） |
| `externalUrl` | 一覧のタイトルから直接開く外部URL（任意） |
| `contentId` | 安定した記事ID。空欄だと日付＋ランダム文字列になる |
| `status` | 公開／下書き。**既定は公開**なので明示する |

IDは小文字の英数字・ハイフン・アンダースコアにそろえ、先頭は英字とする。入力はスクリプトで正規化されるため、実行ログの確定IDを確認する。

本文でリンクになるのはHTTP(S)のURL、Markdownのリンク、`<a href="https://…">…</a>`。それ以外のHTMLは文字としてエスケープされる。箇条書き・見出しなどの完全なMarkdown変換ではない。複雑なリッチ本文、画像、`audience` / `scale` / `location` の設定はCMSで行う。workflowにはそれらの入力欄がない。

`publishedDate` は日本時間の正午に相当する日時へ変換される。CMSの公開操作日時とは別の、記事を並べるための掲載日である。

## チャットから実行する例

以下のJSONは**架空の下書きの形式例**。そのままCMSへ送る検証はしない。依頼された内容と安定したIDに置き換え、公開してよい場合だけ `status` を公開にする。

```json
{
  "title": "記事タイトル",
  "category": "登壇",
  "body": "依頼された本文。\n\n詳細は https://example.com/",
  "publishedDate": "2026-09-07",
  "excerpt": "記事の要点。",
  "eventName": "イベント名",
  "externalUrl": "",
  "contentId": "example-lecture-20260907",
  "status": "下書き"
}
```

改行などを保って `news-input.json` に保存し、リポジトリのルートから実行する。公開予定の本文はActionsログにも出るため、非公開情報は入力しない。

```bash
gh workflow run news-post.yml --repo ozaken-AI/profile   --ref claude/ozaken-portfolio-site-a0aggr --json < news-input.json
gh run list --repo ozaken-AI/profile --workflow news-post.yml   --branch claude/ozaken-portfolio-site-a0aggr --limit 10
```

開始時刻・branch・workflowで自分のrunを特定する。そのrun IDに対し `gh run watch`、`gh run view --log` を使う。受付・実行完了・CMS公開・サイト配信を分けて確認する。

## 送信せずに変換だけ確認する

ローカルの `DRY_RUN=1` はCMS通信をしない。スクリプトはdry-runでもキーの存在を要求するので、**ダミー値**を使える。以下は変換の確認に限った例。

```bash
DRY_RUN=1 MICROCMS_WRITE_API_KEY=dummy IN_TITLE='投稿前の確認' IN_CATEGORY='登壇' IN_BODY='確認用本文' IN_DATE='2026-09-07' IN_ID='example-lecture-20260907' IN_STATUS='下書き' node scripts/news-post.mjs
```

実際の本文をシェルへ直接連結せず、構造化した入力から環境変数へ渡す。GitHubのworkflow自体にはdry-runの入力はない。

## 訂正・再試行

- **空のIDで再実行しない。** ランダムIDが生成され、同じ記事が増える。通信結果が不明な場合は、先にCMS・ログで登録の有無を調べる。
- 訂正は既存IDのまま。PUTの重複エラーからPATCHへ進む。PATCH権限がなければ権限・管理画面での訂正方法を確認し、重複する別記事で代用しない。
- title・category・日付・抜粋・本文は毎回送られる。既存記事の内容を読み、意図しない上書きを防ぐ。任意欄の削除や公開状態の変更は、CMSで結果を確かめる。
- APIエラーで本文や鍵を公開ログに追加しない。キーが使えない場合はSecrets管理経路で更新する。

## 表示と確認

一覧は日付・カテゴリ・タイトル。抜粋とサムネイルは一覧には出ない。`externalUrl` がある記事は一覧から外部へ飛ぶが、**現行実装では取得した全記事の詳細HTMLも生成される**。本文が空の場合も同様。詳細ページが存在しないと想定して情報を省かない。

取得は掲載日降順。トップは8件、一覧・詳細の生成は既定500件まで。CMSが未設定・取得失敗でもビルドは通る。公開後にお知らせが欠落していないことを別に確認する。
