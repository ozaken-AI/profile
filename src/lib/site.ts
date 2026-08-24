/** サイト全体で使い回す定数。文言を1か所に集める。 */

export const SITE = {
  name: '小澤健祐（おざけん）',
  url: 'https://ozaken.ai',
  vision: '人間とAIが共存する社会をつくる',
  mission: '分断を超え、つなぐ',
  role: '一般社団法人AICX協会　代表理事',
  email: 'kensuke.ozawa@aicx.jp',
  x: 'https://x.com/ozaken_AI',
  xHandle: '@ozaken_AI',
  contentSite: 'https://content.ozaken.ai/',
} as const;

/** 関与している組織。ヒーロー下のティッカーに流す。 */
export const AFFILIATIONS = [
  'AICX協会', 'Cynthialy', 'Visionary Engine', 'AI HYVE', 'Cinematorico',
  '日本HP', 'NTTデータグループ', '船橋市', '経済産業省',
  'NewsPicks', 'AI DIVE', 'AINOW', 'AI Agent Day',
] as const;

export const NUMBERS = [
  { value: 300,   unit: '回 ／ 年', comma: false,
    key: '講演・研修・パネル登壇',
    note: ['年間営業日245日を上回る。', 'ほぼ毎営業日、どこかで話している。'] },
  { value: 1500,  unit: '本 超', comma: true,
    key: 'AI関連記事の執筆',
    note: ['AI専門メディア「AINOW」', '編集長を務めた時期を含む。'] },
  { value: 5600,  unit: '名', comma: true,
    key: 'AI Agent Day 動員',
    note: ['主催者として全体設計と', 'モデレーションを担当。'] },
  { value: 50000, unit: '名 超', comma: true,
    key: 'Udemy講座の受講者',
    note: ['企画・制作した講座で', '実際に学んだ人の数。'] },
] as const;

export const ROLES = [
  { org: '一般社団法人AICX協会', title: '代表理事' },
  { org: '株式会社Cynthialy', title: 'CCO' },
  { org: '株式会社Visionary Engine', title: '取締役' },
  { org: '株式会社AI HYVE', title: '取締役' },
  { org: '株式会社Cinematorico', title: 'COO' },
  { org: '日本HP／NTTデータグループ', title: 'アドバイザー' },
  { org: '船橋市', title: '生成AIアドバイザー' },
] as const;

export const MENU = [
  { idx: 'KEYNOTE', title: '経営層向け 生成AI基調講演', spec: '60–90 min ／ 質疑応答つき',
    body: '生成AIとAIエージェントで、自社の事業構造のどこが置き換わるのか。抽象論ではなく、意思決定の順番として話します。',
    forWhom: '経営会議・役員合宿・業界団体の年次総会' },
  { idx: 'LITERACY', title: '全社向け 生成AIリテラシー研修', spec: '60–120 min ／ オンライン可',
    body: '「使ってみる」までの心理的な壁を先に外す。ツールの操作説明ではなく、明日の業務で1つ試す気にさせるところまでを担当します。',
    forWhom: '全社キックオフ・部門別のAI研修' },
  { idx: 'ADVISORY', title: 'AI戦略の伴走支援', spec: '月次・継続 ／ 顧問契約',
    body: '投資の順番と撤退線を一緒に決めます。「ご判断はお任せします」で終わる助言はしません。自分なら止めるかどうかを言います。',
    forWhom: 'AI推進室の壁打ち・導入ロードマップ策定' },
  { idx: 'WORKSHOP', title: 'AIエージェント実装ワークショップ', spec: '半日–1日 ／ ハンズオン',
    body: '自社の業務プロセスを分解して、どこを自動化し、どこに人の承認を残すかを手を動かして決めてもらいます。',
    forWhom: '業務プロセスの分解・PoCの設計レビュー' },
] as const;

export const STEPS = [
  { n: '01', h: '連絡をもらう',
    p: '目的・対象者・想定人数・日程。この4つだけ書いてもらえれば、可否と概算をその場で返します。' },
  { n: '02', h: 'ゴールを決める',
    p: '「何を話すか」ではなく「終わったあと参加者に何をしていてほしいか」を一緒に決めます。ここで成否がほぼ決まります。' },
  { n: '03', h: 'その会のために組み直す',
    p: '業種・職種・すでに使っているツールに合わせて構成を作ります。同じスライドは二度使いません。' },
  { n: '04', h: '終わったあとを渡す',
    p: '当日の質疑で出た論点と、次に打つ手を整理してお渡しします。持ち帰って社内で回せる形にします。' },
] as const;

export const FAQ = [
  { q: '費用はどれくらいですか',
    a: '内容・時間・形式によって変わります。予算の上限を先に伝えていただければ、その範囲で組める形をこちらから提案します。予算が理由で相談をためらう必要はありません。' },
  { q: 'オンラインでも対応できますか',
    a: '対応します。研修とワークショップはオンラインのほうが参加者が手を動かしやすい場合もあるため、目的次第でこちらから提案することもあります。' },
  { q: 'どれくらい前に連絡すればいいですか',
    a: '可能であれば2〜3か月前。ただし直前でも空いていればお受けします。まず日程だけ投げてもらえれば、空き状況をすぐ返します。' },
  { q: '資料や写真をもらえますか',
    a: 'プロフィール文（長短2種）、顔写真、肩書きの正式表記をまとめたプレスキットを用意しています。告知ページを作る際はそちらをお使いください。' },
] as const;
