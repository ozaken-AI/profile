# OGP画像の再生成

最終更新：2026-09-11。対象は `public/ogp.png` と `public/ogp-speaking.png`（1200×630）。Astroのビルドでは自動生成しない。

元データは `template.html`。2026-09-11に年のない数量の掲載をやめ、氏名・ビジョン・提供範囲を表示した。今後数量を載せる場合は [確定条件](../../docs/content-and-assets.md) に従い、年と範囲を画像内でも読める形にする。

1. リポジトリ外の一時ディレクトリへテンプレートをindex.htmlとしてコピーする。
2. `src/assets/photos/speaking-closeup.jpg` をhero.jpg、`public/favicon-96.png` をseal.pngとして同じ場所へコピーする。
3. ローカルで配信して、利用環境のブラウザ制御ルールに従って開く。テンプレートはGoogle FontsのShippori Mincho B1、Archivo、Zen Kaku Gothic Newを読む。フォントと画像が表示されてから出力する。
4. 通常URLをogp.png、`?v=speaking`をogp-speaking.pngとして書き出す。CSSの設計寸法は1200×630。ブラウザの倍率と出力画像寸法を必ず確認する。
5. 書き出し環境の倍率補正が必要なら `renderScale` を使用できる（通常は1）。2026-09-11の環境ではDPR 0.9でキャプチャが逆倍率になるため、`renderScale=0.9`、clip 1080×567で1200×630を得た。別環境に同じ補正を無条件に適用しない。
6. 両画像を実際に開き、文字、人物、境界、余白、縮小時の可読性を確認する。公開画像2枚と元テンプレートを同時に更新する。
7. `src/layouts/Base.astro` のOG_VERSIONを上げる（現在5。一般的なサービス名を「講演」へ変更）。寸法とメタタグ、プレビュー、本番を確認する。

生成過程の一時素材やブラウザの制御スクリプトをpublicに置かない。ブラウザを使った一度の出力と、再実行できるテンプレートを区別して引き継ぐ。SNS側のキャッシュ更新は即時を保証しない。
