# EMERGENZ Hantavirus Intelligence Dashboard
## MVP Build Specification v1.0
### Prepared by: EMERGENZ Corporation | May 2026
### License: MIT (code) | Content per source authority licenses (see Sources Registry)

---

## SYSTEM SUMMARY

The EMERGENZ Hantavirus Intelligence Dashboard is an open-source, publicly accessible web application that aggregates, displays, and contextualizes publicly available information about the 2026 MV Hondius Andes virus outbreak for EMS providers, emergency managers, and public health professionals. It does not author any original clinical or guidance content. All substantive content is reproduced verbatim from authoritative public health sources with explicit citation, direct reference links, and license attribution.

The system serves as a professional-grade operational intelligence tool, distinguishing itself from existing low-quality aggregators through source transparency, clinical audience design, EMS-specific alert framing, genomic/virology integration, and legal compliance.

---

## SCOPE

### In Scope (MVP)

- Multi-page React application deployed to Vercel (free hobby tier)
- Vercel serverless function acting as a data proxy (holds API keys server-side)
- Global interactive map with static coordinate markers (Leaflet.js + OpenStreetMap)
- Live case counter fed via Bright Data scrape of CDC Situation Summary
- Outbreak timeline component (static, sourced, chronological)
- Dual feed system: General News Feed (RSS) + Protocol/Guidance Feed (RSS + Bright Data)
- Clinical Profile page (verbatim sourced content, fully cited)
- PPE & Infection Control page (verbatim sourced content, fully cited)
- Genomics & Virology page (verbatim sourced content, phylogenetic context)
- Sources Registry page (full evidence audit trail)
- About / Legal Disclaimer page (MIT license + WHO CC BY-NC-SA 3.0 IGO attribution notice)
- Share via Email modal (Gemini-drafted, user-editable, mailto handler)
- EMS Alert card (Gemini-generated operational summary, refresh-gated)
- U.S. Domestic Monitoring panel (state-by-state table, sourced)
- Flight Contact Tracing panel (3 specific flights documented)
- Healthcare Worker Exposure alert card
- Persistent disclaimer banner on all pages

### Out of Scope (MVP — Phase 2 or later)

- User accounts or authentication
- Push notifications or SMS alerts
- Custom EMERGENZ-authored clinical content of any kind
- Backend database (no PostgreSQL, no persistent storage beyond Vercel KV if needed)
- Automated Bright Data cron jobs (MVP uses on-demand refresh trigger only)
- Multi-language support
- PDF export of dashboard state
- Embedded video content
- Native mobile app

### Assumptions

- EMERGENZ has an active Bright Data account with Web Unlocker access
- EMERGENZ has a Google Workspace for Nonprofits account with Gemini Flash API access
- Vercel hobby tier is sufficient for traffic at launch
- All source content is reproduced under applicable public domain or open-access license terms
- No PII is collected or stored
- GitHub organization account `emergenz-corp` exists or will be created before first push

---

## USERS AND ROLES

Single public-access role. No authentication. No role differentiation at MVP.

**Primary audience:**
- EMS providers (EMT, paramedic, field supervisor)
- Emergency managers
- Public health professionals
- EMS medical directors

**Secondary audience:**
- Journalists and researchers using the Sources Registry
- Open-source contributors (GitHub)
- General public seeking authoritative information

---

## PAGES AND NAVIGATION

### Navigation Structure

Top navigation bar, persistent across all pages:

```
[EMERGENZ Logo] | Dashboard | Clinical | PPE | Genomics | Protocols | News | Sources | About
```

Active page indicator. Disclaimer banner below nav on all pages. Mobile-responsive hamburger menu.

---

### PAGE 1: Dashboard (`/`)

**Purpose:** Real-time operational situation overview for EMS and public health professionals.

**Sections (top to bottom, left-right grid):**

#### 1A — Status Bar (full width, top)
- Outbreak name: "MV Hondius / Andes Virus Outbreak 2026"
- WHO Global Risk: LOW (badge, sourced to WHO DON600)
- CDC Response Level: 3 (badge, sourced to CDC HAN 528)
- ECDC EU/EEA Risk: VERY LOW (badge, sourced to ECDC May 12 update)
- Last data refresh timestamp (from Bright Data pull)
- "Refresh Data" button (triggers Bright Data scrape + Gemini EMS summary regeneration, max 1x per 6 hours, gated by sessionStorage timestamp)

#### 1B — Case Counter Panel (left column, top)
Four distinct metrics, each with source citation chip:

| Metric | Value | Source |
|---|---|---|
| Global Confirmed + Probable Cases | 11 | WHO / ECDC May 12 |
| Global Deaths | 3 | WHO |
| Countries with Confirmed/Probable Cases | 8 | WHO DON600 |
| U.S. States with Active Monitoring | 10 | CDC + State DOHs |

Each number links to its authoritative source URL. Numbers update on Bright Data refresh.

#### 1C — EMS Operational Briefing Card (left column, below counter)
- Gemini Flash-generated plain language summary
- System prompt: "You are summarizing the following official public health advisory text for an EMS provider preparing for a potential patient encounter. Summarize only what is stated in the source text. Do not add information not present in the input. Output 4-5 bullet points. Input: [CDC HAN 528 text + ECDC guidance text]"
- Generated on refresh cycle, cached in sessionStorage with timestamp
- Labeled: "AI-Generated Summary — Source: CDC HAN 528 + ECDC Rapid Risk Assessment"
- Shows generation timestamp
- "View Source Documents" link

#### 1D — Global Map (center, large)
Leaflet.js + OpenStreetMap. Full-width on desktop, stacked on mobile.

**Marker types and colors:**
- RED — Confirmed case location (hospital/treatment)
- ORANGE — Death location
- YELLOW — Monitoring/quarantine facility
- BLUE — Ship waypoint (route stops)
- PURPLE — Flight contact tracing event
- GREEN — U.S. state monitoring (state capital marker)
- WHITE/OUTLINED — Countries with monitoring only

**Default view:** Global (zoom level 2)
**User controls:** Zoom in/out, click any marker for popup card
**Popup card contains:** Location name, status, number of cases/persons monitored, source, last updated

**Marker coordinate dataset (hardcoded, version-controlled):**

Ship Route (BLUE):
- Ushuaia, Argentina: -54.8019, -68.3030
- South Georgia Island: -54.2500, -36.5000
- Tristan da Cunha: -37.1052, -12.2777
- Saint Helena: -15.9650, -5.7089
- Ascension Island: -7.9467, -14.3559
- Praia, Cape Verde: 14.9315, -23.5087
- Tenerife, Canary Islands: 28.2916, -16.6291

Case Locations (RED unless otherwise noted):
- Johannesburg, South Africa: -26.2041, 28.0473 [ORANGE — 1 death; RED — 1 case ICU]
- Zurich, Switzerland: 47.3769, 8.5417 [RED]
- Leiden UMC, Netherlands: 52.1734, 4.4777 [RED]
- Radboud UMC, Nijmegen, Netherlands: 51.8221, 5.8652 [RED + healthcare worker quarantine]
- Amsterdam UMC, Netherlands: 52.3321, 4.9008 [RED — KLM flight attendant]
- Paris, France: 48.8566, 2.3522 [RED — confirmed French case]
- Madrid, Spain: 40.4168, -3.7038 [RED — preliminary positive, pending confirmation]
- Wirral/Arrowe Park, UK: 53.3637, -3.1167 [YELLOW — quarantine]

U.S. Facilities (YELLOW):
- Nebraska Medicine/UNMC, Omaha: 41.2565, -95.9345
- Emory University Hospital, Atlanta: 33.7490, -84.3880

U.S. State Monitoring (GREEN — state capitals):
- Arizona (Phoenix): 33.4484, -112.0740
- California (Sacramento): 38.5816, -121.4944
- Georgia (Atlanta): 33.7490, -84.3880
- Kansas (Topeka): 39.0558, -95.6890
- Maryland (Annapolis): 38.9784, -76.4922
- Nebraska (Lincoln): 40.8136, -96.7026
- New Jersey (Trenton): 40.2171, -74.7429
- Texas (Austin): 30.2672, -97.7431
- Virginia (Richmond): 37.5407, -77.4360
- Washington (Olympia): 47.0379, -122.9007

MV Hondius Return Route (BLUE):
- Rotterdam, Netherlands: 51.9244, 4.4777

Flight Tracing Events (PURPLE):
- Airlink flight origin (Saint Helena): -15.9650, -5.7089
- KLM KL592 origin (Johannesburg): -26.2041, 28.0473
- KLM KL592 destination (Amsterdam): 52.3676, 4.9041
- U.S. repatriation flight destination (Omaha/Offutt AFB): 41.1200, -95.9134

**Map layer toggle controls (UI):**
- [x] Ship Route
- [x] Case Locations
- [x] Monitoring Locations
- [x] Flight Tracing
- [x] U.S. State Monitoring

#### 1E — Outbreak Timeline (right column or bottom-full-width)
Vertical scrollable timeline. Each event is a card containing:
- Date
- Event title (short)
- One-sentence description
- Source badge (WHO / CDC / ECDC / etc.) with link

**Events (hardcoded at launch, appended on updates):**

| Date | Event | Source |
|---|---|---|
| Apr 1 | MV Hondius departs Ushuaia, Argentina. 147 passengers and crew, 23 nationalities. | Wikipedia / Oceanwide |
| Apr 6 | Case 1 symptom onset: fever, headache, mild diarrhea. | WHO DON599 |
| Apr 11 | Case 1 (Dutch male) dies aboard. No PCR performed. | WHO DON599 |
| Apr 13–15 | Ship stops Tristan da Cunha. One resident later suspected. | Wikipedia |
| Apr 24 | Body of Case 1 removed to Saint Helena. Case 2 (Dutch female) disembarks Saint Helena. 30 total passengers disembark. | WHO DON599 |
| Apr 25 | Case 2 boards Airlink flight (82 pax, 6 crew) Saint Helena → Johannesburg. Deteriorates en route. Briefly boards KLM KL592 (Johannesburg → Amsterdam) but removed before takeoff (45 min on board). Flight departs without her. | CNN / Wikipedia |
| Apr 26 | Case 2 dies at Johannesburg ED. | WHO DON599 |
| Apr 27 | Case 3 (British male, pneumonia) medically evacuated from Ascension Island to South Africa ICU. | WHO DON599 |
| Apr 28 | Case 4 (German female) symptom onset. | WHO DON599 |
| May 2 | Case 3 PCR confirms hantavirus. Case 4 dies aboard. WHO notified by UK IHR Focal Point. | WHO DON599 |
| May 3 | Ship docks Praia, Cape Verde. No disembarkation — local facilities insufficient. PCR posthumously confirms Case 2. | WHO DON599 |
| May 4 | WHO publishes DON599. 7 cases: 2 confirmed, 5 suspected. 3 deaths. | WHO DON599 |
| May 5 | Swiss case confirmed by Geneva University Hospitals. Passenger who disembarked Saint Helena Apr 24. | Virological.org |
| May 6 | WHO confirms Andes virus as causative agent. ECDC publishes Rapid Risk Assessment. Ship departs Cape Verde for Tenerife. 3 patients evacuated to Netherlands (Leiden UMC, Radboud UMC). | ECDC / Wikipedia |
| May 7 | CDC deploys team to Canary Islands. ANRS France activates Level 1 Emergency Response. | CDC Press Release / ANRS |
| May 8 | CDC issues HAN 528. 8 cases (6 confirmed, 2 suspected), 3 deaths. Complete genome sequence ANDV/Switzerland/Hu-3337/2026 published on Virological.org. Nextstrain pages established. KLM flight attendant hospitalized Amsterdam UMC. NJ DOH announces monitoring 2 residents. | CDC / Virological.org / NL Times |
| May 9 | Pathoplexus publishes multi-sequence analysis (5 patients) on Virological.org. Single zoonotic spill origin indicated. | Virological.org |
| May 10 | MV Hondius arrives Tenerife. Evacuations begin. UK passengers (22 total including 19 pax, 3 crew) flown to Manchester; 72-hr quarantine Arrowe Park Hospital, then 45-day home isolation. WHO DG Tedros present at Tenerife. | Wikipedia / BBC |
| May 11 | All passengers disembarked. U.S. passengers (18 total) arrive Offutt AFB; 15 to UNMC quarantine unit, 1 confirmed positive to biocontainment unit, 2 to Emory Atlanta. French female confirmed positive. Spanish male preliminary positive. WHO: 11 total cases (9 confirmed, 2 probable). NY State DOH confirms 3 NY residents aboard (NYC, Orange County, Westchester). CDPH confirms 4 CA residents monitored. | ECDC / Al Jazeera / News12 NJ / CDPH |
| May 12 | Radboud UMC (Netherlands) places 12 hospital staff in precautionary quarantine after incorrect blood sampling procedure on confirmed patient. All passengers repatriated. MV Hondius en route Rotterdam (expected May 17–18). ECDC confirms 11 cases (9 confirmed, 2 probable). Emory patient (mildly symptomatic U.S. passenger) tests NEGATIVE for hantavirus. Kansas DOH monitoring 3 residents (high-risk exposure). Washington State monitoring 3 residents. | Euronews / ECDC / ABC News / Yahoo News |

#### 1F — U.S. Domestic Monitoring Table (below map or right column)
State-by-state table:

| State | Persons Monitored | Exposure Category | Confirmed Cases | Source |
|---|---|---|---|---|
| Nebraska | 16 | Repatriated passengers | 1 (asymptomatic positive) | CDC / Nebraska Medicine |
| Georgia | 2 | Repatriated passengers | 0 (1 tested negative) | CDC / Emory |
| California | 4 | 3 passengers + 1 flight contact | 0 | CDPH |
| New York | 3 | Passengers | 0 | NY State DOH |
| New Jersey | 2 | Flight contacts | 0 | NJDOH |
| Texas | 2 | Passengers (pre-outbreak return) | 0 | TX DSHS |
| Arizona | 1 | Passenger (disembarked St. Helena) | 0 | AZ DHS |
| Virginia | TBD | Passengers/contacts | 0 | VDH |
| Maryland | 2 | Flight contacts | 0 | MD DOH |
| Kansas | 3 | High-risk close contacts | 0 | KS KDHE |
| Washington | 3 | 2 flight contacts + 1 passenger | 0 | WA DOH / King County |

Each state name links to its official DOH page.

#### 1G — Flight Contact Tracing Panel (below domestic table)
Three cards, one per flight:

**Flight 1: Airlink — Saint Helena → Johannesburg, April 25**
- Operator: Airlink
- Route: Saint Helena → Johannesburg, South Africa
- Date: April 25, 2026
- Contact risk: 82 passengers, 6 crew in contact tracing
- Exposure: Case 2 (confirmed ANDV, died April 26) was aboard
- Status: South Africa health ministry conducting tracing. Airlink provided full passenger list.
- Source: CNN / WHO DON599

**Flight 2: KLM KL592 (codeshare AF8282 / DL9560 / SK6855) — Johannesburg → Amsterdam, April 25**
- Operator: KLM Royal Dutch Airlines
- Route: Johannesburg → Amsterdam (departed 11:15 PM April 25)
- Date: April 25, 2026
- Contact risk: All passengers and crew on the flight. Case 2 was aboard for 45 minutes before removal.
- Exposure: KLM flight attendant subsequently hospitalized Amsterdam UMC with mild symptoms.
- Status: Dutch GGD contacting all passengers. Flight attendant under isolation and testing.
- Source: NL Times / CNN / Wikipedia

**Flight 3: U.S. Government Repatriation Flight — Tenerife → Offutt AFB (Omaha), May 11**
- Operator: U.S. Government charter
- Route: Tenerife, Canary Islands → Offutt Air Force Base, Omaha, Nebraska
- Date: May 11, 2026
- Passengers: 18 (17 Americans + 1 British dual national)
- Exposure event: 1 passenger tested mildly positive during flight. 1 additional mildly symptomatic passenger. Both traveled in aircraft biocontainment units.
- Status: All 18 at UNMC (15 quarantine unit, 1 biocontainment positive, 2 Emory Atlanta).
- Source: CDC / NPR / ABC News

#### 1H — Healthcare Worker Alert Card (prominent, red-bordered)
Title: "HEALTHCARE WORKER EXPOSURE EVENT — Netherlands"
Content: Verbatim from Euronews/DutchNews May 12 reporting, attributed.
Key facts: 12 Radboud UMC staff in precautionary quarantine after incorrect blood sampling procedure with confirmed ANDV patient. ANDV does not spread via casual contact; requires close sustained exposure or aerosol-generating procedures.
IPC reminder: Link to PPE page.
Source: Euronews May 12, 2026 / DutchNews.nl May 12, 2026.

#### 1I — Share via Email Button (persistent, bottom right)
- Opens modal
- Gemini Flash call generates draft email with:
  - Subject: "EMERGENZ Situational Alert: Andes Virus / MV Hondius Outbreak — [Date]"
  - Body: Current case counts, EMS briefing bullets, source links, disclaimer
  - System prompt is tightly scoped, templated, pulls from cached EMS briefing card
- User can edit draft in modal
- "Send" button: `mailto:` handler (opens default email client)
- No backend email service required

---

### PAGE 2: Clinical Profile (`/clinical`)

**Purpose:** Verbatim clinical reference for healthcare providers. Zero original EMERGENZ content. Every text block attributed.

**Sections:**

#### Etiology
Source: CDC About Andes Virus (`cdc.gov/hantavirus/about/andesvirus.html`)
Source: WHO DON599

#### Transmission
Source: CDC HAN 528 — verbatim p2p transmission passage
Source: NYC DOH HAN Advisory #8 — epidemiology section verbatim
Source: WHO DON599

#### Incubation Period
Source: CDC HAN 528 — "4 to 42 days after exposure"
Source: NYC DOH HAN Advisory #8 — "4-42 days"

#### Clinical Presentation — Three Phases
Source: CDC Clinician Brief HPS (`cdc.gov/hantavirus/hcp/clinical-overview/hps.html`)
Prodrome: fever, fatigue, muscle aches, GI symptoms
Cardiopulmonary: ARDS, pulmonary edema, shock, rapid deterioration
Convalescent: survivors only

#### Differential Diagnosis
Source: CDC Clinician Brief HPS — verbatim differential list (influenza, Legionnaire's, leptospirosis, mycoplasma, Q fever)

#### Diagnosis
Source: CDC Clinician Brief HPS — ELISA, PCR, IgM/IgG criteria verbatim
Contact for testing: CDC Emergency Operations Center 770-488-7100 (from CDC Clinical Overview)
NYC reporting: 866-692-3641 (from NYC DOH HAN Advisory #8)

#### Treatment
Source: CDC Clinician Brief HPS — "no specific treatment... emergency medical care immediately... intensive care unit... even before diagnosis"
Source: NYC DOH HAN Advisory #8 — ECMO reference verbatim

#### Case Fatality Rate
Source: CDC HAN 528 — "approximately 38%"
Source: Al Jazeera — "40 to 50 percent, particularly among elderly people" (secondary, attributed)
Source: NYC DOH HAN Advisory #8 — "nearly 4 in 10 people who are infected"

#### EMS-Specific Considerations
Source: NYC DOH HAN Advisory #8 — full IPC section verbatim
Source: ECDC Rapid Risk Assessment — IPC escalation guidance verbatim

**Page layout:** Each section is a card. Top of each card: source authority badge, document title, publication date, direct URL. Bottom of page: link to Sources Registry.

---

### PAGE 3: PPE & Infection Control (`/ppe`)

**Purpose:** Authoritative PPE guidance for EMS and clinical staff. Verbatim sourced only.

**Sections:**

#### Risk Stratification
Source: ECDC Rapid Risk Assessment
Two tiers: routine patient contact vs. aerosol-generating procedures (AGP)

#### PPE Selection Table
Source: NYC DOH HAN Advisory #8 — "airborne infection isolation rooms using the appropriate personal protective equipment (PPE), including gown, gloves, eye protection, and N95 respirator or higher"
Source: ECDC Rapid Risk Assessment — "standard and droplet precautions, which can be escalated to airborne precautions in the event that aerosol-generating procedures are performed"

| Scenario | Minimum PPE | Source |
|---|---|---|
| Routine patient contact | Surgical mask, gloves, gown, eye protection | ECDC |
| AGP (intubation, BVM, CPAP, nebulizer) | N95 or higher, gloves, gown, face shield | NYC DOH / ECDC |
| Suspected/confirmed ANDV patient (any contact) | Airborne isolation + N95+ + gown + gloves + eye protection | NYC DOH HAN #8 |

#### Donning and Doffing
Source: CDC Isolation Precautions Appendix A (`cdc.gov/infection-control/hcp/isolation-precautions/appendix-a-type-duration.html`)
Verbatim sequence with source attribution on each step.

#### Decontamination
Source: CDC Prevention guidance — EPA-registered disinfectants effective against enveloped viruses. ANDV is an enveloped RNA virus.

#### Waste Disposal
Source: CDC / OSHA guidance — biohazard classification, bagging requirements, jurisdictional notification.

#### Healthcare Worker Exposure Protocol
Source: NYC DOH HAN Advisory #8 — "Secondary infections among healthcare workers have previously been documented in healthcare facilities"
Note: Current outbreak — 12 Radboud UMC workers in quarantine after incorrect procedure. Link to Dashboard healthcare worker alert.

**Each section follows same card/attribution format as Clinical page.**

---

### PAGE 4: Genomics & Virology (`/genomics`)

**Purpose:** Authoritative genomic and virological data for researchers, public health professionals, and informed practitioners. Verbatim sourced. Links to primary sequence repositories.

**Sections:**

#### Virus Identification
Source: WHO DON599 — "Identification of Andes virus was performed through genomic sequencing at NICD and virus-specific PCR at Geneva University Hospitals"
Source: ECDC Rapid Risk Assessment — strain classification

#### Strain Designation
Designated: ANDV/Switzerland/Hu-3337/2026
Source: Virological.org — Swiss National Reference Center, Geneva University Hospitals / University of Zurich

#### Sequence Repository Links
- Complete genome sequence: Virological.org `/t/complete-sequence-of-orthohantavirus-andesense-virus-swiss-resident-2026/1023`
- Pathoplexus multi-patient analysis: Virological.org `/t/preliminary-analysis-of-orthohantavirus-andesense-virus-sequences-from-a-cruise-ship-related-cluster-may-2026/1029`
- Nextstrain ANDV outbreak pages: `nextstrain.org` (verify specific URL)

#### Laboratory Network
Source: WHO DON599 verbatim — NICD South Africa, Geneva University Hospitals, Senegal, UK, Netherlands, Argentina

#### Phylogenetic Summary
Source: Prof. Piet Maes (Hantavirus Society / Plotkin Institute, University of Brussels) via Science Media Centre
Key finding: "The available phylogenetic and sequence data suggest that the Swiss patient isolate represents a relatively typical naturally circulating ANDV lineage originating from the established rodent reservoir in Chile/Argentina, rather than a highly divergent or newly emerged variant."
Full expert statement linked and attributed. Source: Science Media Centre.

Key finding: "Sequences are all very similar to each other, suggesting a single zoonotic spill." Source: Pathoplexus / Virological.org.

#### Genomic Segments
ANDV has three genomic segments: S (small), M (medium), L (large)
Source: Prof. Maes / Science Media Centre — "Across all three genomic segments (S, M, and L), the virus clusters consistently with known South American Andes virus strains"

#### Origin Investigation
Source: Al Jazeera / Time Magazine — landfill site in Ushuaia, bird-watching, speculative
Clearly labeled as: UNDER INVESTIGATION / UNCONFIRMED
Note: Authoritative sources (WHO, CDC) have not confirmed origin.

#### Surveillance Context
Source: PAHO — endemic ANDV range (Chile/Argentina Patagonia)
Source: Time Magazine / AP — Argentine health ministry reported 101 hantavirus infections since June 2025, roughly double the prior year's same-period caseload.

---

### PAGE 5: Protocols & Guidance (`/protocols`)

**Purpose:** Live feed of EMS, emergency management, and public health protocol releases. Professional audience only.

**Feed sources (in priority order):**
1. CDC HAN Archive RSS: `tools.cdc.gov/api/v2/resources/media/132608.rss`
2. ECDC Publications RSS: `ecdc.europa.eu/en/rss.xml`
3. NETEC resources (Bright Data scrape): `netec.org` — two current documents on hantavirus
4. NYC DOH Health Advisory page (Bright Data scrape — new advisories)
5. NJDOH press releases (Bright Data scrape)
6. CDPH press releases (Bright Data scrape)
7. VDH hantavirus page (Bright Data scrape)
8. Netherlands Government MV Hondius updates (Bright Data scrape)
9. ANRS France emergency response page (Bright Data scrape)

**Feed card structure:**
- Authority name (badge)
- Document type (HAN / Rapid Risk Assessment / Advisory / Press Release / Clinical Brief)
- Title
- Publication date
- One-line description
- Direct link (opens new tab)
- "Last verified" timestamp

**Pinned documents (always top of feed):**
- CDC HAN 528 (May 8, 2026)
- ECDC Rapid Risk Assessment (May 6, 2026)
- ECDC Live Surveillance Page (updated May 12, 2026)
- NYC DOH HAN Advisory #8 (May 8, 2026)
- WHO DON599 (May 4, 2026)
- WHO DON600 (verify date)
- NJDOH Press Release (May 8, 2026)

---

### PAGE 6: News Feed (`/news`)

**Purpose:** General media coverage for situational awareness. Clearly distinguished from protocol/guidance feed.

**Feed sources (RSS, client-parseable via Vercel proxy):**
- CDC Newsroom: `tools.cdc.gov/api/v2/resources/media/132608.rss`
- WHO Disease Outbreak News: `who.int/feeds/entity/csr/don/en/rss.xml`
- Reuters Health: `feeds.reuters.com/reuters/healthNews`
- AP Health: via rss2json or Vercel proxy
- ECDC general: `ecdc.europa.eu/en/rss.xml`

**Feed card structure:**
- Source name
- Headline
- Publication timestamp
- Excerpt (first 150 characters of description)
- Direct link

**Label prominently:** "News feeds contain media coverage. For authoritative guidance, see Protocols & Guidance."

---

### PAGE 7: Sources Registry (`/sources`)

**Purpose:** Complete audit trail. Open-source contribution target. License transparency.

**Per-source record:**
- Authority name
- Document title
- Document type
- Publication date
- Last verified date
- URL (direct link)
- Content used (which dashboard pages reference this source)
- License / terms of use
- Accessibility status (VERIFIED / ROBOTS BLOCKED / 403 ERROR)

**License column values:**
- U.S. Government Public Domain (CDC, HHS, state DOH .gov documents)
- CC BY-NC-SA 3.0 IGO (WHO content)
- CC BY 4.0 (Virological.org)
- Open Access with Attribution (ECDC)
- News Media — Fair Use Reference (Reuters, AP, Al Jazeera — linked only, not reproduced)

**Blocked/inaccessible sources (listed with note):**
- CDPH HantaToolkit — robots.txt blocked for scraping; listed as manual reference link
- WA DOH Hantavirus Guideline — 403 error; listed as manual reference link

**Section: WHO License Note**
"WHO content reproduced on this dashboard is licensed under CC BY-NC-SA 3.0 IGO. EMERGENZ Corporation is a 501(c)(3) nonprofit. Reproduction is for non-commercial public health information purposes. All WHO content is attributed, linked to the source document, and carries the WHO copyright notice. The dashboard codebase is licensed under MIT; WHO-attributed content sections carry their original license independently."

---

### PAGE 8: About & Legal (`/about`)

**Sections:**

#### About This Dashboard
- What it is, what it is not
- Open-source statement
- GitHub repository link: `github.com/emergenz-corp/hantavirus-intel-dashboard`
- Contribution instructions link (CONTRIBUTING.md in repo)

#### About EMERGENZ Corporation
- Name: EMERGENZ Corporation
- EIN: 93-4070519
- Status: 501(c)(3) nonprofit
- Mission: EMS and mobile health innovation
- Website: [EMERGENZ website]
- Contact: [contact email or form link]

#### Legal Disclaimer
Full text (to be reviewed by healthcare attorney before publication):

"The EMERGENZ Hantavirus Outbreak Intelligence Dashboard is provided for informational purposes only. Content is aggregated from publicly available sources including the World Health Organization, U.S. Centers for Disease Control and Prevention, European Centre for Disease Prevention and Control, and other public health authorities. EMERGENZ Corporation makes no representations or warranties regarding the accuracy, completeness, timeliness, or fitness for any particular purpose of the information presented. This dashboard does not constitute medical advice, clinical guidance, or official public health direction. EMS providers, emergency managers, and public safety personnel must follow their agency's established protocols and the directives of their medical director. EMERGENZ Corporation, its officers, employees, volunteers, and affiliates shall not be liable for any clinical, operational, or legal outcome arising from use of or reliance on this dashboard. All source content remains the property of the originating authority and is reproduced under applicable license terms as documented in the Sources Registry."

#### MIT License Text
Full MIT license text (standard, with EMERGENZ Corporation copyright line).

#### WHO Content Attribution Notice
"Portions of this dashboard reproduce content from World Health Organization publications. © World Health Organization [year]. Some rights reserved. Licensed under CC BY-NC-SA 3.0 IGO."

---

## SYSTEM COMPONENTS

### Frontend
- Framework: React + TypeScript
- Routing: React Router v6
- Map: Leaflet.js + react-leaflet + OpenStreetMap tiles (zero cost)
- RSS parsing: rss2json.com free tier OR Vercel proxy fetch + xml2js
- Styling: Tailwind CSS (utility-first, EMERGENZ/STRATA design tokens)
- State: useState / useEffect (no Redux needed at MVP)
- Caching: sessionStorage for Gemini outputs with timestamp gates
- Deployment: Vercel (auto-deploy from GitHub main branch)

### Backend (Vercel Serverless Functions)
All functions live in `/api/` directory, deployed as Vercel Edge Functions.

`/api/refresh` — POST
- Triggers Bright Data scrape of CDC Situation Summary
- Returns structured JSON: { confirmed, probable, deaths, countries, lastUpdated }
- Rate-limited by Vercel: enforces 6-hour minimum between calls via server-side timestamp

`/api/ems-summary` — POST
- Accepts: { sourceText: string } (CDC HAN + ECDC text)
- Calls Gemini Flash API with scoped system prompt
- Returns: { summary: string[], generatedAt: string }
- Server-side: checks sessionStorage-equivalent (Vercel KV if needed) to prevent redundant calls

`/api/email-draft` — POST
- Accepts: { caseStats, emsSummary }
- Calls Gemini Flash API with email template prompt
- Returns: { subject: string, body: string }
- User-triggered only, no rate limit (human gated)

`/api/feeds` — GET
- Fetches and merges RSS feeds for news and protocol pages
- Returns normalized feed item array
- Cached for 2 hours server-side

### Data Layer
- No persistent database at MVP
- All coordinate data: hardcoded JSON file `/src/data/markers.json`
- Timeline events: hardcoded JSON file `/src/data/timeline.json`
- Source registry: hardcoded JSON file `/src/data/sources.json`
- U.S. monitoring table: hardcoded JSON file `/src/data/us-monitoring.json`
- Flight tracing: hardcoded JSON file `/src/data/flights.json`
- All data files are version-controlled and represent the single source of truth until live scraping supersedes specific fields

---

## DESIGN SYSTEM

### Aesthetic Direction
Industrial/Utilitarian with STRATA-aligned precision. Dark-mode primary. High information density. No decorative elements that don't serve operational purpose. Typography communicates urgency without alarm.

### Color Tokens (CSS variables, STRATA-aligned)
```css
--color-bg-primary: #0D1117       /* Deep slate black */
--color-bg-secondary: #161B22     /* Panel background */
--color-bg-tertiary: #21262D      /* Card background */
--color-border: #30363D           /* Subtle border */
--color-text-primary: #E6EDF3     /* Primary text */
--color-text-secondary: #8B949E   /* Secondary/metadata */
--color-text-muted: #484F58       /* Disabled/muted */
--color-accent-red: #F85149       /* Confirmed case / alert */
--color-accent-orange: #D29922    /* Death / warning */
--color-accent-yellow: #E3B341    /* Monitoring / caution */
--color-accent-green: #3FB950     /* Cleared / low risk */
--color-accent-blue: #388BFD      /* Ship route / informational */
--color-accent-purple: #BC8CFF    /* Flight tracing */
--color-accent-white: #FFFFFF     /* Outlined markers */
--color-emergenz: #00C2FF         /* EMERGENZ brand accent */
```

### Typography
- Display / Headers: `IBM Plex Mono` — technical, authoritative, EMS/comms aesthetic
- Body: `IBM Plex Sans` — clean, readable, professional
- Data/Numbers: `IBM Plex Mono` — monospaced for case counts and coordinates
- Both fonts: Google Fonts, free tier

### Component Patterns
- Source citation chips: small badge with authority abbreviation + link icon
- Alert cards: left-border accent color, icon, title, verbatim content, source chip
- Case counter tiles: large monospaced number, label below, source chip bottom-right
- Timeline cards: date left, content right, source chip bottom
- Feed cards: authority badge top-left, title, date, excerpt, arrow link

---

## GEMINI API BUDGET CONTROLS (built into code)

```typescript
const GEMINI_RATE_LIMITS = {
  emsSummary: {
    minIntervalMs: 6 * 60 * 60 * 1000, // 6 hours
    cacheKey: 'gemini_ems_summary_cache',
    timestampKey: 'gemini_ems_summary_ts'
  },
  emailDraft: {
    minIntervalMs: 0, // user-triggered only, no time gate
    maxPerSession: 10 // soft limit via sessionStorage counter
  },
  locationContext: {
    cacheKey: 'gemini_location_cache', // keyed by marker ID
    ttlMs: 24 * 60 * 60 * 1000 // 24-hour cache per location
  }
}
```

All Gemini calls go through `/api/` functions. API key never exposed to client.

---

## PERSISTENT DISCLAIMER BANNER

Displayed on ALL pages below navigation. Cannot be dismissed. Text:

"This dashboard aggregates publicly available information from authoritative sources for informational purposes only. It does not constitute medical advice or official public health guidance. EMS providers must follow their agency protocols and medical director directives. All content is attributed to its originating authority. EMERGENZ Corporation is not liable for clinical or operational decisions made based on this information. View full disclaimer."

---

## FILE AND MODULE STRUCTURE

```
/
├── /src
│   ├── /pages
│   │   ├── Dashboard.tsx
│   │   ├── Clinical.tsx
│   │   ├── PPE.tsx
│   │   ├── Genomics.tsx
│   │   ├── Protocols.tsx
│   │   ├── News.tsx
│   │   ├── Sources.tsx
│   │   └── About.tsx
│   ├── /components
│   │   ├── NavBar.tsx
│   │   ├── DisclaimerBanner.tsx
│   │   ├── StatusBar.tsx
│   │   ├── CaseCounter.tsx
│   │   ├── GlobalMap.tsx
│   │   ├── MapMarker.tsx
│   │   ├── MapPopup.tsx
│   │   ├── MapLayerToggle.tsx
│   │   ├── Timeline.tsx
│   │   ├── TimelineCard.tsx
│   │   ├── EMSBriefingCard.tsx
│   │   ├── FeedCard.tsx
│   │   ├── SourceChip.tsx
│   │   ├── AlertCard.tsx
│   │   ├── USMonitoringTable.tsx
│   │   ├── FlightTracingPanel.tsx
│   │   ├── ShareModal.tsx
│   │   └── ContentBlock.tsx   // Reusable verbatim-content card with citation
│   ├── /data
│   │   ├── markers.json
│   │   ├── timeline.json
│   │   ├── sources.json
│   │   ├── us-monitoring.json
│   │   ├── flights.json
│   │   └── clinical-content.json  // Verbatim passages + source metadata
│   ├── /hooks
│   │   ├── useCaseData.ts
│   │   ├── useFeeds.ts
│   │   └── useGeminiCache.ts
│   ├── /utils
│   │   ├── geminiClient.ts
│   │   ├── brightDataClient.ts
│   │   ├── rssParser.ts
│   │   └── sessionCache.ts
│   ├── /styles
│   │   └── tokens.css
│   └── App.tsx
├── /api
│   ├── refresh.ts
│   ├── ems-summary.ts
│   ├── email-draft.ts
│   └── feeds.ts
├── /public
│   ├── favicon.ico
│   └── robots.txt  // ALLOW all (public dashboard)
├── README.md
├── CONTRIBUTING.md
├── LICENSE          // MIT
├── SOURCES.md       // Machine-readable source registry
└── vercel.json
```

---

## BUILD PHASES

### Phase 1 — Scaffold and Static Shell (Days 1–2)
- Initialize React + TypeScript + Tailwind project
- Implement routing (all 8 pages)
- Build NavBar, DisclaimerBanner, design tokens
- Deploy empty shell to Vercel
- Create GitHub org repo `emergenz-corp/hantavirus-intel-dashboard`
- Add README, LICENSE, CONTRIBUTING.md

### Phase 2 — Static Data Pages (Days 3–4)
- Populate all JSON data files from research compiled in this spec
- Build Timeline component (hardcoded data)
- Build Sources Registry page (hardcoded data)
- Build US Monitoring Table
- Build Flight Tracing Panel
- Build Clinical, PPE, Genomics pages (ContentBlock components with all verbatim text and citations)
- Build About/Legal page

### Phase 3 — Map (Days 5–6)
- Install react-leaflet + leaflet
- Implement GlobalMap component with all marker types
- Implement MapLayerToggle
- Implement popup cards per marker
- Test zoom levels: global → national → regional

### Phase 4 — Live Data Integration (Days 7–9)
- Build Vercel serverless functions (`/api/refresh`, `/api/feeds`)
- Integrate Bright Data Web Unlocker for CDC Situation Summary scrape
- Build RSS feed parser for News and Protocols pages
- Wire CaseCounter to live data
- Implement sessionStorage cache layer

### Phase 5 — Gemini Integration (Days 10–11)
- Build `/api/ems-summary` and `/api/email-draft` functions
- Implement Gemini budget controls and caching
- Build EMS Briefing Card with refresh gating
- Build Share Modal with Gemini email draft + mailto handler

### Phase 6 — Polish and QA (Days 12–14)
- Mobile responsiveness audit
- Accessibility pass (ARIA labels, focus management, color contrast)
- Source link verification (all URLs live)
- Disclaimer language final review
- Performance audit (map tile loading, feed latency)
- Final deploy to production Vercel URL

---

## CONSTRAINTS AND GUARDRAILS FOR BUILDER

1. Do NOT author any clinical, PPE, or epidemiological content. All substantive content must be reproduced verbatim from an identified source in the sources registry.
2. Do NOT call Gemini API from the client. All Gemini calls go through `/api/` serverless functions.
3. Do NOT expose Bright Data credentials or Gemini API key in client-side code.
4. Do NOT use Google Maps. Use Leaflet.js + OpenStreetMap only.
5. Do NOT use localStorage or sessionStorage for sensitive data.
6. Do NOT implement user authentication at MVP.
7. Do NOT add features outside this spec without flagging for review.
8. Every source citation chip must include: authority name, document title, publication date, and direct URL. No unsourced content blocks.
9. The disclaimer banner is non-dismissible. Do not add a close/dismiss button.
10. Gemini outputs must be labeled as AI-generated with source inputs identified.
11. WHO content sections must carry CC BY-NC-SA 3.0 IGO attribution inline, not only on the Sources page.

---

## ACCEPTANCE CRITERIA

The MVP is complete when:

- [ ] All 8 pages render without errors on desktop and mobile
- [ ] Global map displays all marker types with correct colors and popup data
- [ ] Map layer toggles function correctly
- [ ] Case counter fetches live data from CDC via Bright Data proxy
- [ ] Timeline displays all documented events with source citations
- [ ] U.S. monitoring table is complete with state DOH source links
- [ ] Flight tracing panel displays all 3 flights with correct data
- [ ] Healthcare worker alert card displays on Dashboard
- [ ] Clinical page contains no unsourced content; every block has citation chip
- [ ] PPE page contains no unsourced content; every block has citation chip
- [ ] Genomics page links to Virological.org, Nextstrain, Science Media Centre
- [ ] Protocol feed ingests and displays CDC HAN and ECDC RSS items
- [ ] News feed ingests and displays items from at least 3 RSS sources
- [ ] Sources Registry lists all verified sources with license column populated
- [ ] About page contains full disclaimer text and MIT license
- [ ] WHO CC BY-NC-SA attribution appears on pages reproducing WHO content
- [ ] EMS Briefing Card generates from Gemini and respects 6-hour cache gate
- [ ] Share Modal generates email draft via Gemini and opens mailto handler
- [ ] Disclaimer banner appears on all 8 pages and cannot be dismissed
- [ ] No Gemini or Bright Data API keys appear in client-side code
- [ ] Deployed to Vercel with custom URL
- [ ] GitHub repo is public under MIT license with README and CONTRIBUTING.md

---

## OPEN QUESTIONS (resolve before Phase 4)

1. Confirm Bright Data Web Unlocker is active on EMERGENZ account and test against `cdc.gov/hantavirus/situation-summary/index.html`
2. Confirm Gemini Flash API key is active via Google Workspace for Nonprofits account
3. Confirm final Vercel project name / custom domain (if any)
4. Verify Nextstrain specific URL for ANDV outbreak pages
5. Verify WHO DON600 URL and confirm it is a separate document from DON599
6. Attorney review of disclaimer language before public launch
7. Confirm EMERGENZ GitHub org account handle (`emergenz-corp` or alternative)

---

*Build Spec v1.0 — EMERGENZ Corporation — May 2026*
*This document is the authoritative build reference. All implementation decisions must trace back to this spec or a documented amendment.*
