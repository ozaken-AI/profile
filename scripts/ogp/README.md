# OGP画像の作り直し

`public/ogp.png`（1200×630）と `public/ogp-speaking.png` の元データ。

`template.html` をブラウザで1200×630で開いてスクリーンショットを撮るだけ。
`?v=speaking` を付けると講演依頼ページ用になる。

同じディレクトリに以下が必要（リポジトリには入れていない）。

- `fonts.css` と `fonts/` … Google Fonts（Shippori Mincho B1／Archivo／Zen Kaku Gothic New）を
  ローカルに落としたもの。ネットにつながる環境なら `<link>` を Google Fonts に差し替えてよい
- `portrait.jpg` … `src/assets/photos/portrait.jpg` をコピー

数字（300回／1,500本／50,000名）と肩書きは `src/lib/site.ts` と揃えること。
