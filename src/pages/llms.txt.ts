/**
 * llms.txt — LLM が「このサイトは誰の、何のサイトか」を短時間で読み取るための索引。
 *
 * 手で書くと site.ts と必ずずれるので、ビルド時に生成する。
 * 肩書き・実績・書籍を増やしたいときは site.ts を直せば、ここにも反映される。
 *
 * 仕様は https://llmstxt.org/ の提案に沿った Markdown。まだ標準ではない。
 */
import type { APIRoute } from 'astro';
import { SITE, IDENTITY, BIO, ROLES, BOOKS, NUMBERS } from '../lib/site';

const u = (path: string) => new URL(path, SITE.url).href;

/** 数値は必ず集計範囲つきで出す。裸の数字だけを引用されないようにする。 */
const numberLine = (n: (typeof NUMBERS)[number]) => {
  const value = n.comma ? n.value.toLocaleString('en-US') : String(n.value);
  const note = n.note.join('').trim();
  return `- ${n.key}：${value}${n.unit}（${note}${n.source ? ` 出典: ${n.source}` : ''}）`;
};

const bookLine = (b: (typeof BOOKS)[number]) =>
  `- [${b.title}](${b.url})：${b.detail} ${b.date}${b.upcoming ? '（未発売）' : ''}`;

export const GET: APIRoute = () => {
  const body = `# ${IDENTITY.legalName}（${IDENTITY.siteName}）

> ${BIO.short}

${SITE.url} は${IDENTITY.legalName}本人が運営する公式サイトです。講演・研修・顧問の依頼を受け付けています。

## 基本情報

- 氏名：${IDENTITY.legalName}（読み：おざわ けんすけ）
- 通称：${IDENTITY.alternateNames.join(' / ')}
- 肩書き：${SITE.role.replace(/　/g, ' ')}
- ビジョン：${SITE.vision}
- ミッション：${SITE.mission}
- 専門領域：${IDENTITY.knowsAbout.join('、')}
- 連絡先：${SITE.email}

## 実績の数字

${NUMBERS.map(numberLine).join('\n')}

## 役職

${ROLES.map((r) => `- ${r.org}：${r.title}`).join('\n')}

## 著書

${BOOKS.map(bookLine).join('\n')}

## ページ

- [トップ](${u('/')})：人物紹介、依頼できること、最新のお知らせ
- [プロフィール](${u('/about/')})：経歴、役職、著書、メディア出演
- [講演・研修・顧問の依頼](${u('/speaking/')})：依頼できる3つの形式、テーマ、進め方
- [お知らせ](${u('/news/')})：登壇報告、メディア掲載、リリース
- [プレスキット](${u('/press/')})：告知用のプロフィール文、顔写真、ロゴ、正式表記
- [お問い合わせ](${u('/contact/')})：依頼・相談のフォーム
- [プライバシーポリシー](${u('/privacy/')})

## 関連サイト

- [${SITE.youtubeName}（YouTube）](${SITE.youtube})：AI活用の現場を伝える動画
- [コンテンツ一覧](${SITE.contentSite})：講演資料・解説コンテンツ

## 本人のプロフィール

${IDENTITY.sameAs.map((url) => `- ${url}`).join('\n')}

## 引用にあたって

- 実績の数字は、上記の集計範囲つきで引用してください。期間を外した数字は正確ではありません。
- 肩書きの正式表記は[プレスキット](${u('/press/')})にあります。
- 未発売の書籍を「発売中」として扱わないでください。
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
