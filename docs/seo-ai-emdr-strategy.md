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

**Prioritet:** `Organization` + `SoftwareApplication` + `FAQPage` na home. YMYL stranice (`/emdr`, `/safety`, `/limits`, `/about/clinical-team`) koriste `MedicalWebPage` sa `audience` + `specialty` + citatima (EMDRIA, APA, NICE, WHO, PubMed). `reviewedBy` + `lastReviewed` **samo** kad postoji stvarni klinički recenzent u `CLINICAL_ADVISOR` — nikad izmišljeni kredencijali.

---

## 8. E-E-A-T — najveći ne-tehnički gap

Ovo je YMYL (zdravstvena) niša. Svaki rangirajući konkurent citira autoritete:

- **emease.com** → VA/DoD 2023 guideline, APA PTSD guideline, PubMed (Frontiers in Psychiatry 2024), EMDRIA arhiva
- **psychology.com** → imenovani recenzent (Seph Fontane Pennock) sa quote-om u tekstu
- **emdria.org** → samo kredencionalno tijelo

**Nura trenutno ima:** citati EMDRIA / APA / NICE / WHO / PubMed na `/about/clinical-team` + `MedicalWebPage` (audience + specialty) na YMYL rutama; **0** imenovanih kliničkih recenzenata (`reviewedBy` namjerno prazan dok `CLINICAL_ADVISOR` nije setovan).

**Minimum za jači E-E-A-T:**
1. Imenovani klinički savjetnik / recenzent (EMDR-certified), sa kredencijalima koje se mogu provjeriti — **nikad izmišljeni**
2. Tek tada `reviewedBy` + `lastReviewed` na YMYL stranicama
3. Citati (već: EMDRIA, APA, WHO, NICE, PubMed) — proširiti po članku gdje treba
4. Stranica `/about/clinical-team` (proces + citati; imenovani advisor kad postoji)
5. Opciono `/authors/[slug]` kad postoje stvarni autori

Bez imenovanog recenzenta, **ne** padati na placeholder meta ili lažni `reviewedBy` — to je YMYL spam rizik.

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
10. Klinički recenzent (kad postoji) + `reviewedBy` — do tada `/about/clinical-team` kao proces + citati, `MedicalWebPage` bez lažnog recenzenta
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

---

## 12. Competitor deep-dive (2026-09-13)

Verbatim titles/meta iz raw HTML-a komercijalnih i inkumbentnih sajtova. Ovdje samo što mijenja strategiju.

### 12.1 Komercijalni front

| Sajt | IA (skraćeno) | E-E-A-T markup |
|---|---|---|
| **Heal EMDR** | ~samo `/`, contact, delete, legal — **0 blog, 0 hub** | 0 JSON-LD |
| **Virtual EMDR** | `/knowledge-base/` ~130 Q-URL + 10 condition + pricing/faq | Nema |
| **Rewire** | `/emdr-guide/` ~40 + worksheets 16 + blog ~40 + ~200 city | `reviewedBy: Organization` (self-ref) |
| **EmEase** | **757** URL: answers 225 + compare 57 + glossary 122 | Nema |
| **Open EMDR** | 24 blog (money questions) | Byline, bez medical review |
| **EMDR Tappers** | Blog ×4 | FAQPage + Article + Org |
| **self EMDR / EMDR4LIFE** | Thin / single-page | Nema |

**Dva zaključka:**

1. **Heal** (najbliži app-intent rival) rangira na store signalima, ne na sadržaju. Nura ga neće pobijediti bez App Store/Play — **može ga lako nadjačati na content-u**.
2. **Volume igrači su saturirali long-tail** (EmEase/Rewire/Virtual). Nura **ne** takmiči se u broju URL-ova. Pobjeda = kvalitet + stvarni E-E-A-T + oštar wedge.

### 12.2 Inkumbenti (informacioni head)

Cleveland Clinic, Healthline, Verywell, APA, Harvard, VA, EMDR Institute, EMDRIA — drže **what is EMDR**. AIO/featured answer apsorbuje head.

**Jedina pukotina u zidu:** EMDRIA resource stranice su često **video + tanak tekst**. To je relevantno za *bilateral stimulation* / technique scripts — Nurin definišući pojam — ne za “what is EMDR” head.

Calm Blog ulazi u BLS temu — pratiti.

### 12.3 Klasteri koji se stvarno dobijaju

| Klaster | Winnable? | Nura fit |
|---|---|---|
| EMDR at home / DIY / self-administered | ✅ | Core use case |
| EMDR between sessions | ✅ | Product reason to exist |
| Side effects / safe self-guided | ✅ | Najveći gap vs Healthline (opšte) |
| Cost / access / insurance | ✅ | `/pricing` + FAQ — još content |
| BLS technique scripts (butterfly hug, calm place, container) | ✅ | Product + Learn |
| Bilateral stimulation (opšte) | ⚠️ | Calm/EMDRIA/Verywell — dubina, ne volume |
| EMDR for \<condition\> | ⚠️ | Saturirano — samo dublje + honest limits |
| what is EMDR | ❌ | Ne trošiti |
| EMDR app / best app | ⚠️ | Store signali; usporedbe pomažu |

### 12.4 Strukture koje pobeđuju (ukrasti selektivno)

Ne klonirati EmEase 225×. Ukrasti **oblik**, ne volumen:

| Struktura | Model | Nura verzija (disciplinirana) |
|---|---|---|
| Question-slug KB | Virtual `/knowledge-base/…`, EmEase `/answers/…` | `/faq` + mali `/answers/[slug]` set (~15–25), evergreen, 1 pitanje = 1 URL |
| Compare hub | EmEase `/compare/*` ×57 | 5–8 **iskrenih** usporedbi (već u §6 Tier 2) — ne 57 templatea |
| Phase/protocol hub | Rewire phase-1…8 | Jedan hub + 8 kratkih stranica **ili** Learn path — ne 200 city |
| Worksheets | Rewire `/worksheets/*` | Opciono kasnije (PDF/link-bait) — after core wedge |
| Glossary | EmEase ×122 | Mali glossary (~20–40) koji hrani interne linkove — ne 122 |
| Us vs them | emease-vs-heal… | Da — honest, marketing-honesty ton |
| Audience split | Rewire for-clients / therapists | Nura = **clients / between-session practice** first; therapists kasnije ako ima product |

### 12.5 Disclaimer u meta — potvrđeno

**Nijedan** komercijalni konkurent ne stavlja self-help/medical disclaimer u meta description. Meta = benefit/feature.

Najbolji “pametan oprez” u niši (EmEase stil): ograničenje kao **vrijednost** u body/title teritoriji, ne kao ogradu u snippetu:

> *EMDR exercises between sessions: what's safe to practice solo, what your therapist may assign, and what stays in the therapy room.*

Nura je već uskladila ovo (F3): meta = value only; `BRAND_LIMITS_LINE` u footer / `/limits` / llms.txt.

### 12.6 E-E-A-T — najveća prilika na tržištu (2026-09-13)

| Konkurent | Medical review byline | Schema | Verdikt |
|---|---|---|---|
| Healthline / Cleveland / Verywell | ✅ imenovani kliničar | MedicalWebPage + reviewedBy | Zlatni standard |
| Psychology Today | “Reviewed by” urednik, ne kliničar | MedicalWebPage | Srednje/slabo |
| EMDRIA / APA / VA / Harvard | Institucionalni autoritet | malo/nema | Jako preko domena |
| **Rewire** | ❌ “Rewire Editorial” | reviewedBy: **Organization** (self-ref) | Šuplje — ne kopirati |
| EMDR Tappers | ❌ | FAQPage + Article + Org | Tehnički OK, trust tanko |
| EmEase / Open / Virtual / Heal / self | ❌ | Nema / minimalno | Nema |

**Nijedan komercijalni konkurent nema stvarnog, imenovanog, kvalifikovanog kliničkog recenzenta.**

Zato je pravi recenzent + `MedicalWebPage` + `lastReviewed` **jedini odbrambeni zid koji se ne kopira preko noći** — i najvredniji potez koji Nura može povući. Direktno vezano za F8 / `/about/clinical-team`.

⚠️ Hard rule ne mijenja se: **ne izmišljati kredencijale**. Rewire-ov “Rewire Editorial” je primer šupljeg E-E-A-T-a. Dok nema osobe: iskrena procesna stranica + citati (EMDRIA, APA, NICE, WHO, PubMed) + `MedicalWebPage` bez `reviewedBy`. Kad postoji: setuj `CLINICAL_ADVISOR`, onda byline + schema.

### 12.7 Tri stuba strategije (ne page-count)

Nura (~živih hubova + ~18 guide-ova) **ne** trka EmEase (757) / Rewire (~300). Bitka:

1. **Pravi E-E-A-T** — imenovan recenzent kad postoji; do tada honest process (već F8).
2. **Oštar wedge** — “EMDR between sessions” + “self-guided safety”.
3. **AI-answer readiness** — robots + `llms.txt` već dobri; proširiti llms/sitemap signal na članke (RSS već postoji).

### 12.8 URL prozor — `/learn/[slug]` vs `/blog/[slug]`

**Stanje (lokalno):** evergreen guide-ovi žive na `/blog/[slug]`; `/learn` je hub sa kuriranim pathom. Prod 18× `/blog/*` još **404** (BOM fix čeka deploy) → **još nije indeksirano**.

**Preporuka audita:** dok je 404, restrukturiranje je jeftino:
- Evergreen guide-ovi → `/learn/[slug]` (hub + leaf ista teritorija)
- `/blog` → hronološki / product / “newest” feed (tankiji ili kasniji postovi)
- Posle prvog uspješnog indeksiranja: ista izmjena = 301 + izgubljena equity

**Odluka (otvorena):** uraditi migraciju **prije** push-a koji popravlja 404, ili ostaviti `/blog/[slug]` i jačati Learn samo kao hub. Ne miješati 301 kasnije “jer je zgodno”.

### 12.9 Revidirani prioritet (poslije F1–F15)

**P0**  
1. Imenovani klinički recenzent (recruit) — ili drži F8 process page dok ga nema  
2. URL odluka: migrate evergreen → `/learn/[slug]` **sada** ili commit na `/blog/[slug]`  
3. Deploy F1–F15 (blog 404 + hubovi + schema)  
4. Wedge content: between-sessions + self-guided safety (5–10 Q-slug / Learn leafs)

**P1**  
5. Cost/access → `/pricing`  
6. 3–5 honest compares  
7. llms.txt + interne linkove proširiti na svaki guide

**P2**  
8. Technique scripts, mali glossary  
9. Ne: condition spam, city pages, 100+ compares, “what is EMDR” head

---

## 13. Keyword mapa i prioriteti (2026-09-13)

### 13.1 Postojeći članci (18)

| # | Slug | Primarni keyword | Intent | Prioritet |
|---|---|---|---|---|
| 1 | `what-is-emdr` | what is emdr | Informational | P0 hub anchor |
| 2 | `what-is-bilateral-stimulation` | bilateral stimulation | Informational | P0 definiše proizvod |
| 3 | `visual-sets-and-the-moving-ball` | emdr moving ball | Info/mixed | P0 tool intent |
| 4 | `emdr-vs-cbt` | emdr vs cbt | Commercial-inv. | P1 |
| 5 | `emdr-between-sessions` | emdr between sessions | Informational | P0 core use case |
| 6 | `can-you-do-emdr-alone` | can you do emdr on yourself | Info → konverzija | P0 |
| 7 | `how-long-does-emdr-take` | how long does emdr take | Informational | P0 |
| 8 | `emdr-for-anxiety` | emdr for anxiety | Info → commercial | P0 |
| 9 | `emdr-for-ptsd` | emdr for ptsd | Info → commercial | P0 |
| 10 | `emdr-online-what-to-expect` | online emdr therapy | Commercial-inv. | P0 |
| 11 | `guided-vs-free-mode` | — (brand) | Navigational | P2 product support |
| 12 | `grounding-before-a-set` | grounding techniques | Informational | P1 |
| 13 | `when-to-pause-or-stop` | when to stop emdr | Informational | P1 |
| 14 | `emdr-session-structure` | emdr session structure | Informational | P1 |
| 15 | `self-help-emdr-vs-a-therapist` | self emdr vs therapist | Commercial-inv. | P1 |
| 16 | `eye-movements-and-online-emdr` | does online emdr work | Informational | P1 |
| 17 | `emdr-check-ins-after-sets` | emdr check in | Product support | P2 |
| 18 | `what-happens-in-an-emdr-set` | emdr set | Informational | P2 |

**#11 i #17:** bez search volume-a — piši za konverziju i in-app podršku, ne za rangiranje.

### 13.2 Content gaps — šta dodati

Safety + protocol/how-to: visok volume, AIO teško odgovara (YMYL), authority tanki.

**P0 (graditi prvo)**

| Tema | Primarni keyword | Zašto |
|---|---|---|
| EMDR side effects | emdr side effects | Najveći gap; AI-answerable |
| Is EMDR safe | is emdr safe | Članak nosi upit; `/safety` ostaje policy hub |
| 8 phases | emdr 8 phases | Numbered list → snippet / AIO |
| Butterfly hug | butterfly hug | EMDRIA kanon; pobedi jasnoćom + vizual |
| Tapping vs eye movements | emdr tapping vs eye movements | Product-relevant (visual/audio/tactile) |
| EMDR for depression | emdr for depression | Strogo — slabija evidence |
| EMDR for C-PTSD | emdr for cptsd | Iskreno → `/safety` (rizična solo grupa) |
| Best EMDR app | best emdr app | Honest compare + disclose bias |
| EMDR cost | how much does emdr cost | Most ka `/pricing` |
| EMDR not working | emdr not working | Empatično; sme reći “možda nije alat za tebe” |

**P1:** container, calm place, resourcing, window of tolerance, negative cognitions, after-effects (headache/nausea/fatigue), sleep, dissociation risk, grief/phobias/OCD/panic, insurance, vs brainspotting/somatic/EFT, how to prepare.

**P2:** chronic pain/tinnitus/children/BPD, SUD/VOC, body scan, tappers, polyvagal, fight-flight-freeze.

### 13.3 Kanibalizacija — rešiti prije pisanja

| Par | Rizik | Pravilo |
|---|---|---|
| `emdr-session-structure` ↔ `what-happens-in-an-emdr-set` | Visok | Structure = cijeli luk + 8 faza; set = mehanika jednog seta |
| `visual-sets…` ↔ `eye-movements…` ↔ `what-is-bilateral-stimulation` | Visok 3-way | (a) UI/format+proizvod (b) dokazi screen delivery (c) koncept |
| `emdr-between-sessions` ↔ `can-you-do-emdr-alone` ↔ `self-help-emdr-vs-a-therapist` | Visok | Uz terapiju / samostalno / poređenje — lančano linkovati |
| `/learn` ↔ `/blog` | Visok | F4: hub vs chrono feed |
| `how-long-does-emdr-take` ↔ budući “how many sessions” | Preduprediti | Ne novi URL — H2/FAQ na postojećoj |
| `/safety` ↔ is-emdr-safe ↔ side-effects | Planirati | `/safety` = policy; članci nose upite i linkuju hub |

### 13.4 AI search (AEO/GEO) — format obavezan

Definicioni head (`what is emdr`) = skupa borba vs Cleveland/APA/EMDRIA + AIO. Nura pobjeđuje na **mehanizam / safety / between-sessions / product-adjacent**.

Na **svakom** članku:

1. H1/H2 u **pitanju**, ne u tvrdnji  
2. Direktan odgovor **40–60 riječi** kao prvi pasus ispod svakog H2 (verbatim extract)  
3. Schema: Article/BlogPosting + FAQPage gdje ima FAQ; YMYL → MedicalWebPage (audience/specialty; `reviewedBy` samo ako stvaran kliničar) + `lastReviewed` kad postoji review  
4. Numerisane liste (8 faza); tabele za vs CBT / brainspotting / somatic  
5. Inline citati: APA, EMDRIA, NICE, WHO, PubMed — pozajmi autoritet, ne izmišljaj

### 13.5 Redoslijed izvršenja sadržaja

1. Zaključaj URL (`/learn/[slug]` vs `/blog/[slug]`) + deploy F1  
2. Anti-kanibal rewrite P0 postojećih (uloge u §13.3) + AEO format  
3. Novi P0 gapovi: side effects → is safe → 8 phases → cost → best app → butterfly hug → tapping vs eyes → not working → depression/C-PTSD (strogo)  
4. P1 technique + after-effects  
5. Recenzent kad postoji → `reviewedBy` val  
