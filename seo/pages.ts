import type { Plugin } from 'vite';
import {
  pageUrl,
  PUBLIC_PAGES,
  ROBOTS_BLOCKED,
  ROBOTS_INDEXABLE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  type PublicPage,
} from '../src/config/site';

const SHARE_IMAGE = `${SITE_URL}/og.jpg`;
const SHARE_IMAGE_ALT = 'Saúde+: agende consultas e exames online';
const HEAD_MARKER = '<!--seo:head-->';
const NOSCRIPT_MARKER = '<!--seo:noscript-->';

const [HOME] = PUBLIC_PAGES;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function structuredData({ path, title, description }: PublicPage) {
  const website = `${SITE_URL}/#website`;
  const url = pageUrl(path);
  const siteNodes = [
    {
      '@type': 'WebSite',
      '@id': website,
      url: pageUrl('/login'),
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: 'pt-BR',
    },
  ];
  if (path !== '/login') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        ...siteNodes,
        {
          '@type': 'WebPage',
          '@id': `${url}#page`,
          url,
          name: title,
          description,
          inLanguage: 'pt-BR',
          isPartOf: { '@id': website },
        },
      ],
    };
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      ...siteNodes,
      {
        '@type': 'WebApplication',
        '@id': `${SITE_URL}/#app`,
        name: SITE_NAME,
        url,
        description,
        applicationCategory: 'HealthApplication',
        operatingSystem: 'Web',
        inLanguage: 'pt-BR',
        browserRequirements: 'Requer JavaScript',
        image: SHARE_IMAGE,
        isPartOf: { '@id': website },
      },
    ],
  };
}

export function renderHead(page: PublicPage, { index = true }: { index?: boolean } = {}): string {
  const url = pageUrl(page.path);
  const meta = (attribute: 'name' | 'property', key: string, value: string) =>
    `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`;
  const jsonLd = JSON.stringify(structuredData(page)).replaceAll('<', '\\u003c');
  return [
    `<title>${escapeHtml(page.title)}</title>`,
    meta('name', 'description', page.description),
    meta('name', 'robots', index ? ROBOTS_INDEXABLE : ROBOTS_BLOCKED),
    ...(index ? [`<link rel="canonical" href="${url}" />`] : []),
    meta('property', 'og:type', 'website'),
    meta('property', 'og:locale', 'pt_BR'),
    meta('property', 'og:site_name', SITE_NAME),
    meta('property', 'og:title', page.title),
    meta('property', 'og:description', page.description),
    meta('property', 'og:url', url),
    meta('property', 'og:image', SHARE_IMAGE),
    meta('property', 'og:image:type', 'image/jpeg'),
    meta('property', 'og:image:width', '1200'),
    meta('property', 'og:image:height', '630'),
    meta('property', 'og:image:alt', SHARE_IMAGE_ALT),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', page.title),
    meta('name', 'twitter:description', page.description),
    meta('name', 'twitter:image', SHARE_IMAGE),
    meta('name', 'twitter:image:alt', SHARE_IMAGE_ALT),
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join('\n    ');
}

export function renderNoscript(): string {
  const links = PUBLIC_PAGES.filter(({ path }) => path !== '/login')
    .map(({ path, title }) => `<li><a href="${path}">${escapeHtml(title)}</a></li>`)
    .join('');
  return [
    '<noscript>',
    '<main style="max-width: 44rem; padding: 2rem; font-family: system-ui, sans-serif">',
    `<h1>${escapeHtml(SITE_NAME)}</h1>`,
    `<p>${escapeHtml(SITE_DESCRIPTION)}</p>`,
    '<p>Ative o JavaScript no navegador para agendar consultas e exames.</p>',
    `<ul>${links}</ul>`,
    '</main>',
    '</noscript>',
  ].join('\n    ');
}

export function renderPage(html: string, page: PublicPage, options?: { index?: boolean }): string {
  for (const marker of [HEAD_MARKER, NOSCRIPT_MARKER]) {
    if (!html.includes(marker)) throw new Error(`index.html is missing ${marker}`);
  }
  return html
    .replace(HEAD_MARKER, () => renderHead(page, options))
    .replace(NOSCRIPT_MARKER, () => renderNoscript());
}

export function seoPages(): Plugin {
  return {
    name: 'seo-pages',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        return context.server && HOME ? renderPage(html, HOME) : html;
      },
    },
    generateBundle(_, bundle) {
      const entry = bundle['index.html'];
      if (entry?.type !== 'asset' || !HOME) return;
      const template = String(entry.source);
      entry.source = renderPage(template, HOME);
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: renderPage(template, HOME, { index: false }),
      });
      for (const page of PUBLIC_PAGES) {
        this.emitFile({
          type: 'asset',
          fileName: `${page.path.slice(1)}.html`,
          source: renderPage(template, page),
        });
      }
    },
  };
}
