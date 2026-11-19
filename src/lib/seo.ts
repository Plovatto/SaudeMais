import { pageUrl, ROBOTS_BLOCKED, ROBOTS_INDEXABLE, SITE_DESCRIPTION } from '@config/site';

export interface PageSeo {
  title: string;
  description?: string | undefined;
  path: string;
  index: boolean;
}

function ensure(selector: string, tag: 'meta' | 'link', attributes: Record<string, string>): HTMLElement {
  const found = document.head.querySelector<HTMLElement>(selector);
  if (found) return found;
  const created = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) created.setAttribute(name, value);
  document.head.append(created);
  return created;
}

function setMeta(key: 'name' | 'property', name: string, content: string): void {
  ensure(`meta[${key}="${name}"]`, 'meta', { [key]: name }).setAttribute('content', content);
}

export function applyPageSeo({ title, description = SITE_DESCRIPTION, path, index }: PageSeo): void {
  document.title = title;
  setMeta('name', 'description', description);
  setMeta('name', 'robots', index ? ROBOTS_INDEXABLE : ROBOTS_BLOCKED);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  const url = pageUrl(path);
  setMeta('property', 'og:url', url);
  if (!index) {
    document.head.querySelector('link[rel="canonical"]')?.remove();
    return;
  }
  ensure('link[rel="canonical"]', 'link', { rel: 'canonical' }).setAttribute('href', url);
}
