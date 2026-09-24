# SHAPE72 — Gate 6C: Production Deployment + Final Launch Rehearsal

## Verdict

**PASS — PRODUCTION SITE / TOKEN ACTIVATION READY**

**BLOCKED — SHAPE72.FUN DNS NOT CONFIGURED**

**BLOCKED — PUBLIC NFT MINT REQUIRES PRODUCTION SIGNER DELIVERY**

The Gate 5–6B stack is live on Vercel with mint OFF and `$72` inactive. Production token APIs return PRELAUNCH. Shape 01 live ownership works. Public claim routes fail closed. `$72` was not launched. No Shape 02–72 mint. No Shape 01 metadata write.

`shape72.fun` is registered (Namecheap, 2026-09-23) and attached to the Vercel project, but public DNS has no A/CNAME records. HTTPS production is `https://shape72.vercel.app` until Namecheap points at Vercel.

Vercel cannot read Mac filesystem keypairs. Public NFT mint must stay off until a server-side signer strategy exists.

---

## Repository

| Field | Value |
| --- | --- |
| UTC timestamp | `2026-09-24T12:16:03Z` |
| Branch | `main` |
| HEAD / deployed commit | `1c9050e` — `feat: add runtime token activation` |
| Working tree | clean (`origin/main`) |

Contains Gate 5 mint system, Gate 6A marketplace metadata/UI, Gate 6B `$72` runtime stack.

---

## Vercel

| Field | Value |
| --- | --- |
| Team | COPE (`cope2`) |
| Project | `shape72` (`prj_3WwunRrISZx3CIL9cQSawcuGz1SW`) |
| Deployment | `dpl_5MyfYHy4YYM8VZSTi3VedeuSKeYc` |
| Status | READY / production |
| Production URL | `https://shape72.vercel.app` |
| Inspect | `https://vercel.com/cope2/shape72/5MyfYHy4YYM8VZSTi3VedeuSKeYc` |
| GitHub auto-deploy | **not connected** — Vercel GitHub App is not installed on `bigbadman-lab/shape72`. This deploy was a CLI production upload. |

### Global Config

| Field | Value |
| --- | --- |
| Store | `shape72-runtime` (`ecfg_crp2pwhmknn1cjo1ruwnpuzmjzmh`) |
| Runtime env | `GLOBAL_CONFIG` present on production/preview/development |
| Official key | `shape72Token` = `{ "active": false, "symbol": "72" }` |
| Future updates | no redeploy — `/api/token` is `force-dynamic` |

Store lives on the personal Vercel account; the app reads it via the connection string. Operator `token:activate --confirm-production` must use `VERCEL_GLOBAL_CONFIG_ID=ecfg_crp2pwhmknn1cjo1ruwnpuzmjzmh` and must **not** send a COPE `teamId` unless the store is moved. No test mint was written to the official key.

---

## Domain

| Host | Status |
| --- | --- |
| `shape72.fun` | registered at Namecheap; added to Vercel; **public DNS empty** (`misconfigured`) |
| `www.shape72.fun` | added on Vercel, 308 → `shape72.fun` (after DNS) |
| `https://shape72.vercel.app` | **200**, HTTPS, HSTS |

Namecheap DNS still required:

```text
A     shape72.fun        216.150.1.1
A     shape72.fun        216.150.16.1
CNAME www.shape72.fun    a92275205e87b5d6.vercel-dns-016.com.
```

Do not guess another host. After DNS propagates, confirm `https://shape72.fun` serves `dpl_5MyfYHy4YYM8VZSTi3VedeuSKeYc` (or a later production alias of this project).

---

## Production env (presence only)

| Variable | Production |
| --- | --- |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | present |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | present (client + server; existing architecture) |
| `NEXT_PUBLIC_APP_URL` | present = `https://shape72.fun` |
| `SHAPE72_COLLECTION_ADDRESS` | present |
| `SHAPE72_SHAPE_01_ASSET_ADDRESS` | present |
| `SHAPE72_PUBLIC_MINT_ENABLED` | `false` |
| `GLOBAL_CONFIG` | present |
| `SHAPE72_OPERATOR_KEYPAIR_PATH` | **not set** (Mac path would fail) |
| `SHAPE72_ASSET_KEYPAIR_DIR` | **not set** |
| `PINATA_JWT` | **not set** (operator-only) |
| `VERCEL_TOKEN` | operator machine only |

---

## NFT signer compatibility

`createOperatorUmi` and `loadPredeterminedAssetSigner` `readFileSync` local JSON keypairs.

Vercel serverless has no `/Users/alexattinger/.config/solana/shape72/…`.

**BLOCKED — PRODUCTION NFT SIGNER DELIVERY REQUIRED**

This does not invalidate the read-only deployment. It blocks `SHAPE72_PUBLIC_MINT_ENABLED=true` until signers are delivered by a Vercel-compatible secret mechanism (not `NEXT_PUBLIC_*`, not git, not the browser bundle).

---

## NFT state

| Check | Result |
| --- | --- |
| Collection | `4D5Z3iGXSNqamtQ8NzJbkM6WidV5vAvPou5YSfYW5vBk` |
| `numMinted` / `currentSize` | **1** / **1** |
| Shape 01 | owned by `44tkTKCk1wRUZuFkqnS8AE6wAJBAn26f6i6xxLzU3X27` |
| Shape 01 metadata | `ipfs://bafkreibiyluoin5hvtoutyle2jjpipvhdc3fun4d3tgbv435ut7x3ksnxi` |
| Shapes 02–72 | AVAILABLE / unminted |
| `GET /api/shapes/status` | 72 rows, `mintEnabled: false` |
| `POST /api/shapes/72/prepare-claim` | **403 `MINT_DISABLED`** — no transaction body |
| `POST /api/shapes/1/prepare-claim` | **409 `SHAPE_ALREADY_CLAIMED`** — no mint write |

---

## Token runtime

| Check | Result |
| --- | --- |
| Production `shape72Token.active` | **false** |
| Official mint | **none** |
| `GET /api/token` | `{ "active": false, "symbol": "72" }` |
| `GET /api/token/market` | `status: prelaunch`, all market fields `null`, no mint |
| Fixture on production | impossible (`VERCEL_ENV === production`) |
| `token:verify` vs production | **PASS** — inactive, official mint none, runtime config PASS, site API prelaunch |
| `token:activate --dry-run` | **PASS** on public Pump Token-2022 fixture; no write |

---

## Reown

AppKit ships on the production homepage (Solana-only). Live connect / disconnect / Shape 01 YOURS was **not click-tested** here (no browser session). After `shape72.fun` DNS is live, add that origin (and `https://shape72.vercel.app` if needed) in the Reown dashboard and confirm:

1. connect a Solana wallet
2. address displays
3. disconnect / reconnect / reject
4. Shape 01 owner `44tk…3X27` → YOURS; other wallet → OWNED
5. no transaction requested

---

## Magic Eden

| Item | Status |
| --- | --- |
| Shape 01 token API | **200** — PNG `ipfs://bafkreia6awdux33m7yjsfaskhtalvkpxv3so24a2zfkfemis5zclcr2h3q` |
| Collection page | **404** — no canonical URL |
| Site CTA | **pending / unlinked** |

`PENDING MARKETPLACE REINDEX` unchanged. No slug invented.

Production homepage includes Magic Eden copy and `pending`.

---

## Production homepage (served at `shape72.vercel.app`)

Verified via HTML + APIs (not a logged-in visual pass at 1440 / 1024 / 390):

- title `Shape72`
- `$72` / `COMING SOON`
- `FREE MINT`
- Magic Eden pending copy
- no `$842K` / `$1.8M` placeholders
- `Mint not live` in client bundle; `/api/shapes/status` keeps the CTA off
- no fake token address

Layout remains the existing stacked terminal system (wraps on small widths). Operator should still eyeball 1440 / 1024 / 390 on the live host after DNS.

---

## Security

| Surface | Result |
| --- | --- |
| Homepage HTML | no `VERCEL_TOKEN`, Pinata JWT, operator path, `GLOBAL_CONFIG`, `ecfg_` |
| First-party JS chunks | same; no `authority.json` |
| `/api/token` / `/api/token/market` / `/api/shapes/status` | public NFT/token facts only |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | present in client by existing Reown custom-RPC design |

---

## Failure modes

| Mode | Behaviour |
| --- | --- |
| Solana RPC | homepage still static-serves; `/api/shapes/status` errors; no fake OWNED/YOURS (status is live-chain only) |
| Global Config down | `get()` catch → inactive PRELAUNCH; no guessed mint |
| DexScreener down | only after activation → `DEGRADED`; mint still shown |
| Magic Eden down | site/APIs independent; CTA already unlinked |

Homepage `/` ~0.7s. `/api/shapes/status` ~live RPC (5s server cache). Token/market APIs ~instant in PRELAUNCH. Client polls token APIs every 10s against SHAPE72 only.

---

## Tooling

| Check | Result |
| --- | --- |
| lint | **pass** |
| `tsc --noEmit` | **pass** |
| `build` | **pass** |
| `collection:verify` | **pass** |
| `shape01:verify` | **pass** |
| `shapes:verify-inventory` | **pass** |
| `shapes:verify-metadata` | **pass** |
| `shapes:verify-marketplace-metadata` | **pass** |
| production `token:verify` | **pass** |

---

## Scope

- `$72` **not** launched
- no production `$72` mint
- no fake mint in `shape72Token`
- no NFT write
- no Shape 02–72 mint
- no Shape 01 metadata update
- no Magic Eden URL invented
- no Supabase
- public mint **false**
- production **deployed** (Vercel)
- no extra git commit/push this gate (HEAD already on origin)

---

## Operator next steps (not executed)

1. At Namecheap, add the A/CNAME records above. Confirm `https://shape72.fun` serves this project.
2. Allow the production origin in Reown. Click-test connect / Shape 01 YOURS.
3. Eyeball 1440 / 1024 / 390.
4. Design Vercel-compatible NFT signer delivery **before** enabling public mint.
5. Optionally `vercel git connect` after installing the Vercel GitHub App.

---

## Final launch sequence (do not run now)

```text
1. Confirm shape72.fun healthy (after DNS)
2. Confirm NFT mint OFF
3. Confirm $72 runtime inactive
4. Confirm Global Config connected (GET /api/token → PRELAUNCH)
5. Launch $72 manually through Pump.fun UI
6. Copy official $72 mint
7. npm run token:activate -- <MINT>
8. Review validation preview
9. npm run token:activate -- <MINT> --confirm-production
   (use VERCEL_GLOBAL_CONFIG_ID for store ecfg_crp2pwhmknn1cjo1ruwnpuzmjzmh; do not pass a COPE teamId)
10. npm run token:verify
11. Verify shape72.fun shows $72 IS LIVE, exact official mint, TRADE $72
12. Verify market INDEXING or LIVE
13. Only then decide when to enable NFT public mint
    — not before production signer delivery is solved
```

Token activation and NFT public mint are separate controls. Do **not** auto-enable mint when `$72` activates.
