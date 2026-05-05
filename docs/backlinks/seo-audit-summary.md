# Somken Jobs SEO Readiness Audit

Audit date: 2026-05-06  
Site: https://somkenjobs.com

## Executive Summary

Somken Jobs is technically ready to begin careful backlink outreach, especially to universities, NGOs, employer partners, chambers, and professional associations. The public site is live, indexable, has a working sitemap index, has a dedicated job sitemap, and individual job pages expose `JobPosting` structured data.

The main improvement before larger outreach is to create stronger backlinkable destination pages. Most prospects should not be asked to link only to the homepage; outreach will work better when the site has useful resource pages such as Somalia NGO directories, Kenya career resources, graduate job guides, employer verification pages, and sector-specific hubs.

## Live Checks

| URL | Status | Result |
| --- | --- | --- |
| https://somkenjobs.com/ | 200 | Title, meta description, canonical, no `noindex`; no `JobPosting` on homepage, which is correct. |
| https://somkenjobs.com/jobs | 200 | Crawlable, no `noindex`; currently shares homepage canonical/title/meta, which should be improved. |
| https://somkenjobs.com/robots.txt | 200 | Allows public pages and references both main and job sitemaps. |
| https://somkenjobs.com/sitemap.xml | 200 | Sitemap index points to static and job sitemaps. |
| https://somkenjobs.com/sitemap-jobs.xml | 200 | Contains 552 job URLs with ISO `lastmod` values. |
| Example job pages | 200 | Canonical URLs present, no `noindex`, `JobPosting` structured data detected. |

## Strengths

- Public pages return `200 OK`.
- Homepage has a clear title and meta description.
- Homepage canonical points to `https://somkenjobs.com/`.
- `robots.txt` does not block `/jobs`.
- `robots.txt` references `sitemap.xml` and `sitemap-jobs.xml`.
- `sitemap.xml` is a sitemap index.
- `sitemap-jobs.xml` is job-only and uses active job detail URLs.
- Job detail pages expose `JobPosting` structured data.
- Job detail pages use canonical slug URLs even when accessed by numeric ID.

## Fix Before Scaling Outreach

1. Give `/jobs` its own canonical URL, title, and meta description.
   - Current issue: `/jobs` appears to share the homepage canonical and meta.
   - Recommended canonical: `https://somkenjobs.com/jobs`.
   - Recommended title: `East Africa NGO and Humanitarian Jobs | Somken Jobs`.

2. Create resource pages that deserve links.
   - Outreach will be much stronger if prospects can link to specific pages, not just the homepage.
   - Priority pages:
     - `/resources/somalia-ngo-directory`
     - `/resources/kenya-career-resources`
     - `/resources/somalia-graduate-career-guide`
     - `/resources/east-africa-humanitarian-employers`
     - `/resources/construction-engineering-companies-somalia-kenya`

3. Add internal links to resource pages from homepage, `/jobs`, footer, and relevant job detail pages.

4. Keep job detail pages clean.
   - Continue using one `JobPosting` per job detail page.
   - Do not expose active `JobPosting` markup on expired jobs.
   - Keep descriptions readable and visible to users.

5. Improve employer/organization pages if available.
   - Organization profile pages are natural backlink targets for employers listed on Somken Jobs.
   - If organization pages do not exist yet, add them before asking employers to reference their profile.

## Outreach Readiness

Ready now:
- Universities and career offices can be contacted for a general jobs/resource listing.
- NGOs and employer partners can be asked to review their listings and link to verified pages.
- Chambers and associations can be approached around employer/member visibility.

Wait until resource pages exist:
- Media/blog outreach.
- Government/public resource-page outreach.
- Broad African tech/business platform outreach.
- “Best companies/NGOs” list outreach.

## Compliance Rules

- Do not buy links.
- Do not request links for ranking purposes.
- Do not use fake accounts, PBNs, comment spam, or automated link creation.
- Do not use excessive reciprocal links.
- Use outreach around usefulness: career resources, employer visibility, student support, verified listings, and public-service value.

## Source Notes

This audit follows Google Search Central guidance for SEO basics, sitemaps, robots.txt, job posting structured data, and spam policies.

- Google SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Google robots.txt guidance: https://developers.google.com/crawling/docs/robots-txt/create-robots-txt
- Google `JobPosting` structured data: https://developers.google.com/search/docs/appearance/structured-data/job-posting
- Google spam policies: https://developers.google.com/search/docs/essentials/spam-policies
