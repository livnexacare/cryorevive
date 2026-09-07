import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  /** Path (e.g. "/booking") or absolute URL of the current page. */
  url?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

/** Canonical site origin. Override per-environment with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cryorevive.in'
).replace(/\/$/, '');

const SITE_NAME = 'CryoRevive';
const DEFAULT_TITLE =
  'CryoRevive — Elite Recovery & Performance Centre | Delhi NCR';
const DEFAULT_DESCRIPTION =
  'CryoRevive — Ice Bath, Steam Sauna, Contrast Therapy, Physiotherapy and more. Science-backed recovery for athletes in Delhi NCR. Recover harder. Come back stronger.';
/** 1200x630 branded card. Must resolve to a public, absolute URL for WhatsApp / Facebook / LinkedIn. */
const DEFAULT_IMAGE = '/og-image.jpg';

/** Turn a path or partial URL into an absolute URL rooted at SITE_URL. */
function absoluteUrl(pathOrUrl?: string): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

/**
 * SEO / social-share tags for use inside a page component (next/head).
 * Every tag carries a stable `key` so a page-level <SEO> cleanly overrides
 * the site-wide default rendered in _app.tsx.
 */
export function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noindex = false,
}: SEOProps) {
  // Only emit canonical / og:url when a page (or the _app default) supplies a
  // path. Pages that omit `url` inherit the value set in _app.tsx via key dedup.
  const canonical = absoluteUrl(url);
  const imageUrl = absoluteUrl(image) ?? `${SITE_URL}${DEFAULT_IMAGE}`;

  return (
    <Head>
      <title key="title">{title}</title>
      <meta key="description" name="description" content={description} />
      {canonical && <link key="canonical" rel="canonical" href={canonical} />}
      {noindex ? (
        <meta key="robots" name="robots" content="noindex, nofollow" />
      ) : (
        <meta key="robots" name="robots" content="index, follow" />
      )}

      {/* Open Graph — Facebook, WhatsApp, LinkedIn, Slack, iMessage */}
      <meta key="og:type" property="og:type" content={type} />
      <meta key="og:site_name" property="og:site_name" content={SITE_NAME} />
      <meta key="og:title" property="og:title" content={title} />
      <meta
        key="og:description"
        property="og:description"
        content={description}
      />
      {canonical && (
        <meta key="og:url" property="og:url" content={canonical} />
      )}
      <meta key="og:image" property="og:image" content={imageUrl} />
      <meta
        key="og:image:secure_url"
        property="og:image:secure_url"
        content={imageUrl}
      />
      <meta key="og:image:type" property="og:image:type" content="image/jpeg" />
      <meta key="og:image:width" property="og:image:width" content="1200" />
      <meta key="og:image:height" property="og:image:height" content="630" />
      <meta key="og:image:alt" property="og:image:alt" content={title} />
      <meta key="og:locale" property="og:locale" content="en_IN" />

      {/* Twitter / X */}
      <meta
        key="twitter:card"
        name="twitter:card"
        content="summary_large_image"
      />
      <meta key="twitter:title" name="twitter:title" content={title} />
      <meta
        key="twitter:description"
        name="twitter:description"
        content={description}
      />
      <meta key="twitter:image" name="twitter:image" content={imageUrl} />
      <meta key="twitter:image:alt" name="twitter:image:alt" content={title} />
    </Head>
  );
}

/**
 * @deprecated Use <SEO /> inside a page (or the site-wide default in _app.tsx).
 * Kept as a thin wrapper so any lingering imports keep working.
 */
export function SEOElements(props: SEOProps) {
  return <SEO {...props} />;
}
