# OGP画像の作り直し

`public/ogp.png`（1200×630）と `public/ogp-speaking.png` の元データ。

`template.html` をブラウザで1200×630で開いてスクリーンショットを撮るだけ。
`?v=speaking` を付けると依頼ページ用になる。

同じディレクトリに以下が必要（リポジトリには入れていない）。

- `fonts.css` と `fonts/` … Google Fonts（Shippori Mincho B1／Archivo／Zen Kaku Gothic New）を
  ローカルに落としたもの。ネットにつながる環境なら `<link>` を Google Fonts に差し替えてよい
- `hero.jpg` … `src/assets/photos/speaking-closeup.jpg` をコピー（トップのファーストビューと同じ写真）

見出しは2枚重ねになっている。写真の左端（CSS変数 `--cut`）を境に、
左は塗り、右は輪郭だけで描く。サイトのファーストビューと同じ作りなので、
`--cut` を動かすときは写真の位置と一緒に動かすこと。

数字（300回／1,500本／50,000名）と肩書きは `src/lib/site.ts` と揃えること。

## 差し替えたあと

SNS側は画像をURL単位で長く持つ。ファイル名は変えずに、
`src/layouts/Base.astro` の `OG_VERSION` を上げて取り直させる。
すぐ反映したいときは各社のカード検証ツールで再取得する。
