# ozaken.ai — 小澤健祐（おざけん）ポートフォリオ

1ページ完結のポートフォリオサイト。登壇レポートだけは `data/talks.json` を書き換えるだけで
更新できる、ビルド不要の簡易CMS構成になっている。

- デザイン: `ozaken-web-style v5`（図版主導・ネイビー基調）準拠
- 技術構成: 静的HTML1枚 + JSONデータ。ビルドツール・フレームワーク・外部UIライブラリなし
- ホスティング想定: Cloudflare Pages

## ファイル構成

```
index.html            サイト本体（CSS・JSすべて内包）
data/talks.json       登壇レポートのデータ（★ここだけ更新すればサイトに反映される）
data/talks.sample.json 表示確認用のサンプルデータ
admin/index.html      登壇レポートの入力フォーム（JSONを生成するだけのツール）
functions/api/contact.js  お問い合わせフォームの受け口（Cloudflare Pages Function）
_headers              Cloudflare Pages 用のレスポンスヘッダ設定
favicon.svg / robots.txt / sitemap.xml
```

## 登壇レポートを追加する

### 方法A：管理フォームを使う（おすすめ）

1. `https://ozaken.ai/admin/` を開く
2. 「data/talks.json を読み込む」を押して現在のデータを読み込む
3. フォームに入力して「この内容で追加する」
4. 一番下の JSON を「クリップボードにコピー」
5. GitHub でこのリポジトリの `data/talks.json` を開き、鉛筆アイコンで編集
6. 中身を全部消して貼り付け、commit
7. Cloudflare Pages が自動デプロイし、数十秒でサイトに反映される

管理フォームはデータを保存しない（サーバも認証も持たない）。
JSONを組み立てて渡すだけのツールなので、公開されていても書き換えられる心配はない。

### 方法B：JSONを直接書く

GitHub 上で `data/talks.json` の `talks` 配列に1オブジェクト足すだけ。

```json
{
  "date": "2026-09-04",
  "type": "keynote",
  "title": "AIエージェントは、仕事の主語を変える",
  "event": "◯◯サミット 2026",
  "organizer": "株式会社◯◯",
  "audience": "経営層・事業部長",
  "scale": "約420名",
  "location": "東京・大手町",
  "url": "https://example.com/report",
  "report": "どんな話をして、反応がどうだったかを2〜3行で。",
  "tags": ["AIエージェント", "経営戦略"]
}
```

| フィールド | 必須 | 内容 |
|---|---|---|
| `date` | ✅ | `YYYY-MM-DD`。日付未定なら `YYYY-MM` でも可。これで自動ソートされる |
| `type` | | `keynote` / `seminar` / `workshop` / `panel` / `moderator` / `media` / `other`。絞り込みチップになる |
| `title` | ✅ | セッションタイトル |
| `event` | | イベント名 |
| `organizer` | | 主催 |
| `audience` | | 対象者 |
| `scale` | | 規模（文字列。`約420名` のように単位ごと書く） |
| `location` | | 開催地・オンライン等 |
| `url` | | 告知やレポート記事のURL。あればタイトルがリンクになる |
| `report` | | 一言レポート |
| `tags` | | 文字列の配列 |
| `draft` | | `true` にするとサイトに表示されない（下書き保存用） |

順番は気にしなくてよい。`date` の降順に自動で並び、年ごとに見出しがつく。

## ローカルで確認する

`fetch` を使うため `file://` では登壇ログが読み込めない。ローカルサーバ経由で開く。

```bash
python3 -m http.server 8000
# → http://localhost:8000/            サイト本体
# → http://localhost:8000/?demo=1     サンプルデータで表示確認
# → http://localhost:8000/admin/      入力フォーム
```

`?demo=1` を付けると `data/talks.sample.json` を読み込む。
本番データが空でも、一覧のデザインを確認できる。

## Cloudflare Pages へのデプロイ

ビルド不要なので、リポジトリを繋ぐだけで公開できる。

1. Cloudflare ダッシュボード → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. このリポジトリを選択
3. ビルド設定
   - Framework preset: **None**
   - Build command: **空欄のまま**
   - Build output directory: **`/`**（リポジトリのルート）
   - Production branch: `main`
4. Deploy を実行
5. デプロイ完了後 → **Custom domains** → **Set up a domain** → `ozaken.ai` を追加
   - ドメインを Cloudflare で管理している場合、DNSレコードは自動で作成される
   - 外部レジストラの場合は、指示された CNAME を登録する
6. `www.ozaken.ai` も使うなら、同じ手順でもう1つ追加してリダイレクトを設定する

以降は `main` への push が自動でデプロイされる。

## お問い合わせフォームの設定

フォームは `POST /api/contact`（`functions/api/contact.js`）が受け、[Resend](https://resend.com) 経由で
`kensuke.ozawa@aicx.jp` にメールを送る。Pages Functions はリポジトリを置くだけで自動的に有効になるので、
追加の設定は環境変数だけ。

**未設定でもフォームは壊れない。** バックエンドが未設定・通信失敗のときは、入力内容を件名と本文に
埋め込んだ状態でメーラーが起動するフォールバックが動く。まず公開して、あとから設定してよい。

### 設定手順

1. [Resend](https://resend.com) に登録し、**Domains** で `aicx.jp`（または `ozaken.ai`）を追加して
   表示された DNS レコードを登録・検証する
2. **API Keys** でキーを発行する
3. Cloudflare Pages → 該当プロジェクト → **Settings** → **Variables and Secrets** で、
   Production / Preview の両方に次を登録する

   | 変数名 | 値 | 種別 |
   |---|---|---|
   | `RESEND_API_KEY` | Resend で発行したキー | Secret（暗号化） |
   | `CONTACT_TO` | `kensuke.ozawa@aicx.jp` | Text |
   | `CONTACT_FROM` | `ozaken.ai <no-reply@ozaken.ai>` など、手順1で検証したドメインのアドレス | Text |

4. 再デプロイすると反映される（環境変数の変更は次のデプロイから有効）

`CONTACT_TO` と `CONTACT_FROM` は省略可。省略時はそれぞれ `kensuke.ozawa@aicx.jp` と
Resend のテスト用アドレスが使われるが、テスト用アドレスは自分宛にしか送れないため本番では必ず設定する。

### 迷惑メール対策

- **ハニーポット** … 画面に出ない入力欄。埋まっていれば送信を破棄する（bot には成功を返す）
- **時間チェック** … フォーム表示から3秒未満の送信は破棄する
- **入力の正規化** … 制御文字と改行を落としてから件名に載せるので、ヘッダインジェクションは通らない

これで足りなければ [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) を足す。
無料で、CAPTCHA のようにユーザーに操作させずに済む。

### ローカルで確認する

Pages Functions を動かすには Wrangler が要る。

```bash
npx wrangler pages dev .
```

`python3 -m http.server` でも画面の確認はできる。その場合 `/api/contact` が 404 になるため、
送信するとメーラー起動のフォールバックが動く。

## 更新するときの注意

- `index.html` の `<style>` と末尾の `<script>` は `ozaken-web-style v5` のデザインシステム。
  トークン（色・書体・余白）は基本的に触らない
- セクションはライト面とネイビー面を必ず交互に置き、本文は奇数本（現在5本）に保つ
- 図版（`.figure`）は「Fig番号＋主張」のタイトルと結論のキャプションを必ずセットで書く
- `.take`（おざけんのワンポイント）は1ページ2回まで

## 差し替えが必要な箇所

初回公開前に以下を実際の値に更新すること。

- **Resend の環境変数** — 「お問い合わせフォームの設定」参照。未設定のあいだはメーラー起動で動く
- **OGP画像** — `ogp.png`（1200×630）を暫定で用意済み。サイトと同じネイビー基調で、
  キャッチコピー・肩書き・主要な数字を載せている。顔写真入りなどに差し替えたくなったら、
  同じファイル名・同じサイズで置き換えるだけでよい
- **SNSリンク** — Xアカウント（@ozaken_AI）は掲載済み。他に載せたいものがあれば
  Summary の連絡先リストに行を追加する
