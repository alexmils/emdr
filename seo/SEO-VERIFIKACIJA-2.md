# SEO verifikacija 2 — Round 3 close-out

Datum: 2026-09-13  
Scope: post–Round 2 audit (6 remaining items) → shipped in code.

## Finalna tabela (prod-facing targets)

| Metrika | Originalni audit | Deploy #1 | Round 2 | Round 3 (sada) |
|---------|------------------|-----------|---------|----------------|
| Članci HTTP 200 | 0 / 18 | 18 / 18 | 18 / 18 | ✅ 18 / 18 |
| Mrtvi interni linkovi | 19 | 0 | 0 | ✅ 0 |
| Duplirani naslovi | 0 | 1 par | 0 | ✅ 0 |
| Naslovi sa ciljnim keyword-om | — | 2 / 18 | 18 / 18 | ✅ 18 / 18 |
| Description-i sa disclaimer-om | 9 / 12 | — | 0* | ✅ 0* |
| Naslovi > 60 char (sa ` — Nura`) | 3 | 1 | 1 (`what-is-emdr`) | ✅ 0 |
| Description-i > 155 char | 0 | 2 | 0 | ✅ 0 |
| Stranica bez schema | 4 | 0 | 0 | ✅ 0 |
| Članaka sa FAQPage | 0 / 18 | 0 / 18 | 18 / 18 | ✅ 18 / 18 |
| Članaka sa MedicalWebPage | 0 / 18 | 0 / 18 | 18 / 18 | ✅ 18 / 18 |
| FAQPage ukupno (hubovi + članci) | — | — | ~22 | ✅ ~22 |
| MedicalWebPage ukupno | — | — | ~22 | ✅ ~22 |
| `/pricing` Product/Offer schema | — | OfferCatalog only | OfferCatalog | ✅ Product + SoftwareApplication + AggregateOffer + 3× Offer |
| H1 ≈ title keyword (knowledge/faq/support/learn) | — | slab | slab | ✅ poravnato |
| `llms.txt` lista 18 članaka | — | hub only | hub only | ✅ svih 18 |

\* Disclaimer ostaje na `/limits` (tema stranice) + footer/`llms.txt` kanonska rečenica — ne u meta description-ima.

## Schema coverage (Round 3)

| Surface | Types |
|---------|--------|
| `/` | Organization, WebSite, SoftwareApplication (AggregateOffer → `/pricing`), FAQPage |
| `/pricing` | Organization, WebPage, **Product + SoftwareApplication**, AggregateOffer, Offer×3, BreadcrumbList |
| `/faq` | WebPage, FAQPage, BreadcrumbList |
| `/support` | WebPage, BreadcrumbList |
| `/learn` | CollectionPage, BreadcrumbList |
| `/knowledge` | WebPage, FAQPage, BreadcrumbList |
| `/blog` | CollectionPage/Blog, BreadcrumbList |
| `/blog/[slug]` ×18 | MedicalWebPage, BlogPosting, FAQPage, BreadcrumbList |
| `/emdr`, `/safety`, `/limits`, clinical | MedicalWebPage (reviewable; no fake `reviewedBy`) |

## Round 3 fixes

Vidi [`fixes-round3.csv`](./fixes-round3.csv) (9 redova).

Tri title greške (Nura u stem-u dok layout dodaje ` — Nura`) zatvorene u `lib/content-cluster.ts` + `lib/site-seo.ts`.  
Tri suštinske: pricing Product/Offer, H1 alignment, `llms.txt` guide list.

## Smoke checklist

- [ ] `https://nurahelp.com/blog/what-is-emdr` `<title>` ≤ 60 sa suffixom
- [ ] `https://nurahelp.com/blog/guided-vs-free-mode` jedna pojava „Nura“ u title
- [ ] `https://nurahelp.com/support` title bez duple Nura; H1 poravnat
- [ ] View source `/pricing` → `SoftwareApplication` + `"price":"4.99"`
- [ ] `https://nurahelp.com/llms.txt` sadrži `## EMDR guides` i 18 `/blog/…` linkova
- [ ] GSC: Request indexing za `/`, `/pricing`, top 3 guide-a (ručno)

## Napomena o GSC

Sitemap resubmitovan 2026-09-13 (Valid). Home i dalje **Crawled – not indexed**; novi hubovi uglavnom unknown. Request indexing nije u API-ju — samo GSC UI.
