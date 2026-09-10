# 基調講演シリーズの編集・企画

作成日：2026-09-10。本人の希望は「カンファレンスの基調講演を増やしたい」「経営論、組織論、トレンドまで幅広く」。[content.ozaken.ai](https://content.ozaken.ai/) の既存資料を起点に、主催者が選べる講演テーマをまとめた。

## 位置づけ

シリーズ名は **「AI時代の経営と組織の未来。」**。本人のビジョン「人間とAIが共存する社会をつくる。」を共通の軸にする。3回の連続受講を求める商品ではなく、1テーマから依頼でき、開催趣旨に合わせて組み合わせられる企画メニュー。

カンファレンスの主催者・企画担当者と、企業の経営層が、イベント全体で何を議論できるかを判断できるようにする。ツールの機能・操作の説明だけに寄せず、理論、現場の実践知、技術動向をつなぐ。研修・伴走支援・顧問・執筆・協会活動など、本人の活動全体の幅は引き続き伝える。

**3つの講演名は今回まとめた企画テーマで、過去のイベントで使用済みという意味ではない。** 「定番」「人気」「この演題で多数登壇」等の実績表現を追加しない。本人の希望で「代表的な登壇」の紹介は講演一覧・詳細から外した。`SPEAKING_EVIDENCE` の確認記録を理由に、紹介枠を復活させない。

## 3つの講演と構成の骨子

### 01 経営論：AI時代、企業の価値はどこに宿るのか

副題：既存事業の再定義と、競争優位のつくり方。

経営者・経営企画・事業責任者向け。顧客との関係、一次情報、現場の暗黙知から、既存事業の価値を捉え直す。結論を「AIを導入しましょう」で終えず、自社は何を提供し、何に対価をいただくのか、投資をどこに結びつけるのかを議論できる状態にする。

60分の例：前提と問い（10分）→既存事業の強み（20分）→経営・組織の意思決定（20分）→質疑と次の議論（10分）。

### 02 組織論：AIが働く組織で、人間は何を担うのか

副題：知識創造・人材育成・マネジメントを問い直す。

経営層・人事責任者・管理職・組織開発担当向け。AI-SECIを手がかりに、個人の知が組織へ広がる過程、仕事の型、任せる範囲と人間の責任、育成・評価をつなぐ。AIへの仕事の移管と人材への投資を、一緒に考える構成にする。

60分の骨子：働くのは誰かという問い（10分）→知識創造と仕事の型（20分）→人間の役割と育成・評価（20分）→質疑（10分）。

SECIモデルの原典と、AI時代への小澤の解釈を区別する。「独自に発明したSECI理論」や、学術的に検証済みのAI組織論であるかのように書かない。

### 03 技術トレンド：AIエージェントの最新技術トレンド

副題：いま何ができるのか、企業は何に備えるのか。

AI・テクノロジーカンファレンス、業界横断イベント、企業の技術フォーラム向け。本人の修正希望に合わせ、AIエージェントの最新技術動向を主題にした。主要モデル、ツール・業務システムとの連携、専門領域への特化を取り上げ、何ができるかと実装上の制約、企業で試す領域を整理する。経営・組織の講演と役割を分け、技術そのものへの関心にも応える。

60分の骨子：現在地と問い（10分）→3軸で読む技術の進化（20分）→企業での活用可能性と実装条件（20分）→質疑（10分）。

開催時点の一次情報で事例を更新する。起きた事実、本人の解釈、将来の見通しは分ける。特定の年のAGI到来や、仕事が必ず消えるといった予測を保証しない。

## 参照した資料と生成元

2026-09-10に公開トップの一覧と説明、資料リポジトリの以下の生成元を確認した。鍵付きページを復号しての閲覧は行っていない。ページ全文・図の再確認や新規資料作成には、資料側の正規の閲覧・生成手順を使う。

| 講演 | 資料 | 確認した生成元（資料リポジトリ） |
|---|---|---|
| 経営論 | [新規事業より、既存事業の再定義](https://content.ozaken.ai/01_concept/existing-business-first.html) | [gen_existing.py](https://github.com/ozaken-AI/ozaken-materials/blob/main/.claude/skills/ozaken-shiryo/sources/gen_existing.py) |
| 経営論 | [ビジネスモデルの変化](https://content.ozaken.ai/01_concept/business-model-shift.html) | [gen_bizmodel.py](https://github.com/ozaken-AI/ozaken-materials/blob/main/.claude/skills/ozaken-shiryo/sources/gen_bizmodel.py) |
| 組織論 | [AI-SECIモデル](https://content.ozaken.ai/01_concept/ai-seci.html) | [gen_seci.py](https://github.com/ozaken-AI/ozaken-materials/blob/main/.claude/skills/ozaken-shiryo/sources/gen_seci.py) |
| 組織論 | [人的資本経営の、新しい姿](https://content.ozaken.ai/06_people/human-capital-new-shape.html) | [gen_human_capital.py](https://github.com/ozaken-AI/ozaken-materials/blob/main/.claude/skills/ozaken-shiryo/sources/gen_human_capital.py) |
| 組織論の補助 | [生成AI時代の組織論](https://content.ozaken.ai/06_people/org-theory.html) | [gen_org_order.py](https://github.com/ozaken-AI/ozaken-materials/blob/main/.claude/skills/ozaken-shiryo/sources/gen_org_order.py)（追加章の生成元） |
| トレンド | [生成AIのトレンドは、3つの軸で読める](https://content.ozaken.ai/02_models/three-axes.html) | [gen_trend.py](https://github.com/ozaken-AI/ozaken-materials/blob/main/.claude/skills/ozaken-shiryo/sources/gen_trend.py) |
| トレンドの補助 | [「使うAI」から「任せるAI」へ](https://content.ozaken.ai/01_concept/use-to-delegate.html) | 今回は公開一覧のタイトル・説明とURLを確認 |

資料の主張を要約する場合も、元資料の断定を外部で検証された一般的事実とみなさない。プロフィールや実績の数値は資料トップから転記せず、[本人情報の確定条件](content-and-assets.md#実績の確定条件)を使う。

## サイトの編集先

| 対象 | 編集先 |
|---|---|
| シリーズ名、3講演のタイトル・概要・論点・対象・関連資料 | `src/lib/site.ts` の `KEYNOTE_SERIES` |
| トップと講演一覧の基調講演カード、形式・進め方 | `src/lib/site.ts` の `MENU` 内 `keynote` |
| 3講演の概要・開閉式の補足、専用スタイル | `src/components/KeynoteSeries.astro` |
| 基調講演ページ、SEO、60分の構成例 | `src/components/KeynoteSeries.astro`（構成例）、`src/pages/speaking/index.astro`（SEO） |
| 統合した依頼ページの入口、SEO | `src/pages/speaking/index.astro` |

詳細は `/speaking/#management`、`#organization`、`#trends`。主催者が共有できる固定アンカーとして維持する。2026-09-10の追加希望で一覧と詳細を `/speaking/` に統合した。旧 `/speaking/keynote/` は301転送し、既存のフラグメントを維持する。[統合ページの編集・検証](speaking-page.md)を参照。「代表的な登壇」枠はどのページにも戻さず、トップは既存の4形式カードから案内する。

関連資料はキーが必要なことを明記し、公開PDFの一覧にもリンクする。鍵をURLやサイトのソースへ付けない。料金は個別見積もり、基本時間は質疑を含む60〜90分。時間・納品物・権利の条件を勝手に増やさない。

## 今後、実際の登壇資料を作るとき

本更新は講演の企画・案内ページまで。3講演の完成スライド、PDF、紹介動画、主催者宛ての提案送信は含まない。YouTube等の追加施策は本人から追って対応する方針が示されている。

資料本体は[資料作成ガイド](materials.md)に従って `ozaken-AI/ozaken-materials` で作る。参加者、イベント全体のテーマ、持ち時間、後続セッション、開催時点の情報を確認し、本書の骨子から組み立てる。既存の生成元・図・概念の対応を調べ、資料側の評価・日本語・描画検証手順を実施する。新しい開催実績が生まれたら、正式演題・主催者・日付・役割を確認して別途記録する。

サイト更新時はビルド、型診断、H1・メタ・JSON-LDの整合、3つのアンカーと資料リンク、PC／390px／320pxの表示を確認する。動きは共通のrevealと背景演出を使うため、長いページでも本文が表示されることを確認する。本番公開後のお知らせ8件の確認も続ける。
