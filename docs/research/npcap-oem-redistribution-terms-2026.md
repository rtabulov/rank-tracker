# Npcap OEM Redistribution — fact brief (2026-08-26)

Facts only from Nmap Project primary pages. Not product strategy.

## Free / demo vs OEM Redistribution

| Topic               | Free / demo Npcap                                                                                                                                     | Npcap OEM Redistribution                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Installs            | Up to **5** copies/computers/users (archival copies OK). Nmap, Wireshark, and Microsoft Defender for Identity installs do **not** count toward the 5. | **Unlimited** installs as part of covered product(s); FAQ: no per-copy fees                                              |
| Redistribution      | **Not** permitted without special permission; FOSS authors usually told to have users self-install                                                    | Package Npcap OEM with product; distribute to end users (direct or multi-tier)                                           |
| Silent install `/S` | **Not** available                                                                                                                                     | OEM-only; no graphical windows/prompts; CLI option customization                                                         |
| Support / updates   | Community only; free-license terms can change                                                                                                         | Maintenance (optional on perpetual; included on term) for updates + commercial support; contract/certificate locks terms |
| Installer access    | Public download                                                                                                                                       | Authenticated OEM distribution directory after purchase                                                                  |

Sources: [npcap.com/oem](https://npcap.com/oem/), [oem/redist](https://npcap.com/oem/redist), [license](https://nmap.org/npcap/license.html), [Users' Guide](https://npcap.com/guide/npcap-users-guide.html), [Reference Guide license section](https://npcap.com/guide/index.html).

## Public pricing & quote posture (as published on redist page)

- **No per-seat royalties.** Perpetual buy-out + optional annual maintenance, **or** quarterly term (rights + maintenance).
- **Company-size tiers** (whole company / parent; locked after purchase):
  - **Small/Startup** (≤50 employees, ≤US$10M revenue; subsidiaries only if parent qualifies): perpetual **$39,980** + maint **$11,980**/yr; 5-yr maint prepaid **$47,920**; quarterly **$6,980**/3 mo. Covers **all company products**.
  - **Mid-Sized** (≤500 employees, ≤US$200M revenue, and if public market cap &lt; $1B): perpetual **$59,980** + maint **$14,980**/yr; 5-yr **$59,920**; quarterly **$8,980**/3 mo. Covers **all company products**.
  - **Enterprise**: perpetual **$79,980** + maint **$19,980**/yr; 5-yr **$79,920**; quarterly **$11,980**/3 mo. Covers a **named product line/category**.
- Page text says prices are “broken into four tiers”; redistribution section lists **three** named redistribution tiers above (fourth may refer to internal-use or marketing copy — confirm with sales).
- **Purchase:** manual — email **sales@nmap.com** (or reseller) with company, tier, perpetual vs term, maintenance choice, invoice vs quote. Formal quote returned; no self-serve checkout yet (“hope to set up an online store”).
- Perpetual: **6-month** full-refund trial. Term: **30-day** refund in first quarter.
- Resellers (SoftwareONE, SHI, others) supported.

Source: [https://npcap.com/oem/redist](https://npcap.com/oem/redist).

## Contractual / operational unknowns to confirm before commit

- **Update rights:** Later OEM versions require active maintenance; perpetual without maintenance keeps licensed version but not new releases. Confirm which version(s) may ship and upgrade policy for end-user machines.
- **Bundling topology:** May distribute with Covered Products via resellers/VARs/OEMs; must **not** publish standalone Npcap to the general public without auth. Confirm companion download URL, updater, and “ship installer vs require existing Npcap” models against §6.1.
- **Covered Products scope:** Small/Mid = all company products; Enterprise = named line/category — confirm naming and future products.
- **Consent / UI:** `/S` suppresses Npcap GUI prompts; Windows **UAC/elevation** for a kernel driver is separate and not waived by OEM. Confirm whether vendor must still surface third-party notices/EULA in the companion installer (OEM EULA is between licensee and NSL; end-user rights flow through Covered Products).
- **Attribution:** Free EULA and OEM perpetual template require compliance with **libpcap / WinPcap / radiotap** BSD-style acknowledgements in documentation ([Npcap-Third-Party-Open-Source.pdf](https://npcap.com/src/docs/Npcap-Third-Party-Open-Source.pdf)). Confirm exact text placement for a commercial companion.
- **OEM installer availability:** Behind post-purchase credentials; shared system driver (no private-branded parallel driver). Confirm access, version pinning, co-existence with free Npcap already on machine (`/require_version`, `/require_features`, `/force`).
- **Certificate vs signed contract:** Standard is license certificate; dual-signed PDF/Word templates available; major markups limited for Small/Startup.
- **Internal-use vs redistribution:** Redistribution already includes unlimited internal use for the product; separate internal license only for unrelated org-wide use.

Template: [Perpetual redistribution PDF](https://npcap.com/oem/docs/Npcap-OEM-Software-Redistribution-License-Perpetual.pdf).

## Primary URLs

- https://npcap.com/oem/
- https://npcap.com/oem/redist
- https://npcap.com/oem/internal
- https://nmap.org/npcap/license.html
- https://npcap.com/guide/index.html
- https://npcap.com/guide/npcap-users-guide.html
- https://npcap.com/oem/docs/Npcap-OEM-Software-Redistribution-License-Perpetual.pdf
- https://npcap.com/oem/docs/Npcap-OEM-Software-Redistribution-License-Term.pdf
- https://npcap.com/src/docs/Npcap-Third-Party-Open-Source.pdf
