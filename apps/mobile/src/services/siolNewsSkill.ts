export interface SiolNewsItem {
  title: string;
  url: string;
  summary: string;
}

const SIOL_URL = 'https://siol.net/pregled-dneva/';

const decodeHtml = (value: string) => value
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&#8211;|&ndash;/g, '–')
  .replace(/&#8217;|&rsquo;/g, '’')
  .replace(/&#([0-9]+);/g, (_, code) => String.fromCharCode(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

const cleanText = (value: string) => decodeHtml(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** Fetches the public Siol daily overview without going through our backend. */
export async function fetchSiolNews(limit = 5): Promise<SiolNewsItem[]> {
  const response = await fetch(SIOL_URL, { headers: { Accept: 'text/html' } });
  if (!response.ok) throw new Error(`Siol.net je vrnil napako ${response.status}.`);

  const html = await response.text();
  const items: SiolNewsItem[] = [];
  const seen = new Set<string>();
  const linkPattern = /<a\b(?=[^>]*class=["'][^"']*\bcard__link\b)(?=[^>]*href=["']([^"']+)["'])(?=[^>]*title=["']([^"']+)["'])[^>]*>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const path = match[1].split('#')[0];
    const url = path.startsWith('http') ? path : `https://siol.net${path.startsWith('/') ? path : `/${path}`}`;
    const title = cleanText(match[2]);
    const isArticle = /siol\.net\/(novice|sportal|trendi|avtomoto|mnenja)\//.test(url);
    if (!isArticle || title.length < 18 || seen.has(url) || /^(Novice|Sportal|Trendi|Avtomoto|Mnenja)$/.test(title)) continue;
    seen.add(url);
    items.push({ title, url, summary: '' });
    if (items.length === limit) break;
  }

  if (!items.length) throw new Error('Na Siol.net ni bilo mogoče najti novic.');
  return items;
}

export const SIOL_NEWS_SKILL_DESCRIPTION = 'Odpre siol.net in vrne 5 najnovejših novic.';
