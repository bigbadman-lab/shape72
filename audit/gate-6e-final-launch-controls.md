# SHAPE72 — Gate 6E: Final Launch Controls + Go-Live Checklist

## Verdict

**BLOCKED — REOWN LIVE WALLET SESSION / SHAPE 01 YOURS NOT COMPLETED**

Everything else required for launch control is in place. `shape72.fun` is healthy. Public mint is OFF. `$72` is inactive. Production signers reconstruct. Token dry-run passes. Collection is still `numMinted = 1`. No launch action was taken.

CONNECT on the live origin opens Reown AppKit and Escape closes it. A real Solana wallet was not connected in this environment, so disconnect / reconnect / address display / Shape 01 **YOURS** were not finished. Headless Chrome also listed generic/EVM wallets (WalletConnect, MetaMask, Trust, Binance, SafePal) because no Solana extension is injected there. Confirm Phantom/Solflare and YOURS in a real desktop session before launch.

---

## Repository

| Field | Value |
| --- | --- |
| UTC timestamp | `2026-09-24T13:04:30Z` |
| Branch | `main` (tracks `origin/main`) |
| HEAD | `a358554` — `Use Instrument Sans for site typography` |
| Gate 6D | `68561b1` — `feat: add production NFT signer delivery` (ancestor of HEAD) |
| Working tree at start | **clean** |
| Code changes this gate | **none** |

---

## Production

| Field | Value |
| --- | --- |
| Canonical URL | `https://shape72.fun` |
| HTTP | **200** |
| HTTPS / HSTS | **valid** / present |
| Redirect loop | **none** — apex stays on `https://shape72.fun/` |
| `www.shape72.fun` | no public DNS — optional; does not block |
| Project | `shape72` (`prj_3WwunRrISZx3CIL9cQSawcuGz1SW`) |
| Deployment | `dpl_HCbpFQnWtRuD5ewJYnapK8zvnaXP` READY / production |
| Deployed commit | `a358554` |
| Inspect | `https://vercel.com/cope2/shape72/HCbpFQnWtRuD5ewJYnapK8zvnaXP` |
| Homepage | Instrument Sans, `$72 — COMING SOON`, gallery live |

---

## Reown

Exercised on `https://shape72.fun` (headless Chrome, no wallet extension):

| Step | Result |
| --- | --- |
| CONNECT opens AppKit | **yes** — Reown “Connect Wallet” modal |
| Solana wallet options | **not confirmed** — list showed WalletConnect / MetaMask / Trust / Binance / SafePal |
| Real wallet connection | **not completed** |
| Connected address display | **not completed** |
| Disconnect / reconnect | **not completed** |
| Reject / close | Escape **closes** the modal cleanly |
| Unexpected network switch | none observed (no session) |
| Transaction on connect | none — mint remains disabled |

AppKit is initialized Solana-only (`networks: [solana]`, `open({ namespace: "solana" })`). `NEXT_PUBLIC_APP_URL` on production is `https://shape72.fun`. Domain is authorized enough for the modal to open.

**Unblock:** on a real desktop browser, connect a Solana wallet (Phantom/Solflare). Then connect Shape 01 owner `44tkTKCk1wRUZuFkqnS8AE6wAJBAn26f6i6xxLzU3X27` and confirm **YOURS**. If Phantom is missing, allowlist `https://shape72.fun` in the Reown dashboard and restrict the project to Solana.

---

## Shape 01 / inventory (live chain)

| Check | Result |
| --- | --- |
| Shape 01 | `54B31jQ9ESZ9vFm56kKJdWuAaucA5vUjpnEBBPfcevdc` |
| Owner | `44tkTKCk1wRUZuFkqnS8AE6wAJBAn26f6i6xxLzU3X27` |
| Disconnected UI | **OWNED** (live `/api/shapes/status`) |
| Connected owner UI | **YOURS not click-tested** — client compares `ownerFull === connectedAddress` |
| Shapes 02–72 | **AVAILABLE** / unminted — 71 rows, no stray OWNED/YOURS |
| Collection | `4D5Z3iGXSNqamtQ8NzJbkM6WidV5vAvPou5YSfYW5vBk` |
| `numMinted` / `currentSize` | **1** / **1** |

---

## Public mint OFF

| Check | Result |
| --- | --- |
| `SHAPE72_PUBLIC_MINT_ENABLED` | `false` |
| `POST /api/shapes/72/prepare-claim` | **403 `MINT_DISABLED`** — no transaction body |
| `POST /api/shapes/1/prepare-claim` | **409 `SHAPE_ALREADY_CLAIMED`** |
| Shape 02 UI CTA | **MINT NOT LIVE** — Claim Shape not shown |
| `/api/shapes/status` `mintEnabled` | `false` |

---

## Production signer health

Authenticated `POST /api/operator/signer-health`:

```json
{
  "operatorPresent": true,
  "assetSignerCount": 71,
  "allManifestMatches": true,
  "backend": "production-secret",
  "mintEnabled": false
}
```

Unauthenticated: **401 UNAUTHORIZED**. No secrets in the payload.

---

## `$72`

| Check | Result |
| --- | --- |
| `GET /api/token` | `{ "active": false, "symbol": "72" }` |
| `GET /api/token/market` | `prelaunch` — all market fields `null`, no mint |
| Homepage | `$72 — COMING SOON` |
| Fixture on production | impossible (`VERCEL_ENV === production`) |
| `token:verify` (against `https://shape72.fun`) | **PASS** — inactive, official mint none, runtime config PASS, site API prelaunch |
| Dry-run `8Vte25yt28L8BfLXm8DrzjSYEyaKX8yry6hRKRmX7FGd` | address parses, Token-2022, 6 decimals, Pump provenance PASS, runtime inactive, **no Global Config write** |

No `--confirm-production`.

### Activation credentials (presence only)

| Variable | Operator machine |
| --- | --- |
| `VERCEL_TOKEN` | present |
| `VERCEL_GLOBAL_CONFIG_ID` | present = `ecfg_crp2pwhmknn1cjo1ruwnpuzmjzmh` (production `shape72-runtime`) |
| `VERCEL_TEAM_ID` | **unset** — correct. Store is on the personal account; do **not** pass a COPE `teamId` |

---

## Responsive

Headless full-page shots at **1440 / 1024 / 390** on `shape72.fun`:

- wordmark spans the content column
- gallery columns wrap; no horizontal overflow
- artwork renders
- Shape 01 OWNED; 02–72 AVAILABLE
- `$72 — COMING SOON`
- Magic Eden pending / unlinked
- Connect control visible
- no fake price / mcap / volume

Eyeball on a real display is still recommended after the wallet session.

---

## Magic Eden

| Item | Status |
| --- | --- |
| Shape 01 token API | **200** — PNG `ipfs://bafkreia6awdux33m7yjsfaskhtalvkpxv3so24a2zfkfemis5zclcr2h3q` |
| Collection page | **PENDING MARKETPLACE REINDEX** — no verified canonical URL |
| Site CTA | **unlinked** (`MAGIC_EDEN_COLLECTION_URL = null`) |

No slug invented. No Shape 01 write.

---

## CONTROL A — Activate `$72`

No redeploy. Independent of NFT mint.

```bash
# operator machine — VERCEL_TOKEN + VERCEL_GLOBAL_CONFIG_ID=ecfg_crp2pwhmknn1cjo1ruwnpuzmjzmh
# do NOT set VERCEL_TEAM_ID to the COPE team

npm run token:activate -- <OFFICIAL_PUMPFUN_MINT>
# review preview

npm run token:activate -- <OFFICIAL_PUMPFUN_MINT> --confirm-production
npm run token:verify
```

Expected site: `$72 — COMING SOON` → `$72 IS LIVE` → official mint shown → TRADE $72 → INDEXING → LIVE.

Does **not** enable NFT mint. Does **not** change signers.

---

## CONTROL B — Enable public Shape mint

```text
Does enabling public NFT mint require redeploy?
YES
```

`isPublicMintEnabled()` reads `SHAPE72_PUBLIC_MINT_ENABLED` from the serverless env. Vercel applies env changes only to **new** deployments. Existing production keeps `false` until redeploy.

Do **not** treat the env as a live switch. A Global Config `shape72Mint` flag was **not** implemented (redeploy is the accepted current path).

Launch-day steps (do **not** run now):

```text
1. Confirm launch time
2. Set Vercel Production SHAPE72_PUBLIC_MINT_ENABLED=true
3. Redeploy the same commit: npx vercel --prod --yes
   (or Redeploy in the Vercel dashboard)
4. Confirm GET /api/shapes/status mintEnabled=true
5. Confirm POST /api/shapes/2/prepare-claim returns a transaction (not 403)
6. Approve only the intended real claim
7. Confirm collection numMinted increments
```

Does **not** activate `$72`. Does **not** write Global Config `shape72Token`.

---

## Launch controls remain independent

```text
CONTROL A — $72 activation     → Global Config key shape72Token
CONTROL B — NFT public mint    → Vercel env SHAPE72_PUBLIC_MINT_ENABLED + redeploy
```

Verified in code: token runtime never reads the mint env; mint guard never reads `shape72Token`.

### Option A — Token first

```text
1. Launch $72 on Pump.fun
2. Activate runtime token config
3. Verify $72 live
4. Enable Shape mint (env true + redeploy)
```

### Option B — Shape mint first

```text
1. Enable Shape mint (env true + redeploy)
2. Verify public claims
3. Launch $72
4. Activate runtime token config
```

Operator chooses at launch time.

---

## Security

| Surface | Result |
| --- | --- |
| Homepage HTML + 19 JS chunks | no signer env names, no `authority.json`, no Mac paths, no `VERCEL_TOKEN`, no Pinata, no `GLOBAL_CONFIG` / `ecfg_` |
| Secret prefix scan | **0** |
| Public APIs | NFT/token facts only |
| Client secret exposure | **0** |

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
| `token:verify` | **pass** |
| `token:activate --dry-run` | **pass** |

---

## Scope

- no Shape minted
- no transaction broadcast
- no `$72` launch
- no `$72` production activation
- no NFT public mint enable
- no Shape 01 write
- no keypair regeneration
- no Supabase
- no deployment this gate

---

## Final operator launch checklist

```text
PRE-LAUNCH

[x] shape72.fun healthy
[x] HTTPS valid
[ ] Reown works — CONNECT/modal/close only; finish live wallet session
[ ] Shape 01 YOURS with owner wallet
[x] Shape 01 OWNED when disconnected
[x] Shapes 02–72 AVAILABLE
[x] signer health PASS
[x] NFT mint OFF
[x] $72 inactive
[x] token:verify PASS
[x] Magic Eden status checked (pending / unlinked)
[x] responsive 1440 / 1024 / 390 (headless) — no overflow
[x] no secrets exposed

CONTROL A — $72   (do not run in Gate 6E)

[ ] launch manually on Pump.fun
[ ] copy official mint
[ ] token:activate preview
[ ] token:activate --confirm-production
    (VERCEL_GLOBAL_CONFIG_ID=ecfg_crp2pwhmknn1cjo1ruwnpuzmjzmh; no COPE teamId)
[ ] token:verify
[ ] shape72.fun shows exact mint
[ ] market state INDEXING or LIVE

CONTROL B — NFT MINT   (do not run in Gate 6E)

[ ] confirm desired launch time
[ ] set SHAPE72_PUBLIC_MINT_ENABLED=true
[ ] redeploy production
[ ] verify Shape 02 prepare-claim
[ ] approve only intended real canary/user transaction
[ ] confirm collection count increments
```
