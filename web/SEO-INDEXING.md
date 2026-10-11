# Fixing "Pages aren't indexed" in Search Console

This documents the root cause of the indexing report and the steps to resolve it.

## The core problem: the canonical host must match the host that serves

The site is served from **`www.shenodev.tech`**. The apex domain redirects to it:

```
http://shenodev.tech/     308 → https://shenodev.tech/
https://shenodev.tech/    308 → https://www.shenodev.tech/   ← serving host
```

But every SEO signal in the code says the opposite — the **apex** is canonical:

- `<link rel="canonical">` on every page → `https://shenodev.tech/...`
- `sitemap.xml` lists apex URLs
- `robots.txt` `Host:` and `Sitemap:` → apex
- Open Graph URLs, JSON-LD `@id`/`url`, and `llms.txt` → apex

So Google reads the sitemap's apex URLs, follows each one, and lands on a redirect.
That is exactly what `Page with redirect` means. It also splits signals between two
hosts and depresses crawling of the rest of the site (`Discovered – currently not
indexed`).

## Required action (Vercel dashboard — cannot be done from the repo)

The code already treats **apex `shenodev.tech`** as canonical (the correct, brandable
choice), so the fix is to make Vercel serve that host and redirect `www` to it.

1. Vercel → your **web** project → **Settings → Domains**.
2. If `www.shenodev.tech` is the primary domain, make **`shenodev.tech` the Primary
   Domain** (or set `www.shenodev.tech` to **Redirect to** `shenodev.tech`).
3. Confirm the redirect direction flips: `https://www.shenodev.tech/` should 308 to
   `https://shenodev.tech/`, and `https://shenodev.tech/` should return 200.

No code change is needed for this step — the canonicals/sitemap/robots already target
the apex. If you instead prefer `www` as canonical, the code would need every
`https://shenodev.tech` reference swapped to `https://www.shenodev.tech`
(`layout.tsx`, `page.tsx`, each page's `metadata.alternates`, `JsonLd.tsx`,
`sitemap.ts`, `robots.ts`, `public/llms.txt`, and `e2e/seo.spec.ts`).

## Code fixes already applied in this repo

| File | Change |
| --- | --- |
| `src/app/layout.tsx` | Removed the site-wide `alternates.canonical`. A canonical in the root layout is inherited by every route without its own, so `/unsubscribe` and the 404 page were pointing at the homepage. |
| `src/app/page.tsx` | The homepage now declares its own canonical (`https://shenodev.tech`). |
| `src/app/sitemap.ts` | Replaced per-request `new Date()` (which told Google every URL changed on every crawl) with stable per-page `lastmod` dates. Bump them when content changes. |
| `next.config.mjs` | Added 308 redirects: `/index` (returned a 200 duplicate of the homepage) plus common stale paths (`/home`, `/about`, `/contact`, `/services`, `/pricing`, `/projects`, `/portfolio`, `/apply`, `/quote`). |

## Search Console steps (after deploying + the Vercel change)

1. **URL Inspection** → inspect `https://shenodev.tech/` → **Request Indexing**. Repeat
   for `/work` and `/discovery`.
2. **Page indexing → Page with redirect**: click each row to see the listed URL. Once the
   apex serves 200, these should drop out on the next validation. Click **Validate Fix**.
3. **Not found (404)**: click the row to read the **exact** URL Google hit (the code makes
   no internal link 404 — every `href` targets an existing route, so this is a stale or
   external URL). Add a matching 308 entry to the `redirects()` list in `next.config.mjs`,
   then re-validate.
4. **Excluded by 'noindex' (1)**: this is **`/unsubscribe`**, and it is intentional
   (`noindex, nofollow`). It is linked in the footer, which is why Google crawls it. This
   bucket is *not a bug* — leave it, and re-validate to clear it from the report.
5. **Discovered – currently not indexed**: once the canonical host is settled, these
   resolve over the next few crawls. They are the thin legal pages plus footer links;
   keeping them internally linked (they are) and in the sitemap (they are) is enough.

## Verify the live behaviour

```
curl -sI https://shenodev.tech/            # expect: HTTP/1.1 200 OK
curl -sI https://www.shenodev.tech/        # expect: 308 Location: https://shenodev.tech/
curl -s  https://shenodev.tech/sitemap.xml  # every <loc> should be https://shenodev.tech/...
```

All `<loc>` URLs in the sitemap must return **200 without a redirect**. That is the
definition of a healthy canonical host.
