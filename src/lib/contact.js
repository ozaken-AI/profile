/** フォームと受信APIで共有。解析にはこの固定IDだけを使う。 */
export const CONTACT_KINDS = [
  { id: 'other', label: 'その他・まだ決まっていない', date: '希望する時期', audience: '対象となる方・部門', placeholder: '相談したいことや、現在困っていることをお知らせください。内容や時期が未定でも構いません。' },
  { id: 'keynote', label: '講演・登壇', date: '開催希望日・時期', audience: '参加対象・想定人数', placeholder: '開催趣旨、参加者、取り上げたいテーマをお知らせください。会場・オンライン、ご予算、録画や配信の希望も分かる範囲でどうぞ。' },
  { id: 'training', label: '社内研修・ワークショップ', date: '実施希望日・時期', audience: '受講対象・想定人数', placeholder: '身につけたいこと、参加者の職種やAI活用経験、利用中のツールをお知らせください。Gemini・Microsoft 365 Copilotなどの利用環境が未定でもご相談いただけます。' },
  { id: 'partner', label: '導入プロジェクトの伴走支援', date: '開始希望時期・想定期間', audience: '対象部門・推進体制', placeholder: '活用率が上がらない、全社に浸透しない、表層的な活用に止まるなど、現在の課題をお知らせください。対象部門や取り組み状況は、分かる範囲で構いません。' },
  { id: 'advisory', label: 'アドバイザリー・顧問', date: '開始希望時期・想定期間', audience: '相談する方・関与を希望する範囲', placeholder: '現在の経営・事業上の課題と、相談したい判断をお知らせください。希望する関わり方や期間は未定でも構いません。' },
  { id: 'writing', label: '執筆・監修', date: '希望する納期・時期', audience: '媒体・想定読者', placeholder: '媒体や企画の概要、想定する読者、執筆・監修の範囲をお知らせください。' },
  { id: 'media', label: '取材・メディア出演', date: '取材・公開の希望時期', audience: '媒体・視聴者層', placeholder: '媒体名、企画の趣旨、聞きたいテーマ、取材の形式をお知らせください。' },
];

export const CONTACT_TOPICS = [
  { id: 'management', kind: 'keynote', label: '経営論：AI時代、企業の価値はどこに宿るのか' },
  { id: 'organization', kind: 'keynote', label: '組織論：AIが働く組織で、人間は何を担うのか' },
  { id: 'trends', kind: 'keynote', label: 'AIエージェントの最新技術トレンド' },
  { id: 'ai-basics', kind: 'training', label: '生成AIの基礎・仕事での使い方' },
  { id: 'gemini', kind: 'training', label: 'Gemini活用研修・ワークショップ' },
  { id: 'copilot', kind: 'training', label: 'Microsoft 365 Copilot活用研修・ワークショップ' },
  { id: 'agent-workshop', kind: 'training', label: 'AIエージェント活用・業務設計ワークショップ' },
];

export const CONTACT_FIELDS = [
  { key: 'name', label: 'お名前', max: 200 }, { key: 'company', label: '会社・団体名', max: 200 },
  { key: 'email', label: 'メールアドレス', max: 200 }, { key: 'tel', label: '電話番号', max: 60 },
  { key: 'kind', label: 'ご依頼の種類', max: 100 }, { key: 'topic', label: 'テーマ・研修', max: 100 },
  { key: 'date', label: '希望時期・期間', max: 200 }, { key: 'audience', label: '対象・関与範囲', max: 200 },
  { key: 'message', label: 'ご相談内容', max: 8000 },
];

/** @param {unknown} value */
export function contactKind(value) {
  return CONTACT_KINDS.find(k => k.id === value || k.label === value) || CONTACT_KINDS[0];
}
/** @param {unknown} value @param {string} kind */
export function contactTopic(value, kind) {
  return CONTACT_TOPICS.find(t => t.id === value && t.kind === kind);
}
