/**
 * microCMS のお知らせ（news）を読む。
 *
 * 環境変数が未設定でも例外を投げず空配列を返す。
 * キーを入れる前でもビルドが通り、お知らせだけが空の状態でサイトが出る。
 */

import THUMB_SIZES from '../data/news-thumbs.json';

export type NewsCategory = '登壇' | 'メディア' | 'イベント' | 'リリース';

export type NewsItem = {
  id: string;
  title: string;
  /** microCMS のセレクトは単一選択でも配列で返る */
  category: NewsCategory[];
  publishedDate: string;
  excerpt?: string;
  thumbnail?: { url: string; width: number; height: number };
  /**
   * 旧サイトから取り込んだ記事のサムネイル。`/news/<スラッグ>.webp` を入れる。
   * microCMS のメディアフィールドには外部URLを登録できないため、
   * 取り込み分だけこのテキストフィールドを使う。新規投稿は thumbnail 側でよい。
   */
  thumbnailUrl?: string;
  body?: string;
  externalUrl?: string;
  eventName?: string;
  audience?: string;
  scale?: string;
  location?: string;
};

const DOMAIN = import.meta.env.MICROCMS_SERVICE_DOMAIN;
const KEY = import.meta.env.MICROCMS_API_KEY;

export const cmsConfigured = Boolean(DOMAIN && KEY);

/** 記事の遷移先。外部リンクがあればそちら、無ければ詳細ページ。 */
export function newsHref(item: NewsItem): string {
  return item.externalUrl?.trim() || `/news/${item.id}/`;
}

export function isExternal(item: NewsItem): boolean {
  return Boolean(item.externalUrl?.trim());
}

/** 表示用の日付。2026-07-16T00:00:00.000Z → 2026.07.16 */
export function formatDate(raw: string): string {
  const m = String(raw ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : String(raw ?? '');
}

export function categoryOf(item: NewsItem): string {
  return item.category?.[0] ?? 'お知らせ';
}

export type Thumb = {
  src: string;
  srcset?: string;
  width?: number;
  height?: number;
};

/**
 * 記事のサムネイル。microCMS のメディアがあればそれを、
 * 無ければ取り込み分の静的ファイル（/news/<スラッグ>.webp）を使う。
 * どちらも無ければ null。
 */
export function thumbOf(item: NewsItem): Thumb | null {
  const media = item.thumbnail;
  if (media?.url) {
    return {
      src: `${media.url}?fm=webp&w=1200`,
      srcset: [400, 800, 1200].map((w) => `${media.url}?fm=webp&w=${w} ${w}w`).join(', '),
      width: media.width,
      height: media.height,
    };
  }

  const path = item.thumbnailUrl?.trim();
  if (!path) return null;

  const slug = path.replace(/^.*\//, '').replace(/\.webp$/, '');
  const size = (THUMB_SIZES as Record<string, [number, number]>)[slug];
  // 幅560pxの軽い版を同じ場所に置いてある。一覧では基本こちらが選ばれる。
  const small = path.replace(/\.webp$/, '-sm.webp');
  return {
    src: path,
    srcset: `${small} 560w, ${path} ${size?.[0] ?? 1200}w`,
    width: size?.[0],
    height: size?.[1],
  };
}

type ListResponse = { contents: NewsItem[]; totalCount: number };

/** microCMS の list API が1回で返せる上限。 */
const PAGE = 100;

async function fetchPage(limit: number, offset: number): Promise<ListResponse> {
  const url = new URL(`https://${DOMAIN}.microcms.io/api/v1/news`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));
  // 掲載日の新しい順。過去分をあとから登録しても並びが崩れない。
  url.searchParams.set('orders', '-publishedDate');

  const res = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': KEY! } });
  if (!res.ok) {
    throw new Error(`microCMS ${res.status} ${await res.text().catch(() => '')}`);
  }
  return (await res.json()) as ListResponse;
}

/** 100件ずつ切り出されるので、必要な数がそろうまでめくる。 */
async function fetchList(limit: number): Promise<NewsItem[]> {
  const items: NewsItem[] = [];
  let total = Infinity;
  while (items.length < limit && items.length < total) {
    const page = await fetchPage(Math.min(PAGE, limit - items.length), items.length);
    total = page.totalCount;
    if (!page.contents?.length) break;
    items.push(...page.contents);
  }
  return items;
}

/**
 * お知らせを取得する。
 * 未設定・通信失敗のときは空配列を返し、ビルドは止めない。
 */
export async function getNews(limit = 500): Promise<NewsItem[]> {
  if (!cmsConfigured) {
    console.warn('[microcms] 環境変数が未設定のため、お知らせは空で書き出します');
    return [];
  }
  try {
    return await fetchList(limit);
  } catch (e) {
    console.error('[microcms] 取得に失敗しました:', e instanceof Error ? e.message : e);
    return [];
  }
}
