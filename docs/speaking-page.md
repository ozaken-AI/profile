# 講演・研修・組織変革の統合ページ

最終更新：2026-09-10。本人の「2つのページの遷移が分かりづらい。一緒のページでいいのでは」という希望に対応。一覧から詳細へ往復する構成をやめ、`/speaking/` の1ページで内容・条件・実績を比較できるようにする。

## 構成と編集先

入口の4形式 → 基調講演3テーマ → 研修4種類 → 組織変革 → 顧問 → 匿名の企業実績 → 公開の登壇・支援先 → 依頼の流れ → 共通FAQ → 相談先、の順。補足の論点・進め方・構成例・公開先の長い一覧は、同じページの `details` で開く。JavaScriptに依存するタブ切り替えは使わない。

| 内容 | 編集先 |
|---|---|
| 全体構成、入口、共通の流れ、title・description・ServiceのJSON-LD | `src/pages/speaking/index.astro` |
| トップにも出る4形式の説明・実施条件・進め方 | `src/lib/site.ts` の `MENU` |
| 4形式の時間・形式・開閉式の補足・相談先 | `src/components/ServiceDetails.astro` |
| 基調講演3テーマ・60分の構成例 | `KEYNOTE_SERIES` と `KeynoteSeries.astro`。[根拠と企画](keynote-series.md) |
| 研修・ワークショップ4種類 | `TRAINING_PROGRAMS` |
| 管理職の対話・役割設計・全社推進・定着 | `ORGANIZATION_THEMES` と `MENU` の `partner` |
| 匿名の企業での取り組み5件 | `PRIVATE_ENGAGEMENTS` |
| 公開の登壇・支援先、費用・開催条件 | `SPEAKING_TRACK`、`FAQ` |
| 新しい内部リンク | `speakingHref()` と `SPEAKING_ANCHORS`。トップの `MENU` カードも使用 |
| 旧詳細URLの転送 | `public/_redirects` と `astro.config.mjs` |

問い合わせフォームの `kind=keynote/training/partner/advisory` は変更しない。料金は個別見積もり。代表的な登壇の紹介枠は本人の希望に従い復活させない。

## 製品別研修の表記

一般的な生成AI研修に加え、Gemini、Microsoft 365 Copilot、AIエージェントの業務設計をそれぞれ選べる内容にした。製品名だけを並べず、対象者、題材、演習内容を示す。Copilotは企業向けの **Microsoft 365 Copilot** として扱い、GitHub Copilotの開発者研修とは混同しない。

2026-09-10に公式の利用案内で製品・アプリの範囲を確認した。

- [Google WorkspaceのGeminiリソース](https://workspace.google.com/learning/resources/gemini-for-google-workspace-customer-resources-hub)
- [Google公式の利用ガイド](https://support.google.com/a/users/answer/15146419?hl=en)
- [Microsoft 365 Copilotの公式サポート](https://support.microsoft.com/en-us/microsoft-365-copilot/)

機能や利用条件は契約プラン・管理者設定・時点により異なる。実際の研修は依頼者が使える環境を確認して構成し、利用できない機能や製品ライセンスの提供を約束しない。匿名の実績に、今回追加した製品名を勝手に結びつけない。

## 匿名実績の扱い

本人から2026-09-10に提示された実施内容を根拠に、次の5件を公開する。

| 匿名の区分 | 掲載する実施内容 |
|---|---|
| 大手製造業 | マネージャー合宿 |
| エネルギー企業 | AIエージェント活用ワークショップ |
| 製造業グループ | 生成AIの使い方研修 |
| サービス企業 | 全社でのAIエージェント活用浸透プロジェクトの推進 |
| 事業会社 | 全社でのAIエージェント活用浸透プロジェクトの推進 |

**実社名、匿名表記との対応表、社名を特定するためのリンクを、この公開リポジトリへ記録しない。** コメント、画像のalt、JSON-LD、Git履歴、PR本文、AIへの引き継ぎ文書も対象。詳細な業種・地域などを組み合わせて特定しやすくしない。

これは実施内容の紹介で、成果の検証を行った事例記事ではない。日付、人数、満足度、削減時間、浸透率、使用した製品、完了／継続状況は本人から追加の情報がない限り補わない。別途公開済みの取引先一覧から非公開案件の対応関係を推測しない。

## 旧URLと検証

旧 `/speaking/keynote/`、`training/`、`partner/`、`advisory/` は、末尾スラッシュの有無を含め `/speaking/` へ301転送。転送先に固定のフラグメントを指定せず、従来共有した `#keynote-series`、`#management`、`#organization`、`#trends`、`#program`、`#conditions` を引き継げるようにする。新規リンクは直接 `/speaking/#training` 等へ向ける。

Cloudflare Pagesでは `public/_redirects` がHTTP転送を担う。Astroの静的リダイレクトHTMLは、ローカルプレビュー等の代替。サイトマップには統合ページだけを含め、旧ページを再生成して重複コンテンツにしない。

更新時は以下を確認する。

1. ビルド・型診断。H1が1つ、canonicalが `/speaking/`、4つのServiceと表示内容が一致すること。
2. 内部リンク先のアンカーが存在すること。旧8URLのHTTP転送、旧基調講演のフラグメント、新しい相談リンクの `kind`。
3. PC・390px・320pxの表示、横はみ出し、開閉のクリック／Enter操作、開いた内容の可視性、背景の動き。
4. 差分と配信HTMLに非公開の実社名が入っていないこと。匿名5件に新しい成果や製品を付け足していないこと。
5. マージコミットのデプロイ成功と本番URL。本番トップのお知らせ8件が残っていること。CMS未設定のプレビューは空になるため本番とは区別する。
