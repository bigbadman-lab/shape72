# SHAPE72 — Final Launch Command Verification

## Verdict

**PASS — FINAL LAUNCH COMMANDS VERIFIED**

The eight-step launch sequence below is valid against the current repository, `package.json` scripts, argument parsers, and production Global Config. No production write ran in this verification. `$72` was not launched. `shape72Token` was not written. `shape72Mint.enabled` stayed `false`. No Shape was minted. No Solana transaction was broadcast. No deploy, commit, or push.

---

## Approved launch sequence

```text
1. Launch $72 manually on Pump.fun
2. Copy mint address
3. npm run token:activate -- <MINT>
4. npm run token:activate -- <MINT> --confirm-production
5. npm run token:verify
6. npm run mint:enable
7. npm run mint:enable -- --confirm-production
8. npm run mint:verify
```

Emergency OFF (new claims only):

```text
npm run mint:disable -- --confirm-production
```

Do not omit the `npm --` separator. That is how npm forwards `<MINT>` and `--confirm-production` to `tsx`.

---

## Part A — package.json command audit

All four launch scripts exist exactly as named. Emergency OFF also exists.

| Command | Invokes |
| --- | --- |
| `npm run token:activate` | `tsx scripts/token/activate.ts` |
| `npm run token:verify` | `tsx scripts/token/verify.ts` |
| `npm run mint:enable` | `tsx scripts/mint/enable.ts` |
| `npm run mint:verify` | `tsx scripts/mint/verify.ts` |
| `npm run mint:disable` | `tsx scripts/mint/disable.ts` |

No script rewrite was required.

---

## Part B — argument parsing

`npm run <script> -- <args>` is the correct form. npm strips the `--` and appends the rest to the `tsx` command.

### `token:activate`

`scripts/token/activate.ts` `parseArgs` filters leftover `"--"`, takes the first positional as `<MINT>`, and treats `--confirm-production` / `--dry-run` as flags.

| Form | Result |
| --- | --- |
| `npm run token:activate -- <MINT>` | mint received; preview only (no write) |
| `npm run token:activate -- <MINT> --confirm-production` | mint + confirm; authorized `shape72Token` write |

Usage if mint is missing: `npm run token:activate -- <MINT_ADDRESS> [--dry-run|--confirm-production]`.

### `mint:enable`

`wantsConfirm` is `process.argv.includes("--confirm-production")`.

| Form | Result |
| --- | --- |
| `npm run mint:enable` | preview; no extra arg required |
| `npm run mint:enable -- --confirm-production` | authorized `shape72Mint.enabled = true` write |

No syntax difference from the intended launch procedure.

---

## Part C — `token:activate` preview

Command run (approved Pump Token-2022 fixture only):

```text
npm run token:activate -- 8Vte25yt28L8BfLXm8DrzjSYEyaKX8yry6hRKRmX7FGd
```

Exact output:

```text
SHAPE72 TOKEN ACTIVATION

network: solana-mainnet
symbol: $72
mint: 8Vte25yt28L8BfLXm8DrzjSYEyaKX8yry6hRKRmX7FGd
token program: Token-2022
decimals: 6
symbol metadata: pending
pump provenance: PASS
runtime config currently active: false

WRITE TARGET:
Vercel Global Config → shape72Token

Ready. Re-run with --confirm-production to write the official mint.
```

Semantics:

| Check | Result |
| --- | --- |
| Solana address parses | yes |
| Account exists | yes |
| Token-2022 | yes |
| 6 decimals | yes |
| Pump provenance | PASS (bonding-curve PDA + Pump program + discriminator) |
| Production runtime | inactive (`false`) |
| Preview only | yes — no `--confirm-production`, so the write path is skipped |
| Global Config write | **none** |

`--dry-run` is an optional extra form that prints `DRY RUN — no Global Config write…`. The approved launch preview is the no-flag form above (`Ready. Re-run with --confirm-production…`). Do not treat `--dry-run` as required.

Validation (`scripts/token/validate.ts`) refuses a non-key, a missing account, Metaplex Core, classic SPL Token, wrong decimals, or a mint without a Pump bonding curve.

---

## Part D — `token:activate --confirm-production` path (not executed)

Statically verified. This command was **not** run.

On `--confirm-production` the script:

1. Re-runs `validatePumpMint` (same refusals as preview).
2. Refuses overwrite if `shape72Token` is already `{ active: true, mint }`.
3. Requires `VERCEL_TOKEN` + `VERCEL_GLOBAL_CONFIG_ID`.
4. Writes **only** key `shape72Token` via `writeProductionToken` → PATCH `/v1/env/global-configs/{id}/items` upsert of that key.
5. Uses store `ecfg_crp2pwhmknn1cjo1ruwnpuzmjzmh` (`shape72-runtime`). `VERCEL_TEAM_ID` is **not** sent (store is on the personal Vercel account; COPE `teamId` would 404).
6. Does not write `shape72Mint`.
7. Does not deploy.
8. Does not mutate Git.
9. Does not touch NFT signer secrets or enable NFT mint.

Operator env presence (values not printed):

| Variable | Presence |
| --- | --- |
| `VERCEL_TOKEN` | present |
| `VERCEL_GLOBAL_CONFIG_ID` | present |
| `VERCEL_TEAM_ID` | **absent** (correct for this store) |

---

## Part E — `token:verify`

Command run:

```text
npm run token:verify
```

Production Global Config read:

```text
active: false
official mint: none
runtime config: PASS
```

Exact local site line on this machine was `site token API: unreachable` because `.env.local` sets `NEXT_PUBLIC_APP_URL=http://localhost:3000`. That is the verify script’s site probe, not the runtime source of truth.

Live production:

```text
GET https://shape72.fun/api/token → {"active":false,"symbol":"72"}
```

With `NEXT_PUBLIC_APP_URL=https://shape72.fun` the same command prints `site token API: prelaunch`.

Launch-day note: if the operator wants the site line to say `prelaunch` instead of `unreachable`, point `NEXT_PUBLIC_APP_URL` at `https://shape72.fun`. Runtime `PASS` / `active: false` does not depend on that.

---

## Part F — `mint:enable` preview

Command run:

```text
npm run mint:enable
```

Exact output (material lines):

```text
SHAPE72 NFT MINT ENABLE

current: false
target: true
collection: PASS
signer health: PASS
available Shapes: 71
$72 active: false (not a mint precondition)

WRITE TARGET:
Vercel Global Config → shape72Mint.enabled = true

PREVIEW ONLY — NO WRITE
```

No write. No deployment. No transaction. No Shape minted. Production `mintEnabled` remained `false`.

---

## Part G — `mint:enable --confirm-production` path (not executed)

Statically verified. This command was **not** run.

On `--confirm-production` the script:

1. Requires the same Vercel credentials as token writes (`hasMintConfigCredentials`).
2. Reads production `shape72Mint` and prints `current`.
3. Verifies signer health (operator present, 71/71, `production-secret`).
4. Verifies the production collection exists and count is sane (`1–72`, `numMinted === currentSize`).
5. Verifies manifest/inventory (72 unique addresses, Shape 02 present, `available ≥ 1`).
6. Writes **only** `shape72Mint` as `{ enabled: true, enabledAt }` via `writeProductionMint`.
7. Leaves `shape72Token` unread for write (token is reported only; `$72` is not a mint precondition).
8. Requires no redeploy and no Git action.
9. `/api/shapes/status` reads `await isPublicMintEnabled()` from Global Config on each request (`force-dynamic`). AVAILABLE rows then expose **CLAIM SHAPE**.

No hidden env mint switch is required on production. `VERCEL_ENV === production` uses `shape72Mint.enabled` only (fail closed). `SHAPE72_PUBLIC_MINT_ENABLED` is a local-only fallback when Global Config is not connected.

Observation (non-blocking): enable prints `current` but does not exit if already `true`. First launch is `false`. A second confirm would rewrite `enabled: true`.

---

## Part H — `mint:verify`

Command run:

```text
npm run mint:verify
```

Exact output:

```text
SHAPE72 NFT MINT

enabled: false
runtime config: PASS
site status API: false
collection numMinted: 1
available: 71
```

Matches current production (`GET /api/shapes/status` → `mintEnabled: false`).

---

## Part I — emergency OFF

`npm run mint:disable` exists. Preview (run this verification):

```text
current: false
target: false
WRITE TARGET: Vercel Global Config → shape72Mint.enabled = false
PREVIEW ONLY — NO WRITE
```

`npm run mint:disable -- --confirm-production` writes `{ enabled: false, enabledAt: null }` to **only** `shape72Mint`. No redeploy.

It does not alter `shape72Token`, already-minted NFTs, or signer material. It only fail-closes new `prepare-claim` (`403 MINT_DISABLED`). Already-broadcast transactions are not cancelled.

---

## Part J — production isolation

| Control | Key | Writer |
| --- | --- | --- |
| A — `$72` | `shape72Token` | `token:activate` → `writeProductionToken` |
| B — NFT mint | `shape72Mint` | `mint:enable` / `mint:disable` → `writeProductionMint` |

`token:activate` never references `shape72Mint`. `mint:enable` / `mint:disable` never write `shape72Token` (`readTokenIsolation` is display-only). Server readers are separate: `src/server/token-runtime.ts` vs `src/server/mint-runtime.ts`.

---

## Part K — no-deploy proof

After Gate 6F is committed and deployed (current production includes the runtime readers), none of the launch commands require:

- `git add` / `git commit` / `git push`
- `vercel deploy` / `npx vercel --prod`

They only PATCH one Global Config item. The live site observes the new value on the next `/api/token` or `/api/shapes/status` request.

This verification HEAD: `de1c67f` (`Add a load scramble to the SHAPE72 wordmark`), `main` tracking `origin/main`.

---

## Current production snapshot (read-only)

| Item | Value |
| --- | --- |
| `shape72Token` | inactive — no official mint |
| `GET /api/token` | `{ "active": false, "symbol": "72" }` |
| `shape72Mint.enabled` | `false` |
| `GET /api/shapes/status` `mintEnabled` | `false` |
| Collection `numMinted` | `1` |
| Available Shapes | `71` |
| Store | `shape72-runtime` / `ecfg_crp2pwhmknn1cjo1ruwnpuzmjzmh` |

---

## What this verification did not do

- Launch `$72` on Pump.fun
- `token:activate -- --confirm-production`
- `mint:enable -- --confirm-production`
- Write `shape72Token` or `shape72Mint.enabled=true`
- Mint a Shape or broadcast a transaction
- Deploy, commit, or push
