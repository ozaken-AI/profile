# 旧サイトのお知らせ232件を microCMS に入れる

旧サイト（ozaken-ai.studio.site）に載っていたお知らせ **232件（2023.10.15 〜 2026.07.29）** を、
そのまま新サイトに引き継ぐための手順です。

**先に `docs/microcms-setup.md` の 1〜4（APIとフィールドの作成）を済ませてください。**

---

## 何が入るか

| 欄 | 中身 |
|---|---|
| `title` | 旧サイトの見出しをそのまま |
| `category` | タイトルの言葉から自動で振り分け（下記） |
| `publishedDate` | 旧サイトの掲載日 |
| `excerpt` | 本文の書き出しを110字くらいで切ったもの |
| `body` | 本文の段落と、記事内の関連リンク |

カテゴリの内訳は **登壇 113／メディア 99／リリース 16／イベント 4** です。
タイトルの言葉で機械的に決めているので、違和感のあるものは microCMS 上で直せます。

`externalUrl` は空にしてあります。本文を全部持っているので、一覧からは自サイトの詳細ページに入ります。

---

## 方法A：管理画面から CSV を読み込む（おすすめ）

1. microCMS で **お知らせ（news）** を開く
2. 右上の **「…」→「インポート」**
3. `docs/legacy/news-import.csv` を選ぶ
4. 中身を確認して実行

CSV はこのリポジトリの `docs/legacy/` にあります。
GitHub の画面から **Download raw file** で落とせます。

### 「列数が違う」と出たら

> The number of columns in the CSV data differs from the number of fields in the API schema

microCMS のインポートは、**スキーマの全フィールド＋コンテンツID が1列ずつそろっている**
必要があります。使わない欄も空のまま並べなければ弾かれます。

このCSVは `docs/microcms-news-schema.json` から列を組み立てているので、
**microCMS 側のフィールドがこのリポジトリのスキーマと同じなら通ります。**

```
id, title, category, publishedDate, excerpt, thumbnail,
body, externalUrl, eventName, audience, scale, location   ← 12列
```

それでも列数が違うと言われる場合は、microCMS 側にこのリポジトリに無いフィールドが
残っています。**とくに `thumbnailUrl`** ── 以前この欄を足す手順を案内しましたが、
一覧のサムネイルをやめたので不要になりました。microCMS のスキーマから削除してください。

削除したくない場合は、`docs/microcms-news-schema.json` にそのフィールドを書き足して
`node scripts/news-build-import.mjs` を実行し直すと、列がそろったCSVが出ます。

### 「コンテンツIDの形式が正しくありません」と出たら

microCMS のコンテンツIDは**小文字の英数字とハイフン・アンダースコア**しか使えません。
旧サイトのスラッグには `DAIB1` `AIdiver1` のように大文字が混じっていたため、
生成時に次の形にそろえています。

- すべて小文字にする
- 先頭は英字（数字始まりのものは頭に `n` を足す）
- 3文字未満のものは末尾に `-1`
- 小文字化で衝突するものは連番で逃がす（`AIdiver1` と `aidiver1` → `aidiver1` と `aidiver1-2`）

配布しているCSVは変換済みなので、そのまま読み込めます。

### 「category の値が正しくありません」と出たら

セレクトフィールドの書き方を、microCMS がどちらで期待しているか確かめられていません。
2通り用意してあるので、順に試してください。

| ファイル | `category` 列の中身 |
|---|---|
| `news-import.csv` | `["登壇"]`（JSONの配列） |
| `news-import-plain.csv` | `登壇`（値そのまま） |

両方とも弾かれる場合は、**microCMS側の選択肢がこちらの想定と違います。**
「お知らせ」→ APIスキーマ → `category` を開いて、選択肢が

```
登壇 ／ メディア ／ イベント ／ リリース
```

の4つになっているか確認してください。違っていたら、実際の選択肢を教えてもらえれば
その表記でCSVを作り直します。

**いちばん確実な確かめかた**は、microCMS で記事を1件だけ手で作って
（カテゴリを選んで保存）、コンテンツを **CSVでエクスポート**することです。
microCMS が期待している書き方がそのまま出てくるので、そのファイルを渡してもらえれば
232件を同じ形に合わせます。

### 一度に読み込める件数の上限に当たったら

CSV を分割してください。1行目（見出し行）は分割したどのファイルにも必要です。

---

## 方法B：スクリプトで流し込む

手元に Node.js がある場合はこちらのほうが確実です。記事IDが旧サイトのスラッグのまま入ります。

1. microCMS の「APIキー」で、**news の `PUT` を許可した**キーを新しく作る
   （サイトが使っている GET だけのキーとは別にしてください）
2. このリポジトリを手元に落として `npm install`
3. 実行する

```bash
MICROCMS_SERVICE_DOMAIN=ozaken \
MICROCMS_WRITE_API_KEY=（PUTを許可したキー） \
node scripts/news-import.mjs
```

送る内容だけ先に見たいときは `--dry-run` を付けてください。

`PUT /api/v1/news/{id}` なので、**何度実行しても同じ結果**になります。
途中で止まってもそのまま実行し直せます。

終わったら **使い終わった書き込み用のキーは削除してください。**

---

## 入れ終わったら

1. Cloudflare Pages で再デプロイする（microCMS の Webhook を設定済みなら自動）
2. `https://ozaken.ai/news/` に232件が並ぶ
3. 記事ごとの詳細ページ（`/news/<スラッグ>/`）も同時にできる

サイトは microCMS を**ビルドのときだけ**読みます。CMSを更新しても、
再デプロイするまで公開ページは変わりません。

---

## やり直したくなったら

`docs/legacy/cms_content_20260824.json` が旧サイトから取り出した元データです。
分類のしかたや抜粋の切り方を変えたいときは、`scripts/news-build-import.mjs` を直して

```bash
node scripts/news-build-import.mjs
```

を実行すると、CSV と JSON が作り直されます。

旧サイトのサムネイル画像は取り込んでいません。一覧は文字だけで並べる形にしたためです。
元データの `thumbnail` に画像のURLが残っているので、あとから必要になれば取り直せます。
