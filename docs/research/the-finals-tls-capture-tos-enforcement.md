# THE FINALS TLS traffic-capture companion — ToS & enforcement risk (research)

**Ticket:** [Wayfinder: ToS and enforcement risk for TLS traffic-capture companion](https://github.com/rtabulov/rank-tracker/issues/75)  
**Map:** [Wayfinder map: RS capture companion (Option C, installer-first)](https://github.com/rtabulov/rank-tracker/issues/73)  
**Research date:** 2026-07-20  
**Approach under review:** Standalone Windows companion using **`SSLKEYLOGFILE` + Npcap/tshark packet capture** (no memory hooks, no DLL injection) to read the **local player's own** Embark discovery / shared-profile HTTPS JSON responses while THE FINALS is running.

---

## Recommendation

### **Ship-with-disclaimer** (not clean ship; not hard do-not-ship)

Proceed with Option C only if the product treats account risk as **user-owned** and never claims Embark/Nexon approval or ToS compliance. The companion must surface a **first-run, explicit consent** screen that states:

1. Packet capture and TLS decryption of game traffic is **prohibited by Nexon/Embark Terms** (see citations below).
2. Use may trigger **Easy Anti-Cheat (EAC)** or Embark enforcement even without gameplay cheating intent.
3. Rank Tracker is **not affiliated with Embark** and cannot guarantee safety.
4. A **manual / non-capture fallback** (leaderboard API, manual RS entry) remains available.

**Conservative alternative:** **Do-not-ship** if the team needs zero ToS exposure, legal cleanliness, or cannot accept any ban-liability for end users — the contractual case against capture is explicit, not ambiguous.

**Why not clean ship:** No official allowlist, no carve-out for stat-only tools, and Nexon Code of Conduct explicitly names **packet sniffing** and **reading/mining service-generated information**.

**Why not hard do-not-ship:** The technique avoids the highest-risk anti-cheat surfaces (memory injection, code modification); community tools using the same stack operate openly; Epic's EAC documentation states Wireshark-class tools are not blocked at the OS level; practical ban reports for passive read-only capture are **not documented** in primary sources (confidence: **low** on enforcement frequency).

---

## Confidence summary

| Claim                                                                                            | Confidence                                              |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Nexon/Embark ToS prohibits packet sniffing and intercepting/reading service data                 | **High**                                                |
| Open Beta / Embark EULA language prohibits decrypting client↔server traffic                      | **High**                                                |
| Embark ban policy treats unauthorized third-party / interacting external software as enforceable | **High**                                                |
| EAC does not block Wireshark/Npcap installation by itself                                        | **High** (Epic first-party)                             |
| Passive TLS capture while game runs will **not** trigger EAC/Embark                              | **Low** — no official guarantee; heuristic risk remains |
| Embark will tolerate a commercial Rank Tracker capture companion                                 | **Low** — no precedent of endorsement                   |

---

## What the companion actually does (risk framing)

| Property                                    | This companion                  | Typical cheat |
| ------------------------------------------- | ------------------------------- | ------------- |
| Memory hooks / injection                    | **No**                          | Yes           |
| Modifies game binaries or packets in flight | **No** (read-only)              | Often yes     |
| Competitive in-match advantage              | **No** (RS read from menus/API) | Yes           |
| Decrypts TLS game traffic                   | **Yes** (`SSLKEYLOGFILE`)       | Often yes     |
| Packet capture driver (Npcap)               | **Yes**                         | Sometimes     |
| Self-only data                              | **Yes** (map scope)             | No            |
| Expressly authorized by Embark              | **No**                          | No            |

The absence of memory hooks **reduces** anti-cheat tripwire overlap but **does not** remove ToS violations tied to sniffing/decrypting service traffic.

---

## Primary sources & citations

### 1. Nexon / Embark Terms of Service (THE FINALS)

**Source:** [Terms of Service and EULA — Help Center FAQ 14](https://id.embark.games/the-finals/support/faq/14-terms-of-service-and-end-user-license-agreement) (last updated **2025-09-22**) → English document at [Nexon terms/1369](https://m.nexon.com/terms/1369) (Embark Studios AB listed as contracting entity).

**Section V — Code of Conduct** (relevant bullets):

- Prohibits _"hacks, cracks, bots, or third-party software that may modify, temporarily or permanently, the code or the user experience of the Services"_ or _"any application, software or technology that is **not expressly authorized** by us"_ that enables cheating or similar.
- **Explicit capture ban:** _"Intercepting, emulating, or redirecting the communication protocols used by Nexon or its designees in any way, including without limitation through protocol emulation, tunneling, **packet sniffing**, modifying or adding components to software, use of a **data mining utility program to intercept, collect, read or mine information generated by the Services**…"_

**Section III — Unauthorized Third-Party Software:**

- Services _"may access and monitor your device… for third-party programs or software that is prohibited under these Terms ('Unauthorized Third-Party Software')."_ Detection may lead to enforcement per Privacy Policy.

**Implication:** A companion that runs tshark/Npcap, sets `SSLKEYLOGFILE`, decrypts Embark HTTPS responses, and parses discovery JSON **matches the plain language** of the packet-sniffing / data-mining prohibition, regardless of intent or self-only scope.

### 2. Embark Open Beta Terms (game-specific EULA language)

**Source:** [Open Beta Terms of Service](https://www.embark-studios.com/obtos)

Under **"No cheating"**:

- Mandatory anti-cheat; must not disable/circumvent/tamper with anti-cheat.
- _"You may not **decrypt or modify any data transmitted between the game software and our game servers**."_

Also prohibits content/tools that _"mine, scrape or expropriate any system, data or personal information."_

**Implication:** `SSLKEYLOGFILE` exists specifically to decrypt TLS sessions — functionally aligned with the decrypt prohibition even when no packets are modified.

### 3. THE FINALS Ban & Enforcement Policy

**Source:** [Ban & Enforcement Policy — FAQ 200](https://id.embark.games/the-finals/support/faq/200-ban-enforcement-policy) (last updated **2026-07-08**)

Enforcement grounds include:

- _"Using cheats, hacks, or **third-party tools that affect gameplay**"_
- _"Attempting to bypass **anti-cheat protections**"_
- _"**Using external software, even unintentionally that interacts with the game** may trigger anti-cheat violations."_
- Background tools _"(like macros, **hardware debuggers**, or modified drivers)"_ may trigger bans.

**Implication:** Even a non-cheat companion **interacts with game traffic** and may run alongside EAC. Intent is not a documented safe harbor.

### 4. Embark-wide enforcement policy (Arc Raiders FAQ — Embark publisher voice)

**Source:** [Ban and Enforcement Policy — Arc Raiders FAQ 161](https://id.embark.games/arc-raiders/support/faq/161-ban-and-enforcement-policy) (last updated **2026-02-26**)

Key FAQ answer — **"What third-party applications are safe to use?"**:

- _"Because of the sheer number of third-party applications available, **we're unable to provide a complete list** of what is or isn't permitted."_
- Not acceptable if it _"directly impacts game integrity, provides an unfair advantage, or offers **any unauthorized services**."_
- _"**If you're unsure whether an application falls into this category, we recommend not using it.**"_

Also notes **hardware bans** for severe violations and possible **cross-title** Embark bans.

**Implication:** There is no path to official pre-approval via public docs. A stat companion is likely "unauthorized services" on paper even if fairness impact is nil.

### 5. THE FINALS Season 11 anti-cheat / third-party software posture

**Source:** [Season 11 patch notes — Anti-Cheat](https://www.reachthefinals.com/patchnotes/11-00)

- Embark continues ML-based cheat detection with conservative thresholds.
- **Launch-time blocks** for third-party overlays (e.g. Crosshair X) with error **TFAV8011** — demonstrates active blocking of disallowed third-party software, not merely post-hoc bans.

**Implication:** Embark invests in **preventing** some third-party tools from running with the game. Capture stack is not named, but the trend is toward stricter third-party control, not permissiveness.

### 6. Easy Anti-Cheat (Epic) — Wireshark / packet tools

**Source:** [Epic Developer Community — EAC vs Wireshark](https://eoshelp.epicgames.com/s/question/0D54z0000900ft8CAA/is-there-any-plans-for-easyanti-cheat-to-block-apps-like-wireshark-or-is-that-out-of-scope-of-services)

Official response (paraphrased): **EAC protects game memory and detects some cheating; it won't prevent Wireshark from running on the system.**

**Implication:** **Installation alone** is unlikely to be blocked. Risk is **heuristic** — concurrent capture/decrypt processes, drivers, debug-adjacent tooling, or future detection rules — not documented as safe.

### 7. Community precedent — Swackles/the-finals-tracker-extractor

**Source:** [Swackles/the-finals-tracker-extractor](https://github.com/Swackles/the-finals-tracker-extractor)

- README disclaimer: _"**not affiliated or approved by Embark**. Any use of this software is **at your own risk**."_
- Same core stack: system `SSLKEYLOGFILE`, tshark, capture while game is open, Embark JSON to local file.
- **No primary source** documents Embark enforcement action against this repo or its users.

**Implication:** Precedent supports **tolerated gray-area** usage at small scale, **not** policy permission.

---

## Risk matrix

| Risk                                   | Severity            | Likelihood                     | Notes                                                                             |
| -------------------------------------- | ------------------- | ------------------------------ | --------------------------------------------------------------------------------- |
| **ToS / license breach**               | High                | **Certain** (by plain reading) | Packet sniffing + decrypt + read service data are named prohibitions              |
| **Account suspension (EAC heuristic)** | High if occurs      | **Low–medium** (unquantified)  | No published ban stats for capture-only tools; EAC won't block Wireshark globally |
| **Launch block (TFAV-style)**          | Medium              | **Low–unknown**                | S11 blocks specific overlays at boot; capture stack not listed                    |
| **Hardware / cross-title ban**         | Very high if occurs | **Low**                        | Reserved for severe violations per FAQ 161                                        |
| **Reputational / store rejection**     | Medium              | Medium                         | Marketing as "safe" would be misleading                                           |
| **Patch breakage**                     | Medium              | High (technical)               | Separate from enforcement; tracked in map fog                                     |

---

## Mitigations (if ship-with-disclaimer)

These **reduce practical enforcement friction** but **do not cure ToS breach**:

1. **Never inject into the game process** — separate capture service only (already planned).
2. **Minimize concurrent tooling** — no overlays, macros, debuggers, AHK during play ([FAQ 200](https://id.embark.games/the-finals/support/faq/200-ban-enforcement-policy) names these as ban triggers).
3. **Scope capture to Embark host allowlist** (discovery / shared-profile only) — limits sensitive data exposure; does not change ToS analysis.
4. **Process-scoped `SSLKEYLOGFILE`** via companion-launched game shortcut instead of permanent system env when feasible — reduces global TLS key logging footprint (installer ticket [#77](https://github.com/rtabulov/rank-tracker/issues/77)).
5. **First-run consent + ongoing "use at own risk"** — mirror Swackles disclaimer language.
6. **Always offer non-capture fallback** — [#72](https://github.com/rtabulov/rank-tracker/issues/72) PWA / leaderboard path.
7. **Optional:** Encourage users to ask [Embark Support](https://id.embark.games/the-finals/support) and document response — only path to authoritative allow/deny.

---

## Decision gates for go/no-go ticket [#80](https://github.com/rtabulov/rank-tracker/issues/80)

| Gate                                                           | Status after this research                                                                                                         |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| ToS clearly permits capture                                    | **Fail**                                                                                                                           |
| ToS clearly forbids capture                                    | **Pass** (explicit)                                                                                                                |
| Enforcement risk is negligible                                 | **Fail** (unquantified; policy warns broadly)                                                                                      |
| Mitigations + disclaimer make risk acceptable for opt-in users | **Pass with conditions**                                                                                                           |
| Cleaner alternative exists                                     | **Partial** — leaderboard proxy ([#72](https://github.com/rtabulov/rank-tracker/issues/72)) avoids capture but has coverage limits |

---

## Related repo docs

- [`docs/research/the-finals-rs-auto-fill-alternatives.md`](./the-finals-rs-auto-fill-alternatives.md) — Option K flags ToS risk; cites Swackles extractor.
- Map [#73](https://github.com/rtabulov/rank-tracker/issues/73) — out of scope: memory injection; in scope: self-only capture.
