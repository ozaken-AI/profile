# Claude Code から GA4 / Search Console を直接見る

`docs/analytics.md` でGA4とSearch Consoleを設定済みであることが前提です。
ここでは、その数字をチャットからそのまま引けるようにする手順を書きます。

やることは、**Googleのサービスアカウントを1つ作って、GA4とSearch Consoleに「閲覧者」として
招待する**ことです。所要20分ほど。実装（スクリプト）はもう入っています。

---

## 1. Google Cloud でサービスアカウントを作る

1. <https://console.cloud.google.com/> を開く（GA4と同じGoogleアカウントでOK）
2. 上部のプロジェクト選択から **新しいプロジェクト** を作る
   - プロジェクト名：`ozaken-ai-analytics` など
3. 左上メニュー → **APIとサービス → ライブラリ** で、次の2つを有効にする
   - **Google Analytics Data API**
   - **Google Search Console API**
4. **APIとサービス → 認証情報** → 上の「＋認証情報を作成」→ **サービスアカウント**
   - 名前：`ozaken-analytics-reader` など
   - ロールの付与は**スキップして構いません**（GA4／Search Console側で個別に権限を渡すため）
5. 作成したサービスアカウントの一覧から、いま作ったものを開く
6. **「キー」タブ** → 「鍵を追加」→ **新しい鍵を作成** → **JSON** を選んで作成

   → JSONファイルがダウンロードされます。**これが鍵です。他人に渡さないでください。**

7. ダウンロードしたJSONを開いて、`client_email` の値をコピーしておく
   （`xxxx@yyyy.iam.gserviceaccount.com` のような形です）

---

## 2. GA4 に「閲覧者」として招待する

1. GA4 → **管理**（左下の歯車）→ プロパティ列の **プロパティのアクセス管理**
2. 右上の「＋」→ **ユーザーを追加**
3. さっきの `client_email` を貼り付け、役割は **閲覧者** で追加

## 3. Search Console に招待する

1. Search Console → 対象プロパティを開く → 左メニュー **設定 → ユーザーと権限**
2. **ユーザーを追加**
3. 同じ `client_email` を貼り付け、権限は **制限付き** で十分

## 4. GA4のプロパティIDを控える

これは測定ID（`G-` から始まるもの）とは**別物**です。数字だけのIDを使います。

GA4 → 管理 → プロパティ列の **プロパティの詳細** を開くと、右上に

```
プロパティ ID: 123456789
```

と出ます。この数字を控えてください。

---

## 5. カスタムディメンションを登録する（内訳を見るなら）

サイトからは `contact_cta`（どのページから相談ボタンを押したか）のように、
**イベントに付加情報（パラメータ）を添えて**送っています。この内訳を見るには、
GA4側でパラメータを「カスタムディメンション」として登録する必要があります。
**登録した時点より後のデータにしか反映されない**ので、早めにやっておくのがおすすめです。

GA4 → 管理 → **カスタム定義** → **カスタムディメンションを作成** を、3回繰り返します。

| ディメンション名（表示用・自由） | 範囲 | イベントパラメータ | 何が分かるか |
|---|---|---|---|
| CTA遷移元 | イベント | `from` | 依頼の相談ボタンが、どのページから押されたか |
| LINE入口 | イベント | `place` | LINEへの入口は句点／隠しコマンドのどちらから |
| フォーム結果 | イベント | `result` | 送信の成功／エラー／通信失敗の内訳 |

登録しなくても、`events` コマンド（イベントの発生回数そのもの）は動きます。
内訳（`events-detail` コマンド）だけがこの登録に依存します。

---

## 6. 鍵をGitHub Actionsのシークレットに入れる

**Claude Codeの「環境変数」欄には入れないでください。** あの欄は「この環境を使う
すべてのユーザーに表示される」設定用のもので、秘密鍵を置く場所ではありません
（画面にもそう注意書きがあります）。

かわりに、このリポジトリで**お知らせ投稿にも使っている場所**、GitHub Actionsの
シークレットに入れます。ここは保存後は誰も中身を読み出せない、正しい置き場所です。

1. GitHubでこのリポジトリを開く → **Settings → Secrets and variables → Actions**
2. **New repository secret** を3回繰り返して、次を登録

   | Name | Secret |
   |---|---|
   | `GOOGLE_SERVICE_ACCOUNT_JSON` | ダウンロードしたJSONファイルの中身。そのまま貼るか、base64にしたもの |
   | `GA4_PROPERTY_ID` | 手順4で控えた数字 |
   | `SITE_URL` | Search Consoleに登録したURL（例：`https://ozaken.ai/`） |

JSONをbase64にしたい場合（改行が混ざって入力欄で崩れるのを避けたいとき）：

```bash
base64 -i key.json | tr -d '\n'
```

Cloudflare Pages の環境変数（`PUBLIC_GA_ID` 用）とも、Claude Codeの環境変数とも
別の場所です。3つとも用途が違うので、混ざらないようにしてください。

---

## 7. 使う

`.github/workflows/analytics-report.yml` というワークフローを用意してあります。
GitHubの **Actions タブ →「アクセスを見る」→ Run workflow** から、見たいレポートと
期間（既定28日）を選んで実行できます。実行が終わったら、そのジョブのログに
表がそのまま出ます。

Claude Codeとの会話からも同じものを起動できます。「先週のアクセス見て」
「どのページから相談が来てる？」と言えば、このワークフローを実行して
ログを読み、内容を要約します（GitHub Actions経由で動かすので、
シークレットが会話やこの環境に流れ込むことはありません）。

### 手元で直接実行したい場合

シークレットをどこかの環境変数として自分で用意できれば、次のコマンドで
そのまま動きます（Claude Codeのセッションでは、上の理由から基本使いません）。

```bash
GOOGLE_SERVICE_ACCOUNT_JSON=... GA4_PROPERTY_ID=... SITE_URL=... \
  node scripts/analytics-report.mjs all
```

個別に見たいときは、`all` の部分を差し替えます。

```bash
node scripts/analytics-report.mjs pages          # GA4：ページ別
node scripts/analytics-report.mjs sources        # GA4：参照元別
node scripts/analytics-report.mjs events         # GA4：イベントの発生回数
node scripts/analytics-report.mjs events-detail  # GA4：イベントの内訳（要カスタムディメンション）
node scripts/analytics-report.mjs queries        # Search Console：検索クエリ別
node scripts/analytics-report.mjs search-pages   # Search Console：ページ別
node scripts/analytics-report.mjs pages --days 7 # 期間を変える（既定28日）
```

---

## うまくいかないとき

- **`環境変数 ... が設定されていません`** → 手順6のシークレット登録が終わっていません
- **`GOOGLE_SERVICE_ACCOUNT_JSON を JSON として読めませんでした`** → 鍵の中身が壊れています。JSONファイルをもう一度開いて、中身をそのままコピーし直してください
- **`403` や `PERMISSION_DENIED`** → 手順2・3の招待が漏れているか、`client_email` を貼り間違えています
- **`events-detail` だけ「登録が要ります」と出る** → 手順5が未了です。登録後、反映まで数時間かかることがあります
- **検索クエリ・ページが0件のまま** → Search Consoleのデータは反映まで2〜3日かかります。焦らず待ってください
