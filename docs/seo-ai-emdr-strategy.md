# Nura — SEO strategija: "AI Guided EMDR"

**Fokus fraza:** `AI Guided EMDR Therapy Online — Bilateral Stimulation App | Nura`
**Datum:** 2026-09-12
**Ciljni SERP:** *AI guided EMDR bilateral stimulation*

---

## 1. Ključni nalaz: sadržajna lestvica u ovoj niši je MALEČKA

Auditirano 2026-09-12, broj URL-ova u sitemap-u:

| Sajt | URL-ova | Tip |
|---|---|---|
| **bilateralstimulation.io** | 117 | Lider. 40.000+ terapeuta |
| therajoyapp.com | 68 | iOS, Joy-Con haptics, za kliničare |
| emdrtappers.com | 14 | Terapeut + klijent, HIPAA |
| eyemove.app | 13 | Samo licencirani terapeuti |
| **healemdr.com** | **6** | Najbliži direktni rival (AI) |
| **nurahelp.com** | **6** | ← vi |
| — *poređenja radi* — | | |
| freudly.ai | 15.336 | **Nije u ovoj niši** — eksplicitno kaže da AI ne može BLS |

**Zaključak:** Ne takmičite se sa Freudly-em na volumen. U niši "AI guided EMDR / BLS app" sadržajna barijera je **6–117 stranica**. Sa 40–60 kvalitetnih stranica postajete sadržajni lider niše. To je potpuno dostižno — za razliku od 15.000 stranica.

---

## 2. Mapa konkurenata: ko drži šta

### A) Consumer AI apps — vaš direktni front
- **healemdr.com** — "The Guided EMDR App", "AI-Powered EMDR" kao jedna od 9 feature kartica. Mobilna app, 4.9★. **0 JSON-LD, 6 stranica, 536KB homepage.** Najslabiji tehnički, najbliži vama.
- **eyemove.app** — klinički, samo za licencirane terapeute. Nije consumer.
- **therajoyapp.com** — iOS + Joy-Con haptics. Dizajnerski najjači, ali hardverski vezan.

### B) BLS tools — drže "bilateral stimulation" pojmove
- **bilateralstimulation.io** — 40.000+ terapeuta, free, no signup. **Drži frazu "bilateral stimulation".** Ima /blog, 117 stranica. Ovo je najjači domenski autoritet u niši.
- **emdrtappers.com** — jedini sa pravim blogom (4 posta, uklj. `best-emdr-apps-2026`, `best-bilateral-stimulation-apps-2026`). Klijent-facing.

### C) Autoritet / editorial — drže informacione upite
- **emdria.org** — kredencionalno telo. Drži "EMDR therapy", sve condition upite.
- **psychology.com/ai-therapy/ai-emdr-therapy** — **rangira #1** u vašem screenshotu. Format: "In short" blok + author quote + sekcije.
- **emdrfocus.com** — attachment-informed AI-EMDR, treninzi.
- **ScienceDirect / ETQ (UK)** — akademski.

### D) Agregatori / listicle
- **emease.com/compare/best-emdr-apps** — "Best EMDR Apps: An Honest Comparison". Rangira zato što poredi **i sebe i konkurente**, sa disclosure-om da je njihova app. Ocjenjuje po "**marketing honesty**".

---

## 3. Zid konsenzusa — i vaša pukotina

**Svi koji rangiraju u ovom SERP-u tvrde isto: AI ne može EMDR.**

| Izvor | Tvrdnja |
|---|---|
| psychology.com (#1) | *"AI cannot deliver EMDR... doing EMDR reprocessing alone with an app is not safe"* |
| freudly.ai | *"AI cannot provide the bilateral stimulation that makes EMDR effective"* |
| emease.com | *"No app replaces therapist-delivered EMDR"* |
| EMDRIA | *"Responsible AI Integration"* — oprez |

**Vaša pukotina:** Nura je jedina koja je istovremeno (a) consumer-facing, (b) AI-guided, i (c) **stvarno isporučuje bilateral stimulation**. Freudly je eksplicitno odustao od BLS-a. Heal EMDR ga ima ali se ne pozicionira oko AI-ja.

**Ali:** ne smijete tvrditi da zamjenjujete terapiju. EmEase rangira djelimično zato što **nagrađuje "marketing honesty"**. Vaš postojeći disclaimer ("self-help software, not a licensed therapist") je tačno pravi ton — koristite ga kao **konkurentsku prednost**, ne kao sitno slovo.

**Pozicioniranje:** *AI-guided BLS practice + between-session support, uz jasno rečeno gde AI staje.*

---

## 4. Arhitektura ključnih fraza

### Primarna (money page = `/emdr`)
```
AI guided EMDR therapy online
AI guided EMDR
AI EMDR app
EMDR bilateral stimulation app
AI EMDR therapist online
guided EMDR sessions online
```

### Sekundarna (BLS mehanika)
```
bilateral stimulation app
visual auditory tactile bilateral stimulation
online BLS tool
EMDR tappers online
EMDR eye movement app
```

### Comparison (najveći ROI — tu EmEase pobeđuje)
```
best EMDR app
best bilateral stimulation app
EMDR app vs therapist
self-guided vs therapist-led EMDR
Nura vs Heal EMDR / vs bilateralstimulation.io / vs Freudly
```

### Long-tail / informaciona
```
can you do EMDR alone
EMDR between sessions
how does bilateral stimulation work
what to expect first EMDR session
is EMDR safe alone
EMDR for anxiety / PTSD / panic
```

---

## 5. Money page: `/emdr` — specifikacija

**Zadržati URL `/emdr`** (već indeksiran, kratak, stabilan — ne trošiti redirect kredit na novom sajtu).

### Title / meta
```
Title:  AI Guided EMDR Online — Bilateral Stimulation App | Nura
        (58 chars — bez skraćivanja)
Meta:   Guided EMDR sessions with AI support: visual, audio, and tactile
        bilateral stimulation, on your schedule. Self-help — not a
        licensed therapist. Free to try.
```

> ⚠️ Trenutno: `<title>EMDR Support</title>` — 12 znakova, nula keyword surface.
> Uzrok: `lib/site-seo.ts:183` koristi `title: { absolute: page.title }`, što **zaobilazi** `%s — Nura` template iz `app/layout.tsx:38`. To je bug.

### Struktura (1.800–2.500 riječi, trenutno ~250)

```
H1  AI Guided EMDR Therapy Online

H2  What AI guided EMDR actually is
H2  How a Nura session works, step by step
      H3 1. Intake and grounding
      H3 2. Choosing a target
      H3 3. Bilateral stimulation sets
      H3 4. Check-in and closure
H2  Bilateral stimulation: visual, audio, and tactile
H2  What the AI does — and what it does not do
      ← ovdje eksplicitno: ne zamjenjuje terapeuta, ne procjenjuje
        podobnost za obradu traume, ne radi klinički sud
H2  AI guided EMDR vs. in-person EMDR therapy
H2  Who this is for (and who it is not for)
H2  Between sessions: support when your therapist is unavailable
H2  Safety: when to stop and when to get help
H2  Frequently asked questions   ← FAQPage schema
H2  Start a session
```

**Zašto ovako:** psychology.com rangira #1 sa strukturom *"In short → šta je → gde AI pripada → zašto AI ne može sam"*. Freudly koristi 5-koračni H2 pattern + sekciju ograničenja. Sekcija **"what the AI does not do"** nije slabost — to je ono što Google-ov helpful-content sistem nagrađuje u YMYL niši.

---

## 6. Sadržajni klaster (~24 stranice, 3 mjeseca)

### Tier 1 — Product (3)
| URL | Ciljana fraza |
|---|---|
| `/emdr` | AI guided EMDR therapy online |
| `/app` (postojeći) | EMDR app |
| `/pricing` *(nedostaje)* | EMDR app pricing |

### Tier 2 — Comparison (5) ← **najveći ROI**
| URL | Ciljana fraza |
|---|---|
| `/compare/best-emdr-apps` | best EMDR app |
| `/compare/best-bilateral-stimulation-apps` | best bilateral stimulation app |
| `/compare/nura-vs-bilateralstimulation-io` | bilateralstimulation.io alternative |
| `/compare/nura-vs-heal-emdr` | Heal EMDR alternative |
| `/compare/self-guided-vs-therapist-led-emdr` | self-guided EMDR |

> EmEase drži ovu teritoriju sa **jednom** stranicom koja iskreno poredi i sebe. Napravite bolju verziju — sa ažurnim cijenama i jasnim "kada NE treba koristiti app".

### Tier 3 — BLS mehanika (6)
```
/learn/how-bilateral-stimulation-works
/learn/visual-vs-audio-vs-tactile-bls
/learn/emdr-eight-phases-explained
/learn/sud-and-voc-scales
/learn/what-to-expect-first-emdr-session
/gearsetter/online-bls-tool
```
> Ovo direktno napada `bilateralstimulation.io` teritoriju. Oni su therapist-first; vi ste consumer-first.

### Tier 4 — Use case / condition (6)
```
/learn/emdr-for-anxiety
/learn/emdr-for-ptsd
/learn/emdr-for-panic-attacks
/learn/emdr-between-sessions
/learn/grounding-techniques-before-emdr
/learn/emdr-for-stress
```
> ⚠️ YMYL — bez kliničkog recenzenta ove neće rangirati. Vidi §8.

### Tier 5 — Safety / limits (4) ← **E-E-A-T motor**
```
/safety/is-emdr-safe-to-do-alone
/safety/when-to-stop-a-session
/safety/when-to-seek-a-therapist
/safety/emdr-and-dissociation
```
> Ove stranice izgledaju kao da vas usporavaju. Rade suprotno — to su najjači trust signali u niši i Freudly/psychology.com ih koriste kao osnovu rangiranja.

### Blog
`lib/landing-blog.ts` već postoji, ali **`/blog/[slug]` ruta ne postoji**. Napraviti je.

---

## 7. Schema (trenutno: 0 blokova)

Nijedan konkurent u niši ne radi schema dobro (`healemdr.com` = 0, `emdrfocus.com` = 0, `emdrtappers.com` = 1). Ovo je jeftina pobjeda.

```tsx
// app/components/StructuredData.tsx
const graph = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": "https://nurahelp.com/#org",
      name: "Nura", url: "https://nurahelp.com/",
      logo: "https://nurahelp.com/brand/lockup.png" },

    { "@type": "SoftwareApplication", name: "Nura — AI Guided EMDR",
      applicationCategory: "HealthApplication",
      operatingSystem: "Web, iOS, Android",
      description: "AI guided EMDR sessions with visual, audio, and tactile bilateral stimulation. Self-help software — not a licensed therapist.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": "https://nurahelp.com/#org" } },

    { "@type": "FAQPage", mainEntity: faqs.map(f => ({
        "@type": "Question", name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a } })) },

    { "@type": "MedicalWebPage",
      name: "AI Guided EMDR Therapy Online",
      lastReviewed: "2026-09-01",
      reviewedBy: { "@type": "Person", name: "…", hasCredential: "…" } },

    { "@type": "BreadcrumbList", /* … */ }
  ]
};
```

**Prioritet:** `Organization` + `SoftwareApplication` + `FAQPage` na home i `/emdr`. `MedicalWebPage` + `reviewedBy` tek kad imate kliničkog recenzenta.

---

## 8. E-E-A-T — najveći ne-tehnički gap

Ovo je YMYL (zdravstvena) niša. Svaki rangirajući konkurent citira autoritete:

- **emease.com** → VA/DoD 2023 guideline, APA PTSD guideline, PubMed (Frontiers in Psychiatry 2024), EMDRIA arhiva
- **psychology.com** → imenovani recenzent (Seph Fontane Pennock) sa quote-om u tekstu
- **emdria.org** → samo kredencionalno tijelo

**Nura trenutno ima:** 0 imenovanih autora, 0 kliničkog recenzenta, 0 citiranih izvora.

**Minimum za ulazak u igru:**
1. Imenovani klinički savjetnik / recenzent (EMDR-certified), sa stranicom profila i kredencijalima
2. `reviewedBy` + `lastReviewed` na svakoj YMYL stranici
3. Citati na VA/DoD, APA, WHO, NICE, PubMed — sa linkovima
4. Stranica `/about/clinical-team`
5. `/authors/[slug]` ruta

Bez ovoga, Tier 3–5 stranice neće rangirati bez obzira na tehničku perfekciju.

---

## 9. Tehnički blokovi (iz prethodnog audita)

| # | Problem | Fajl | Fix |
|---|---|---|---|
| 1 | `force-dynamic` na svih 6 javnih stranica → `Cache-Control: no-store`, TTFB 158–199ms (Freudly: 47–54ms) | `app/{page,emdr,about,resources,privacy,terms}/page.tsx` | `export const revalidate = 3600` |
| 2 | `title.absolute` zaobilazi brand template | `lib/site-seo.ts:183` | Ukloniti `absolute`, koristiti template |
| 3 | 0 JSON-LD | cijeli `app/` | §7 |
| 4 | robots.txt blokira **GPTBot, ClaudeBot, Google-Extended, CCBot, OAI-SearchBot** + `ai-train=no` | Cloudflare managed | Odblokirati grounding botove (`OAI-SearchBot`, `PerplexityBot`, `ChatGPT-User`) na javnim stranicama. Zadržati `/app`, `/api`, `/admin` zatvorene. |
| 5 | Nema `llms.txt` | — | `app/llms.txt/route.ts` |
| 6 | Duplikat meta description (`/about`, `/resources`, `/privacy`, `/terms` svi nasljeđuju `BRAND_DESCRIPTION`) | `lib/site-seo.ts:49-93` | Unikatne po stranici |
| 7 | `/resources` je ćorsokak — "guides live in the app library after you sign in" | `app/resources/page.tsx` | Pretvoriti u javni hub |
| 8 | Nema `/blog/[slug]` rute iako `landing-blog.ts` postoji | `app/` | Napraviti rutu |
| 9 | `sitemap.ts` bez `lastModified`; `changefreq`/`priority` Google ignoriše | `app/sitemap.ts` | Dodati `lastModified` |
| 10 | Nema interne navigacije u `FrontendShell` | `app/components/frontend/FrontendShell.tsx` | Nav + breadcrumbs |

---

## 10. Redoslijed izvršenja

**Nedjelja 1 — tehnički temelj**
1. `revalidate = 3600` na 6 stranica
2. Fix `title.absolute` bug
3. Schema: Organization + SoftwareApplication + FAQPage
4. robots.txt → odblokirati grounding botove
5. `llms.txt`

**Nedjelja 2–3 — money page**
6. `/emdr` prepisati na 1.800–2.500 riječi po §5
7. Unikatni title/meta za sve stranice
8. `/resources` → javni hub

**Mjesec 2 — comparison tier**
9. `/blog/[slug]` + `/compare/*` (5 stranica) ← najveći ROI

**Mjesec 3 — autoritet**
10. Klinički recenzent + `/about/clinical-team` + `reviewedBy` schema
11. Tier 3–5 sadržaj (16 stranica)

---

## 11. Zašto je ovo dostižno

| | Freudly | Niša AI-EMDR |
|---|---|---|
| Sadržajna barijera | 15.336 stranica | **6–117 stranica** |
| Njihova pozicija | BLS ne mogu | — |
| Vaša pozicija | — | AI + BLS, consumer-facing |
| Njihova slabost | 0 schema, 0 OG, bez hreflang | — |
| Rok | Godine | **~3 mjeseca** |

Ne pobjeđujete Freudly na volumen — pobjeđujete u niši koju su oni **eksplicitno napustili**.
