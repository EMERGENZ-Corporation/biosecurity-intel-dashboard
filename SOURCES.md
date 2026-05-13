# Source Registry — EMERGENZ Hantavirus Intel Dashboard

Machine-readable registry of primary sources used in this dashboard. All sources are official government, intergovernmental, or peer-reviewed publications.

Last updated: 2026-05-12

---

## Primary Outbreak Surveillance

| Authority | Document | URL | Date |
|-----------|----------|-----|------|
| WHO | Disease Outbreak News DON599 | https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON599 | 2026-05-07 |
| WHO | Disease Outbreak News DON600 | https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON600 | 2026-05-11 |
| CDC | Health Alert Network HAN 00528 | https://www.cdc.gov/han/php/notices/han00528.html | 2026-05-09 |
| ECDC | Andes Hantavirus Outbreak Rapid Risk Assessment | https://www.ecdc.europa.eu/en/infectious-disease-topics/hantavirus-infection/surveillance-and-updates/andes-hantavirus-outbreak | 2026-05-09 |

---

## Clinical Guidance

| Authority | Document | URL | Date |
|-----------|----------|-----|------|
| CDC | Hantavirus — Signs & Symptoms | https://www.cdc.gov/hantavirus/signs-symptoms/index.html | 2024 |
| CDC | Hantavirus — Diagnosis & Testing | https://www.cdc.gov/hantavirus/diagnosis/index.html | 2024 |
| CDC | Hantavirus — Treatment | https://www.cdc.gov/hantavirus/treatment/index.html | 2024 |
| NETEC | Interim Guidance: Andes Virus Patient Management | https://netec.org/resources/andes-hantavirus/ | 2026-05-10 |
| NYC DOH | HAN Advisory — Hantavirus (ANDV) | https://www.nyc.gov/assets/doh/downloads/pdf/han/advisory/2026/han-advisory-hantavirus-cruise-ship.pdf | 2026-05-10 |

---

## PPE & Infection Control

| Authority | Document | URL | Date |
|-----------|----------|-----|------|
| CDC | Hantavirus Infection Control Guidance | https://www.cdc.gov/hantavirus/hcp/infection-control/index.html | 2024 |
| WHO | Infection Prevention & Control for Hantavirus | https://www.who.int/publications/i/item/WHO-HEP-WHE-IHM-2026.1 | 2026-05-08 |

---

## Genomics & Phylogenetics

| Authority | Document | URL | Date |
|-----------|----------|-----|------|
| NCBI GenBank | ANDV sequences — MV Hondius outbreak | https://www.ncbi.nlm.nih.gov/nuccore/?term=Andes+virus+2026 | 2026 |
| Virological.org | Preliminary ANDV genomic characterisation | https://virological.org/t/preliminary-genomic-characterisation-of-andes-virus-from-mv-hondius-outbreak/960 | 2026-05-09 |
| Nextstrain | ANDV outbreak phylogenetic analysis | https://nextstrain.org | 2026-05-08 |

---

## Situation Map Sources

See `src/data/markers.json` for per-marker source attribution. Each marker carries `sourceUrl` and, where multiple sources apply, a `sources[]` array with labeled links.

---

## News & Media Aggregation

The News feed (`/news`) aggregates RSS from WHO, CDC, and ECDC. Media coverage is provided for situational awareness only and is not considered a primary source for clinical or operational decisions.

---

## Data Freshness

- Case counts: Updated from static baseline as of 2026-05-12. Live refresh via CDC Situation Summary page when `BRIGHT_DATA_API_KEY` is configured.
- Protocol feeds: 2-hour client-side cache of CDC HAN and ECDC RSS feeds.
- EMS Briefing: AI-generated (Gemini 2.0 Flash) summary from CDC HAN 528 + ECDC RRA, 6-hour refresh gate.
