# SHAPE72 — Gate 6F: Runtime NFT Mint Control via Vercel Global Config

## Verdict

**PASS — GATE 6F RUNTIME NFT MINT CONTROL READY**

Public mint is now a Global Config runtime flag (`shape72Mint.enabled`). Production is **false**. Future enable/disable is a confirmed operator write — no Git change and no Vercel redeploy. `$72` stayed inactive. No Shape was minted. Shape 01 was not modified.

---

## Runtime config

| Item | Detail |
| --- | --- |
| Store | `shape72-runtime` (`ecfg_crp2pwhmknn1cjo1ruwnpuzmjzmh`) |
| Key | `shape72Mint` |
| Production value | `{ "enabled": false }` |
| Token key | `shape72Token` — **untouched** |
| Server read | `@vercel/global-config` `get("shape72Mint")` in `src/server/mint-runtime.ts` |
| Enable rule | `enabled === true` only |
| Fail closed | missing / malformed / non-boolean / read error / no connection on production → **false** |
| Redeploy after future toggle | **not required** |

### Precedence

```text
1. Non-production local fixture `.local/mint-fixture.json` (never on VERCEL_ENV=production)
2. Production, or any process with GLOBAL_CONFIG / EDGE_CONFIG
   → shape72Mint.enabled (fail closed)
3. Local only, no Global Config connection
   → SHAPE72_PUBLIC_MINT_ENABLED === "true"
```

Production never uses the env as the canonical switch.

Authorized init write this gate: `npm run mint:disable -- --confirm-production` → `enabled: false`. `mint:enable --confirm-production` exists and was **not** executed.

One deployment (`dpl_2qAhpffhfKG1KLki8Hx9dvBJhUss`) shipped the reader. That is not the launch toggle.

---

## API

| Check | Result |
| --- | --- |
| `GET /api/shapes/status` | `mintEnabled: false`, 72 rows, 1 OWNED, 71 AVAILABLE |
| `POST /api/shapes/72/prepare-claim` | **403 `MINT_DISABLED`** — no transaction |
| `POST /api/shapes/1/prepare-claim` | **409 `SHAPE_ALREADY_CLAIMED`** |
| Signer health `mintEnabled` | `false` (runtime, not env) |

Frontend still reads only `/api/shapes/status`. No client Global Config. `MINT NOT LIVE` while false; `CLAIM SHAPE` only when the API reports true.

---

## Operator commands

| Command | Behaviour |
| --- | --- |
| `mint:verify` | read-only — enabled false, runtime PASS, site false, numMinted 1, available 71 |
| `mint:enable` | preview + signer/collection/inventory checks; no write |
| `mint:enable -- --confirm-production` | implemented, **not run** |
| `mint:disable` | preview only |
| `mint:disable -- --confirm-production` | writes `{ enabled: false }` (used for init) |
| `mint:prove-runtime` | missing/malformed fail closed; fixture true then removed |

Enable preview:

```text
current: false
target: true
collection: PASS
signer health: PASS
available Shapes: 71
PREVIEW ONLY — NO WRITE
```

Enable preconditions: production signer health (`operatorPresent`, 71, all matches, `production-secret`), collection exists and count sane (1–72, `numMinted === currentSize`), Shape 02 in manifest, at least one unminted Shape. `$72` state is reported and **does not block**. After launch, enable does not require `numMinted === 1`.

Disable is an emergency OFF for **new** `prepare-claim` only. Existing NFTs stay. Already-broadcast txs are not cancelled.

---

## Safety

| Rule | Result |
| --- | --- |
| Signer health before enable | **required** — STOP if fail |
| Collection / manifest | checked; unique 72 |
| Token coupling | **none** — mint writes only `shape72Mint` |
| Token activate | writes only `shape72Token` |
| Fail open | **never** |

Token Global Config reader now accepts top-level `{ value }` (the real API shape) as well as `{ item.value }`. That is a parse fix only; keys stay independent.

---

## Production

| Field | Value |
| --- | --- |
| Canonical URL | `https://shape72.fun` |
| Deployment | `dpl_2qAhpffhfKG1KLki8Hx9dvBJhUss` READY |
| Inspect | `https://vercel.com/cope2/shape72/2qAhpffhfKG1KLki8Hx9dvBJhUss` |
| `shape72Mint.enabled` | **false** |
| Collection | `numMinted = 1` / `currentSize = 1` |
| Shapes 02–72 | unminted |
| `$72` | inactive, official mint none |

---

## Security

| Surface | Result |
| --- | --- |
| Homepage + JS | no `VERCEL_TOKEN`, `VERCEL_GLOBAL_CONFIG_ID`, signer envs, health secret, Pinata, Mac paths |
| Public APIs | `mintEnabled` boolean only |
| Client secret exposure | **0** |

Management credentials stay on the operator machine / Vercel server connection string.

---

## Independent launch controls

### CONTROL A — `$72`

```bash
npm run token:activate -- <OFFICIAL_PUMPFUN_MINT>
npm run token:activate -- <OFFICIAL_PUMPFUN_MINT> --confirm-production
npm run token:verify
```

Key: `shape72Token`. No redeploy. Do not pass a COPE `teamId`.

### CONTROL B — NFT mint

```bash
npm run mint:enable
npm run mint:enable -- --confirm-production
npm run mint:verify
```

Key: `shape72Mint`. No redeploy.

Emergency stop:

```bash
npm run mint:disable -- --confirm-production
```

No env edit. No Git. No redeploy.

---

## Tooling

| Check | Result |
| --- | --- |
| lint | **pass** |
| `tsc --noEmit` | **pass** (via `next build`) |
| `build` | **pass** |
| `collection:verify` | **pass** |
| `shape01:verify` | **pass** |
| `shapes:verify-inventory` | **pass** |
| `signers:verify-production` | **pass** |
| `mint:prove-runtime` | **pass** |
| `mint:verify` | **pass** |
| `mint:enable` (preview) | **pass** |
| `mint:disable` (preview) | **pass** |

---

## Scope

- production mint remains **false**
- no Shape 02–72 minted
- no transaction broadcast
- `$72` inactive
- no Shape 01 write
- no signer regeneration
- no Magic Eden mutation
- no Supabase
- no `mint:enable --confirm-production`

---

## Repository

| Field | Value |
| --- | --- |
| UTC timestamp | `2026-09-24T13:13:42Z` |
| Branch | `main` |
| HEAD at start | `a358554` |
| Working tree | dirty — Gate 6F uncommitted; **no commit / no push requested** |

`.local/` remains gitignored.
