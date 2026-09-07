# 資料作成・PDF・配信の引き継ぎ

最終確認：2026-09-07。資料本体は **[ozaken-AI/ozaken-materials](https://github.com/ozaken-AI/ozaken-materials)** で管理し、[content.ozaken.ai](https://content.ozaken.ai/) で配信する。プロフィール側の `ozaken-AI/profile` へ生成系を複製しない。

本書は、会話履歴がないAIが作業先を選び、既存の作成手順へ進むためのガイド。資料側の最新の手順・スクリプトを読んでから実行する。本書の確認日以降に変更があれば、資料側の実装と新しい本人指示を照合する。

## 最初に開く文書

パスは資料リポジトリを基準にしている。`.claude/` という名前でも、Claude以外のAIが読んで使える文章・スクリプトである。

| 作業 | 正本 |
|---|---|
| 構成、分類、公開先、共通部品 | [README](https://github.com/ozaken-AI/ozaken-materials/blob/main/README.md) |
| 講演・研修・Udemy等の資料を作る／更新する | [ozaken-shiryo / SKILL.md](https://github.com/ozaken-AI/ozaken-materials/blob/main/.claude/skills/ozaken-shiryo/SKILL.md) |
| 再生成できるソースを残す | [sources / README](https://github.com/ozaken-AI/ozaken-materials/blob/main/.claude/skills/ozaken-shiryo/sources/README.md) |
| 内容とデザインを厳しく評価する | [ozaken-hyoka / SKILL.md](https://github.com/ozaken-AI/ozaken-materials/blob/main/.claude/skills/ozaken-hyoka/SKILL.md) |
| 日本語を整える | [natural-japanese / SKILL.md](https://github.com/ozaken-AI/ozaken-materials/blob/main/.claude/skills/natural-japanese/SKILL.md) |
| 週次トレンドの仕組み・号の作成 | [weekly-system.md](https://github.com/ozaken-AI/ozaken-materials/blob/main/docs/weekly-system.md) |
| 週次の情報収集 | [weekly-sweep-runbook.md](https://github.com/ozaken-AI/ozaken-materials/blob/main/docs/weekly-sweep-runbook.md) |
| ニュースレター・登録者の運用 | [newsletter-system.md](https://github.com/ozaken-AI/ozaken-materials/blob/main/docs/newsletter-system.md) |

プロフィールの肩書き・実績は、このリポジトリの [文章・素材の運用](content-and-assets.md) と `src/lib/site.ts` を参照する。登壇300回超は2025年、Udemy受講者数は2026年8月時点。資料の自己紹介でも期間を落とさない。

## 作業する場所を決める

資料側の `main` が本番。Cloudflare Pagesのプロジェクトは `ozaken-materials`、静的HTMLを配信する。プロフィール側の長い本番ブランチ名を資料側で使わない。

| 分類 | 内容 |
|---|---|
| `01_concept` | なぜ・何を考えるか |
| `02_models` | モデルの能力・仕組み |
| `03_tools` | ツール |
| `04_practice` | 個人の実践 |
| `05_drive` | 組織の変革・推進 |
| `06_people` | 人材・学び |
| `07_risk` | リスク・ガバナンス |
| `08_industry` / `09_role` | 業界別・職種別 |
| `AX_Table` / `Training` / `Udemy` | シリーズ、企業研修、講座の裏資料。掲載区分は `--backstage` |
| `weekly/` | 週次号、収集結果、継続して見る論点 |
| `99_assets/` | 画像、配布物、PDF生成元など |

ファイル名・URLは英語の小文字とハイフンを基本にし、現行の分類・連番規則に合わせる。既存URLを気軽に変更しない。移動時は既存のリンク、旧URLの誘導、QRの符号化先まで更新する。表示文字の置換だけではQRは変わらない。

## 資料を作る流れ

1. **依頼条件を確認する。** 対象者、目的、持ち時間、利用場面、公開範囲、必要な形式、資料のみかワークシート付きか。既に回答・指示がある条件は引き継ぎ、同じ確認を繰り返さない。ワークシートを付ける場合は、最初から演習の停止点と書き込む時間を構成に含める。
2. **既存の説明と根拠を調べる。** 資料側の `find.py`、`crossref.py map` と既存の生成元を読み、同じ概念の正典に合わせる。時点で変わる料金・仕様・法令・発表は一次情報で確認し、URL・確認日・単位・期間を残す。本人の見解、一般的事実、独自の計算を分ける。
3. **構成を決める。** 1画面1メッセージ、図が主役。各セクションに図を置き、途中から投影しても意味が通るようにする。カード本文は2〜4行を目安にする。本文セクションは現行の検査に合わせて奇数本、light / navyを交互にし、最後はnavy。図の種類を使い分ける。
4. **生成元を編集する。** `.claude/skills/ozaken-shiryo/sources/` の該当ジェネレーターを探し、新規なら既存テンプレートを基にする。生成済み・暗号化済みHTMLを直接直して終わりにしない。METAのtitle・descも付け、再生成方法と出力先をソースに残す。
5. **組版・検査・暗号化する。** `publish.py` で本文フラグメントからページを作る。新規と更新のオプションを区別する。生成元がある既存資料は、その生成手順を優先する。
6. **実際に開いて確認する。** 表紙、図、全セクション、投影時の文字サイズ、狭い画面、移動操作、鍵による開き方、リンク、QR、ダウンロードを確認する。スクリプトの検査成功だけで見た目の確認を省略しない。ブラウザ自動化は利用環境の制約に従う。
7. **評価して直す。** `ozaken-hyoka` のメッセージ、独自の視点、分類の整合、興味、デザインの5軸で評価する。5点中2点以下の項目は修正。一般論の寄せ集め、根拠のない断定、図のはみ出しを残さない。日本語の点検も行う。
8. **関連資料と公開情報を整える。** `crossref_data.py` の対応を更新し、関連リンクをpreviewしてから反映・検査・マトリクス更新。掲載先と配布物も確認し、許可された範囲で公開する。

### コマンドの場所と注意

以下は**資料リポジトリのルート**からの形。`/tmp/body-example.html` と出力名は説明用で、存在する生成物・依頼された分類へ置き換える。`OZAKEN_PW` は安全な方法で環境に設定済みであることを前提とし、値をコマンド・チャット・Gitに書かない。

```bash
python3 .claude/skills/ozaken-shiryo/scripts/find.py 検索語
python3 .claude/skills/ozaken-shiryo/scripts/crossref.py map

# 新規。--list は一覧へ載せるタイトル
python3 .claude/skills/ozaken-shiryo/scripts/publish.py \
  /tmp/body-example.html 03_tools/example.html --list '資料タイトル'

# 既存。URLと既存の鍵を維持する
python3 .claude/skills/ozaken-shiryo/scripts/publish.py \
  /tmp/body-example.html 03_tools/example.html --update
```

`--backstage` は裏資料の一覧へ載せる。`--list` なしは一覧掲載を省略するが、生成・台帳登録は行う。**`publish.py` はローカルファイルの生成・掲載情報更新であり、それだけでGitHubへのpushが完了するわけではない。**

既存ページの更新に `lockbox.create` を使うと鍵が変わる。通常は `--update`、必要な低水準処理は既存鍵を保持する `lockbox.encrypt`。すでに配った鍵やURLを意図せず無効にしない。

`reapply`、styleの正規化、crossrefの一括操作は多数の資料を書き換える。資料側の手順に従って **`check_blocks.py save` → 操作 → `check_blocks.py`** で比較し、Git差分も確認する。過去に本文の検査を通ったままCSS・演出が大量に消えた事故が記録されている。単純な正規表現で `</style>` までまとめて除去しない。

## PDF・ワークシート

- 生成元は資料側の `99_assets/pdf-src/`。再生成用ソース、入力、出力の対応を残す。一時HTMLだけで納品を終えない。
- 配布用PDFは原則16:9（338.67×190.5mm）。`make_pdf.mjs` の既定値を使う。書き込むワークシートはA4縦の `a4p`。その他のA4は本人から指定がある場合に使う。
- 生成には `.claude/skills/ozaken-shiryo/scripts/make_pdf.mjs` を使う。フォントを参照できる位置にHTMLを生成し、資料側の既存ジェネレーターの例に従う。
- **PDFは親HTMLの暗号化の外側で、公開URLから取得できる。** 公開版に個別パスワード、名簿、非公開の顧客情報を載せない。鍵付きの当日配布版が必要なら、公開版と分け、配布版を公開Gitへ入れない。
- 全ページを描画して、欠け・重なり・文字化け・余白・図のラベルを確認する。ワークシートは印刷・手書きできる空間を確認する。QRは実際の遷移先まで検証する。
- ページからの配布導線は既存の `page_parts.dl()` を使う。資料側の検査で禁止される独自CTAに置き換えない。

## 公開と鍵の扱い

資料側のREADMEに従い、ソースと出力、台帳、一覧、関連リンク、必要なOGP画像を整える。アセット更新時は資料側ルートで以下を実行し、生成差分を確認する。

```bash
python3 scripts/version-site-assets.py
python3 scripts/version-site-assets.py --check
git diff --check
```

資料側の `main` へ反映するGit手順は、作業時の指示と権限に従う。push後はCloudflare `ozaken-materials` の対象コミットの配信と公開URLを確認する。プロフィール側の `npm run build` では資料は公開されない。

マスター、共通資料キー、個別資料キーの対象範囲を維持する。`tools`、`passwords`、`backstage`、`matrix` などの管理用ページはマスター専用。週次購読用の鍵は資料共通キーと別系統。見た目の調整でアクセス対象を広げない。

資料トップを変更するときは `99_assets/materials-home.css` / `.js` と既存の `#materials-home` の範囲を使う。カード、検索・分類、`data-ozk`、各ゲート、隠し操作、WEEKLY / LETTERの掲載用マーカーを維持する。大域の `.card` などを安易に上書きしない。

## 週次トレンド

[週次スイープ手順](https://github.com/ozaken-AI/ozaken-materials/blob/main/docs/weekly-sweep-runbook.md)は**収集・選別・深掘りまで**で、記事の執筆・公開は含まない。対象は直前に完了した水曜〜火曜、保存先は `weekly/<対象週の火曜>/sweep.json`。作業前に同じ週のファイルと作業ブランチを確認し、二重実行を避ける。

原典の発生日を確認し、更新日や検索結果の日付を発生日と混同しない。話題のない領域を古い情報で埋めず、日付の不一致・不明点を残す。本人の意見・投資判断をAIが捏造しない。

号の作成・公開が依頼された場合は [weekly-system.md](https://github.com/ozaken-AI/ozaken-materials/blob/main/docs/weekly-system.md) の実装済み手順と `weekly_publish.py` を読む。既存号の更新では鍵を保持する。設計案と実装済みの機能を区別する。定期実行を依頼されていなければ、新たなスケジュールは作成しない。

## ニュースレター・名簿・告知

配信は資料作成と別の操作。[ニュースレターの正本](https://github.com/ozaken-AI/ozaken-materials/blob/main/docs/newsletter-system.md)と資料側READMEを読む。`newsletter/send.sh --test` もテストメールを送る操作であり、見た目を確認するだけのコマンドではない。

宛先名簿の取り込み、D1への反映、本配信は対象と内容が依頼範囲に含まれる場合のみ実行する。CSV・取り込みSQL・メールアドレス・個別の問い合わせを公開リポジトリへ保存しない。配信の結果は必要な範囲で依頼者へ返す。

プロフィール側への告知は [お知らせの投稿手順](news-post.md)。資料の完成だけでCMS投稿・SNS・メール配信も許可されたとみなさない。

## 完了時に残す記録

タイトル、対象者と目的、元ソース・ジェネレーター、出力ファイル、公開URL、資料の分類、根拠の確認日、実施した画面・PDF検査、公開コミット、残った課題をPRや対応する文書に記録する。秘密の鍵は記録せず、管理場所と対象範囲だけを残す。
