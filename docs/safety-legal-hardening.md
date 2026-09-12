# Nura — Safety & Legal Hardening

**Cilj:** ograditi se klinički, pravno i produktno prije nego što app uđe u produkciju sa naplatom.
**Datum:** 2026-09-12
**Status:** predlog — **nije pravni ni klinički savjet.** Sve iz §1 i §2 mora proći kroz advokata i kliničkog savjetnika.

---

## 0. Trenutno stanje — šta već imaš (i to je dobro)

Ovo je iznad prosjeka za app u ovoj fazi. Ne diraj, samo nadogradi:

| Postoji | Fajl | Kvalitet |
|---|---|---|
| Screening u intake-u (5 stavki: prethodni EMDR, disocijacija, samopovređivanje, suicidalnost, kriza) | `lib/protocol-knowledge.ts:55` | ✅ solidno |
| Red-flag handling: *"stop history taking immediately, offer grounding only… do not advance to processing"* | `lib/protocol-knowledge.ts:61` | ✅ tačno po protokolu |
| `riskFlag` / `riskNotes` / `needsGrounding` detekcija | `lib/session-interpreter.ts:99-118` | ✅ |
| `startSet` se blokira ako je `riskFlag` true ili distres "overwhelm" | `lib/session-interpreter.ts:157` | ✅ **ovo je ključna barijera** |
| Faze: intake → grounding → desensitization → installation → body_scan → closure | `lib/session-interpreter.ts` | ✅ 8-fazna struktura |
| Cookie consent (analytics se ne učitava prije pristanka) | `lib/marketing-consent.ts` | ✅ GDPR-aware |

**Zaključak:** rizična logika postoji. Ono što fali je **dokumentacija, pristanak i pravni okvir** — plus tri produktne barijere.

---

## 1. PRAVNI SLOJ — P0, najveća izloženost

### 1.1 🚨 `/terms` je placeholder stub

`app/terms/page.tsx` trenutno sadrži:

> *"This is a placeholder terms page… Replace this stub with your full terms before production launch."*

Na **plaćenoj zdravstvenoj aplikaciji**. Ovo je najveća pojedinačna pravna izloženost koju imaš.

**ToS mora pokriti:**
- [ ] Medicinski disclaimer — nije terapija, nije medicinsko sredstvo, nije dijagnoza
- [ ] Assumption of risk — korisnik preuzima rizik samostalnog rada sa traumom
- [ ] Ograničenje odgovornosti (cap, isključenje indirektne štete)
- [ ] **Nema obaveze hitne pomoći** — eksplicitno: ako si u krizi, zovi 988 / lokalne službe
- [ ] Zabrana korišćenja <18 godina bez roditeljskog pristanka
- [ ] Zabrana korišćenja u kliničke / dijagnostičke svrhe
- [ ] Intelektualna svojina
- [ ] Raskid i suspenzija naloga
- [ ] **Naplata, otkazivanje, refundacija** (imaš Stripe — EU potrošačko pravo traži 14-dnevni cooling-off)
- [ ] Mjerodavno pravo + jurisdikcija + arbitraža
- [ ] Pravni entitet (naziv firme, sjedište, registarski broj) — **trenutno se ne pojavljuje nigdje**

### 1.2 🚨 `/privacy` je takođe placeholder stub

Isti problem. Ali ovdje je teže: **podaci o mentalnom zdravlju su "posebna kategorija" po GDPR čl. 9** (special category data). Trauma transcripts su možda najosjetljiviji podatak koji neka app može držati.

**Privacy policy mora pokriti:**
- [ ] Pravni osnov obrade za special category data (eksplicitni pristanak, čl. 9(2)(a))
- [ ] Šta se čuva: transkripti sesija, SUD/VoC ocjene, intake odgovori, `riskNotes`
- [ ] **Gdje se čuva** — hostuješ na Coolify/Docker (vidim `docker-compose.yml`). Koji region?
- [ ] Podobrađivači: Stripe, Cloudflare, Google (GA4/GTM), Microsoft (Clarity), LLM provajder, email provajder
- [ ] **LLM provajder — da li se podaci koriste za trening?** Ovo mora biti eksplicitno "ne" u ugovoru
- [ ] Retention period + pravo na brisanje (čl. 17) + pravo na prenosivost (čl. 20)
- [ ] DPO kontakt (ako je primjenjivo)
- [ ] Breach notification procedura (72h po GDPR)
- [ ] Međunarodni transferi (SCC ako podaci idu van EU)

> ⚠️ Trenutno: podaci o traumi se šalju LLM provajderu bez ikakve objave korisniku. To je ozbiljno.

### 1.3 🚨 Nema informisanog pristanka

`app/app/create-account/page.tsx:120` kaže samo:

> *"By continuing you agree to our Terms and Privacy."*

To je **browsewrap** — najslabija forma pristanka, i za zdravstvenu intervenciju nedovoljna. Pristanak na ToS ≠ pristanak na rad sa traumom.

**Potreban je odvojen, eksplicitni consent flow prije prve reprocessing sesije:**

```
┌─────────────────────────────────────────────────┐
│  Prije tvoje prve EMDR sesije                   │
│                                                 │
│  Nura je self-help alat. Nije terapija, nije    │
│  medicinsko sredstvo, ne postavlja dijagnozu.   │
│                                                 │
│  Molimo potvrdi svako:                          │
│                                                 │
│  ☐ Imam 18+ godina                              │
│  ☐ Razumijem da Nura nije zamjena za terapeuta  │
│  ☐ Razumijem da rad sa traumom može izazvati    │
│    intenzivne emocije, flooding ili uznemirujuća│
│    sjećanja                                     │
│  ☐ Nisam u aktivnoj krizi, nemam suicidalne     │
│    misli, niti mi je dijagnostikovan disocijativni│
│    poremećaj                                    │
│  ☐ Znam da Nura ne pruža hitnu pomoć i da u    │
│    krizi treba zvati 988 ili lokalne službe     │
│  ☐ Pristajem da obrađujete podatke o mom        │
│    mentalnom zdravlju (uklj. transkripte sesija)│
│    radi pružanja usluge                         │
│                                                 │
│  [ Zapisati pristanak sa timestampom i verzijom │
│    dokumenta ]                                  │
└─────────────────────────────────────────────────┘
```

**Implementacija:** tabela `consents(user_id, doc_type, doc_version, accepted_at, ip)` — kao dokaz. Ovo ti je i pravna zaštita i audit trail.

### 1.4 Nema age gate-a

Zdravstvena app + maloljetnici = ozbiljan rizik. Dodaj 18+ provjeru u onboarding. Ako želiš 13–17, treba roditeljski pristanak i potpuno drugačiji protokol.

### 1.5 ⚠️ Regulatorno pozicioniranje — KRITIČNO

**Marketing tvrdnje određuju da li si medicinsko sredstvo.**

- Ako tvrdiš da **liječiš PTSD** → u EU si vjerovatno Medical Device (MDR) → potrebna CE oznaka, klinička evaluacija, notified body. U SAD → FDA.
- Ako si **"wellness / self-help alat"** → van toga.

Tvoja trenutna pozicija (*"self-help software, not a licensed therapist, not a medical device"*) je **tačna i drži te sigurnim. NE DIRAJ JE.**

> 🔴 **Upozorenje na moju vlastitu SEO strategiju:** predložio sam stranice `/learn/emdr-for-ptsd` i `/learn/emdr-for-anxiety`. Te stranice **moraju biti edukativne** ("šta je EMDR, kako se koristi za PTSD") — **nikad** "Nura liječi PTSD". Razlika između te dvije formulacije je razlika između wellness app-a i regulisanog medicinskog sredstva. Svaka marketinška tvrdnja mora proći kroz isti filter.

### 1.6 Osiguranje

- [ ] **Professional liability / E&O** — pokriva štete od self-help alata
- [ ] **Cyber liability** — breach podataka o mentalnom zdravlju
- [ ] Provjeri da polisa **ne isključuje** mental health / AI

### 1.7 Ugovori sa podobrađivačima

- [ ] DPA sa svakim: Stripe, Cloudflare, LLM provajder, email, hosting
- [ ] **LLM provajder: ugovorna zabrana treninga na korisničkim podacima** + zero-retention ako je dostupno

---

## 2. KLINIČKI SLOJ — P0/P1

### 2.1 Imenovani klinički savjetnik — bez ovoga nema ni odbrane ni rangiranja

Treba ti EMDR-certified klinicist koji:
- [ ] Pregleda intake screening i red-flag logiku
- [ ] Pregleda safety copy na sajtu
- [ ] Potpisuje se kao recenzent (`reviewedBy` schema)
- [ ] Pregleda materijal na svakih 6 mjeseci

Ovo je istovremeno i SEO zahtjev (§8 strategije) i pravna odbrana.

### 2.2 Validated dissociation screening — tvoja najveća klinička rupa

Trenutno skeniraš disocijaciju **kroz razgovor**: *"dissociation or feeling unreal"* (`lib/protocol-knowledge.ts:55`).

Problem: ljudi sa disocijativnim poremećajem **često ne znaju da su disocijativni**. To je karakteristika poremećaja. Konverzacijski screening ih propušta.

**Fix:** kratki validirani instrument prije prve sesije:
- **DES-II** (28 stavki) — zlatni standard, ili
- **DES-Taxon** (8 stavki) — kraća verzija, dovoljna za trijažu

Prag → nežniji mod, ili "razgovaraj sa terapeutom" put, ili blokada reprocessing-a.

> Ovo je jedina barijera koja razdvaja "sigurno" od "nesigurno" u literaturi. Vidi Keltgen-Lo 2024: 79%/76% neželjenih događaja bilo je povezano sa nedovoljnom Fazom 1/2.

### 2.3 Risk register + adverse event logging

Nemaš način da saznaš da je nešto pošlo po zlu.

- [ ] Tabela `adverse_events(session_id, type, severity, reported_at, notes)`
- [ ] Tipovi po literaturi: flooding, emocionalna disregulacija, intruzivna sjećanja, emocionalno otupljivanje, spontani trans, neplanirana abreakcija
- [ ] Post-session check-in ("kako ti je 24h poslije?")
- [ ] Interni pregled na mjesečnom nivou
- [ ] Ovo je i klinički i pravni audit trail

### 2.4 Dokumentovana eskalaciona procedura

Napisati + testirati:
- [ ] Šta se dešava kad `riskFlag = true` (trenutno: grounding, ne napreduj — dobро)
- [ ] Koji su tačni pragovi
- [ ] Šta korisnik vidi (crisis resursi, ne samo tekst)
- [ ] Da li se bilo šta loguje
- [ ] Da li postoji ljudski pregled i kad

---

## 3. PRODUKTNI SLOJ — barijere u app-u

### 3.1 🚨 Faza 6 i 7 se ne sprovode

Tvoj tok: `intake → grounding → desensitization → installation → body_scan → closure`

Faze postoje u tipovima, ali **nema dokaza da su obavezne**. Ako korisnik zatvori tab usred desensitization-a, sesija se prekida usred obrade.

**Literatura je jasna: nedovršena obrada je glavni izvor "flooding"-a i intruzivnih sjećanja.**

**Fix:**
- [ ] `closure` je **obavezna faza** — ne može se preskočiti
- [ ] Ako korisnik pokuša izaći usred seta → modal: *"Sesija nije zatvorena. Hoćeš li uraditi kratko zatvaranje (2 min)?"*
- [ ] Containment vježba prije izlaska
- [ ] Ako se app zatvori nasilno → sljedeći otvaranje nudi "dovrši zatvaranje prošle sesije"

### 3.2 Nema SUD praćenja niti auto-kočenja

- [ ] SUD ocjena (0–10) prije i poslije svakog seta
- [ ] Ako SUD **poraste** tokom seta → automatsko usporavanje / prekid / grounding
- [ ] Ako se distres drži visoko 2 seta zaredom → prelazak na resurse, ne nastavak
- [ ] Gornja granica trajanja sesije

### 3.3 Nema stalnog crisis dugmeta

- [ ] Perzistentan, uvijek dostupan "I need help now" element u session UI
- [ ] Sadrži: 988 (US), lokalne brojeve, tekst-linije
- [ ] **Ne smije biti skriven u meniju**
- [ ] Prikazati i na ekranu za grounding

> Provjeri: `988` se pojavljuje u `lib/help-db.ts` — ali je li u **session UI**, ili samo u help chatu? Ako je samo u chatu, premjesti ga.

### 3.4 Nema trajnog "ovo nije terapija" indikatora

- [ ] Diskretan, stalno vidljiv natpis u session workspace-u
- [ ] Ne kao modal koji se jednom zatvori

### 3.5 Nema post-session follow-up-a

- [ ] Check-in 24h nakon sesije
- [ ] Ako korisnik prijavi pogoršanje → eskalacija + resursi
- [ ] Ovo je i dobra UX stvar i rani warning sistem

---

## 4. AI SLOJ — specifično za LLM

- [ ] **AI disclosure** — korisnik zna da razgovara sa AI-jem, ne sa čovjekom
- [ ] **Halucinacija disclaimer** — AI može dati netačne informacije
- [ ] **Zabrana dijagnoze** — guardrail na output: model nikad ne postavlja dijagnozu
- [ ] **Zabrana medicinskog savjeta** — npr. ne preporučuje lijekove
- [ ] **Human-in-the-loop za safety-critical** — ko pregleda `riskFlag` slučajeve?
- [ ] **Prompt injection / jailbreak** — šta ako korisnik nagovori AI da preskoči screening?
- [ ] **LLM provajder retention** — provjeri da se transkripti ne čuvaju za trening

---

## 5. SADRŽAJNI SLOJ — javne stranice

Ovo je istovremeno i pravna zaštita i SEO (§Tier 5 strategije):

| URL | Svrha | Pravno |
|---|---|---|
| `/safety` | Centralna safety stranica | ✅ |
| `/safety/is-emdr-safe-to-do-alone` | Iskrena procjena rizika | ✅ |
| `/safety/when-to-stop-a-session` | Stop-pravila | ✅ |
| `/safety/when-to-seek-a-therapist` | Eskalacija | ✅ |
| `/safety/emdr-and-dissociation` | Kontraindikacije | ✅ ⚠️ |
| `/limits` | Šta Nura **ne** radi | ✅ najjača zaštita |
| `/clinical-rationale` | Zašto je ovako dizajnirano (sa citatima) | ✅ |
| `/about/clinical-team` | Imenovani savjetnik | ✅ E-E-A-T |

**`/limits` je tvoja najbolja odbrana.** Stranica koja eksplicitno navodi šta alat ne može — to je i etički ispravno i pravno štiti i Google ga nagrađuje (helpful content).

---

## 6. Prioritizacija

### 🔴 P0 — prije naplate korisnicima
1. `/terms` — pravi ToS — **code: draft shipped** (pending attorney — see [launch-blockers.md](./launch-blockers.md))
2. `/privacy` — pravi Privacy Policy (GDPR čl. 9) — **code: draft shipped** (pending attorney)
3. Informisani pristanak (odvojen od ToS) + `consents` tabela — **code: done**
4. Age gate 18+ — **code: done** (signup + informed consent)
5. Imenovani klinički savjetnik — **human pending** (`CLINICAL_ADVISOR` + `/about/clinical-team`)
6. Osiguranje (E&O + cyber) — **human pending** (launch-blockers)
7. Perzistentno crisis dugme u session UI — **code: done**
8. Obavezna Faza 7 (closure) — **code: done** (exit modal + resume banner)

### 🟠 P1 — prvi mjesec
9. DES-II / DES-T screening
10. SUD praćenje + auto-kočenje
11. Adverse event logging + 24h follow-up
12. AI disclosure + guardrails
13. DPA sa podobrađivačima
14. `/limits` + `/safety` stranice

### 🟡 P2 — prva 3 mjeseca
15. Risk register + mjesečni pregled
16. `/clinical-rationale` sa citatima
17. Dokumentovana eskalaciona procedura + testiranje
18. Redovni klinički pregled (6 mjeseci)

---

## 7. Ključni princip

Ne ograđuješ se **slabljenjem proizvoda** — ograđuješ se **jačanjem strukture**.

Literatura kaže da šteta ne dolazi od bilateralne stimulacije. Dolazi od **preskočene procjene i pripreme** (Keltgen-Lo 2024: 79% / 76%). Tvoja app već ima intake i grounding.

Znači: **svaka barijera koju dodaš je istovremeno i pravna zaštita i klinička ispravnost i konkurentska prednost.** Nijedan rival u niši nema ugrađene ove barijere — `healemdr.com` ima 6 stranica i 0 schema.

Ono što te štiti od tužbe je isto ono što te čini boljim proizvodom.

---

## 8. Citati za safety stranice

| Izvor | Nalaz |
|---|---|
| Keltgen-Lo 2024, Univ. of Washington | 82% EMDRIA konsultanata prijavilo neželjeni događaj u 18 mj.; 79%/76% povezano sa nedovoljnom Fazom 1/2 |
| BJPsych Open 2020, "*potential solution or unregulated recipe for disaster?*" | Samo 1 mala studija self-administered EMDR; bez ozbiljnih neželjenih događaja; metodološki problemi |
| Leeds, Madere & Coy 2022, *Beyond the DES-II* | Screening za disocijativne poremećaje u EMDR-u |
| van den Hout et al. | Working memory taxation — BLS smanjuje vividnost/emocionalnost sjećanja |
| VA/DoD 2023 Clinical Practice Guideline | EMDR — najviši nivo preporuke za PTSD |
| WHO / NICE / APA | EMDR preporučen za PTSD |
| Frontiers in Psychiatry 2024 | Systematic review remote EMDR — 16 studija, 1.231 učesnik |
