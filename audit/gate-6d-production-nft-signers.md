# SHAPE72 — Gate 6D: Production NFT Signer Delivery + Final Mint Readiness

## Verdict

**PASS — GATE 6D PRODUCTION NFT SIGNER DELIVERY READY**

Existing collection authority and the 71 predetermined Shape 02–72 asset signers are on Vercel production as encrypted server-only env vars. The production server reconstructs them, matches the public manifest, and can assemble a partially signed Core create transaction. Public mint stays OFF. `$72` stays inactive. Shape 01 is unchanged. No transaction was broadcast. No keypair was regenerated. No commit or push.

---

## Production signer strategy

| Item | Detail |
| --- | --- |
| Storage | Vercel encrypted environment variables (production target) |
| Why Vercel-compatible | Serverless has no Mac filesystem; env values are available to Node server functions at request time |
| Operator var | `SHAPE72_OPERATOR_SECRET_KEY_B64` (64-byte secret, base64) |
| Asset blob | `SHAPE72_ASSET_SIGNERS_B64` — JSON map `{ "2": "<b64>", …, "72": "<b64>" }` then base64-encoded |
| Operator secret bytes | `88` |
| Asset blob bytes | `9080` |
| Safe size cap used | `60_000` — no split required |
| Filesystem in production | **absent** — `SHAPE72_OPERATOR_KEYPAIR_PATH` / `SHAPE72_ASSET_KEYPAIR_DIR` not set |
| Local artifact | `.local/production-signers.env` (gitignored, mode `0600`) |
| `NEXT_PUBLIC_*` | not used for signer material |
| Global Config | not used for private keys |

Backend selection in `src/server/signers.ts`:

```text
production-secret   if both B64 envs are present
local-filesystem    else if both path envs are present
fail closed         otherwise
```

Backends are not mixed. Production-secret wins when both are present so rehearsal can load the export artifact on the operator machine.

Shape 01 has no replacement signer on this path.

---

## Operator signer

| Check | Result |
| --- | --- |
| Derived public key | `G1j79DPv71wGSxunG75aoqwuX3kwCguncU2mHA9GJF2z` |
| Expected match | **MATCH** |
| Secret in production | **present** (encrypted) |
| Secret printed | **no** |

---

## Asset signers

| Check | Result |
| --- | --- |
| Total | **71** |
| Reconstructed | **71 / 71** |
| Manifest matches | **71 / 71** |
| Duplicate addresses | **0** |
| Missing signers | **0** |
| Unexpected Shape 01 signer | **0** |
| Shape 02 | `GEmbdkKPXWjuy5Fxs59KwtReCSwQuPS6JfZszXRhgyDJ` |
| Shape 72 | `ARSejkYmovHTwf5uickyZvKc2J4ypdZiHqSC6NzNPovD` |

Source JSON keypairs under `~/.config/solana/shape72/` were read, not rewritten.

---

## Vercel production

| Field | Value |
| --- | --- |
| Team | COPE (`cope2`) |
| Project | `shape72` (`prj_3WwunRrISZx3CIL9cQSawcuGz1SW`) |
| Deployment | `dpl_bqLSDToxZWDu1tqTByhwjXjFJhKp` |
| Status | READY / production |
| Inspect | `https://vercel.com/cope2/shape72/bqLSDToxZWDu1tqTByhwjXjFJhKp` |
| Canonical host | `https://shape72.fun` |
| Alias also | `https://shape72.vercel.app` |

### Production secret presence

```text
SHAPE72_OPERATOR_SECRET_KEY_B64: present
SHAPE72_ASSET_SIGNERS_B64: present
SHAPE72_OPERATOR_HEALTH_SECRET: present
SHAPE72_PUBLIC_MINT_ENABLED: false
filesystem signer paths: absent
```

### Production reconstruction proof

Authenticated `POST /api/operator/signer-health` (Bearer operator secret, not public):

```json
{
  "operatorPresent": true,
  "assetSignerCount": 71,
  "allManifestMatches": true,
  "backend": "production-secret",
  "mintEnabled": false
}
```

Unauthenticated request returns `401 UNAUTHORIZED`. Response contains no secret bytes, base64, paths, or key lengths.

This is the retained operator health check. No public diagnostic was left behind.

```text
Vercel production:
operator signer reconstructs: PASS
71 asset signers available: PASS
manifest public-key match: PASS
mint guard: OFF
no transaction broadcast
```

---

## Rehearsal

`npm run mint:rehearse-production -- 72 44tkTKCk1wRUZuFkqnS8AE6wAJBAn26f6i6xxLzU3X27`

| Field | Value |
| --- | --- |
| Shape | `72` |
| Asset address | `ARSejkYmovHTwf5uickyZvKc2J4ypdZiHqSC6NzNPovD` |
| Claimant / fee payer | `44tkTKCk1wRUZuFkqnS8AE6wAJBAn26f6i6xxLzU3X27` |
| Operator signer | **MATCH** |
| Asset signer | **MATCH** |
| Signer backend | `production-secret` |
| Application mint price | `0 SOL` |
| Programs | `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` |
| Transaction constructed | **yes** |
| Partial server signatures | **applied** (operator + Shape 72) |
| Broadcast | **NO** |

Public `POST /api/shapes/72/prepare-claim` still returns **403 `MINT_DISABLED`** and no transaction body. `POST /api/shapes/1/prepare-claim` returns **409 `SHAPE_ALREADY_CLAIMED`**.

---

## Security

| Surface | Result |
| --- | --- |
| Homepage HTML | no signer env names, no `authority.json`, no Mac key path |
| First-party JS chunks (19) | same |
| Secret prefix scan | **0** |
| `/api/token` `/api/token/market` `/api/shapes/status` | public facts only |
| Client secret exposure | **0** |

`.local/` and `.env*` remain gitignored. Export/upload scripts never print secret material.

---

## NFT state

| Check | Result |
| --- | --- |
| Collection | `4D5Z3iGXSNqamtQ8NzJbkM6WidV5vAvPou5YSfYW5vBk` |
| `numMinted` / `currentSize` | **1** / **1** |
| Shape 01 | `54B31jQ9ESZ9vFm56kKJdWuAaucA5vUjpnEBBPfcevdc` owned by `44tkTKCk1wRUZuFkqnS8AE6wAJBAn26f6i6xxLzU3X27` |
| Shape 01 metadata | `ipfs://bafkreibiyluoin5hvtoutyle2jjpipvhdc3fun4d3tgbv435ut7x3ksnxi` — unchanged |
| Shapes 02–72 | unminted / AVAILABLE |
| Public asset addresses | 72 unique; none changed |

---

## Domain / Reown

| Host | Status |
| --- | --- |
| `shape72.fun` | **200**, HTTPS, HSTS; DNS `216.150.1.1`, `216.150.16.1` |
| `www.shape72.fun` | no public DNS — canonical host is `shape72.fun` |
| `https://shape72.vercel.app` | **200**, same production project |

`GET /api/token` → `{ "active": false, "symbol": "72" }`
`GET /api/token/market` → `prelaunch`
`GET /api/shapes/status` → 72 rows, `mintEnabled: false`, Shape 01 OWNED, 71 AVAILABLE

Reown AppKit is on the production homepage (Solana-only). `NEXT_PUBLIC_APP_URL` is `https://shape72.fun`, which is the AppKit metadata origin. Live wallet connect / disconnect / reject was **not click-tested** in this operator environment (no browser wallet session). YOURS/OWNED remains `ownerFull === connectedAddress`:

- Shape 01 owner `44tkTKCk1wRUZuFkqnS8AE6wAJBAn26f6i6xxLzU3X27` → **YOURS** when that wallet is connected
- any other connected wallet → **OWNED**
- mint OFF, so connect does not request a claim transaction

---

## Magic Eden

| Item | Status |
| --- | --- |
| Shape 01 token API | **200** — PNG `ipfs://bafkreia6awdux33m7yjsfaskhtalvkpxv3so24a2zfkfemis5zclcr2h3q` |
| Collection page | no canonical URL (unchanged pending) |
| Site CTA | **pending / unlinked** (`MAGIC_EDEN_COLLECTION_URL = null`) |

No Shape 01 write. No slug invented.

---

## Token runtime

| Check | Result |
| --- | --- |
| `shape72Token.active` | **false** |
| Official mint | **none** |
| Global Config write | **none** |

---

## Tooling

| Check | Result |
| --- | --- |
| lint | **pass** |
| `tsc --noEmit` | **pass** |
| `build` | **pass** |
| `collection:verify` | **pass** (`numMinted` 1 / `currentSize` 1) |
| `shape01:verify` | **pass** |
| `shapes:verify-asset-keys` | **71 / 71** |
| `shapes:verify-inventory` | **pass** |
| `signers:export-production` | **71 / 71 MATCH** |
| `signers:verify-production` | **pass** |
| `mint:rehearse-production -- 72` | **pass**, broadcast NO |
| production signer-health | **pass** |

---

## Scope

- no keypair regenerated
- no public asset address changed
- no Shape minted
- no transaction broadcast
- public mint remains `false`
- `$72` inactive
- no Shape 01 update
- no Supabase
- production deploy was required to prove reconstruction (`dpl_bqLSDToxZWDu1tqTByhwjXjFJhKp`)
- no commit / no push

---

## Repository

| Field | Value |
| --- | --- |
| UTC timestamp | `2026-09-24T12:37:25Z` |
| Branch | `main` |
| HEAD | `4ee57c5` — `Use Courier Prime for a typewriter site face` |
| Working tree | dirty — Gate 6D signer delivery uncommitted; **no commit / no push** |

`.env.local` and `.local/` are gitignored.

---

## Operator next steps (not executed)

1. Click-test Reown on `https://shape72.fun` (connect / disconnect / Shape 01 YOURS). Add the origin in the Reown dashboard if the modal is blocked.
2. Eyeball 1440 / 1024 / 390 on the live host.
3. Commit Gate 6D when ready. Do **not** enable `SHAPE72_PUBLIC_MINT_ENABLED` in the same step as the commit unless mint day has started.
4. `$72` launch remains the separate Gate 6C sequence.

Public mint and token activation are still independent controls.
