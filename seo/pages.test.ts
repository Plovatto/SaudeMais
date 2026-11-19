import { describe, expect, it } from 'vitest';
import { PUBLIC_PAGES, SITE_URL } from '../src/config/site';
import { renderHead, renderNoscript, renderPage, structuredData } from './pages';

const template =
  '<html lang="pt-BR"><head><!--seo:head--></head><body><!--seo:noscript--><div id="root"></div></body></html>';

const [home, signUp] = PUBLIC_PAGES;
if (!home || !signUp) throw new Error('Public pages are missing');

describe('seo pages', () => {
  it('fills the head with title, description, canonical, share cards and structured data', () => {
    const head = renderHead(home);

    expect(head).toContain(`<title>${home.title}</title>`);
    expect(head).toContain(`<meta name="description" content="${home.description}" />`);
    expect(head).toContain(`<link rel="canonical" href="${SITE_URL}/login" />`);
    expect(head).toContain('<meta name="robots" content="index, follow');
    expect(head).toContain(`<meta property="og:image" content="${SITE_URL}/og.jpg" />`);
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(head).toContain('<script type="application/ld+json">');
  });

  it('blocks indexing and drops the canonical when the page must not be indexed', () => {
    const head = renderHead(home, { index: false });

    expect(head).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(head).not.toContain('rel="canonical"');
  });

  it('describes the home as a web application and the other pages as pages of the site', () => {
    const graph = (page: typeof home) => structuredData(page)['@graph'].map((node) => node['@type']);

    expect(graph(home)).toEqual(['WebSite', 'WebApplication']);
    expect(graph(signUp)).toEqual(['WebSite', 'WebPage']);
  });

  it('keeps the json from closing the script tag early', () => {
    const head = renderHead({ ...home, description: 'texto </script><b>' });

    expect(head.match(/<\/script>/g)).toHaveLength(1);
  });

  it('replaces both markers and refuses a template without them', () => {
    const page = renderPage(template, signUp);

    expect(page).toContain(`<title>${signUp.title}</title>`);
    expect(page).toContain('<noscript>');
    expect(page).not.toContain('<!--seo:');
    expect(() => renderPage('<html><head></head></html>', signUp)).toThrow(/seo:head/);
  });

  it('links the other public pages inside the noscript block', () => {
    const noscript = renderNoscript();

    expect(noscript).toContain('href="/cadastro"');
    expect(noscript).not.toContain('href="/login"');
  });

  it('lists every public page in the sitemap file', async () => {
    const { readFileSync } = await import('node:fs');
    const sitemap = readFileSync('public/sitemap.xml', 'utf8');

    for (const { path } of PUBLIC_PAGES) expect(sitemap).toContain(`<loc>${SITE_URL}${path}</loc>`);
  });
});
