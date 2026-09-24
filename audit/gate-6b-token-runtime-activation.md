# SHAPE72 — Gate 6B: `$72` Runtime Token Activation + Live Tracking

## Verdict

**PASS — GATE 6B $72 RUNTIME ACTIVATION READY**

The launch-day path is built: validate a real Pump Token-2022 mint, then write `shape72Token` to Vercel Global Config. The site reads that object at request time. `$72` was not launched. Production config stays inactive. No NFT write. No deploy, commit, or push.

---

## Repository

| Field | Value |
| --- | --- |
| UTC timestamp | `2026-09-24T11:56:54Z` |
| Branch | `main` |
| HEAD | `72a17c0` |
| Working tree | dirty — Gate 6B work uncommitted; **no commit / no push** |

`.env.local` is gitignored. `.local/` is gitignored.

---

## Runtime config

| Item | Detail |
| --- | --- |
| Product | Vercel Global Config (formerly Edge Config) |
| Read SDK | `@vercel/global-config` `1.5.1` — `get("shape72Token")` |
| Read env | `GLOBAL_CONFIG`, fallback `EDGE_CONFIG` |
| Write API | `PATCH https://api.vercel.com/v1/global-config/{id}/items` |
| Write env | `VERCEL_TOKEN`, `VERCEL_GLOBAL_CONFIG_ID`, optional `VERCEL_TEAM_ID` |
| Canonical key | `shape72Token` |
| Production state | **inactive** — no official mint |
| Redeploy required after write | **no** — request-time read (`force-dynamic` `/api/token`) |

Local rehearsal used a non-production fixture file (`.local/token-fixture.json`), not the production key:

```text
inactive config → GET /api/token { active: false, symbol: "72" }
test fixture on → GET /api/token active + mint
GET /api/token/market status: live (DexScreener)
fixture removed → GET /api/token { active: false, symbol: "72" }
production shape72Token remains inactive
```

Vercel management credentials were not present. `--confirm-production` fail-closed with `BLOCKED — VERCEL GLOBAL CONFIG CREDENTIALS MISSING` and wrote nothing. When a store is connected, Vercel injects `GLOBAL_CONFIG` and the same APIs pick it up without a source change.

---

## Activation command

```bash
npm run token:activate -- <MINT_ADDRESS>
npm run token:activate -- <MINT_ADDRESS> --dry-run
npm run token:activate -- <MINT_ADDRESS> --confirm-production
```

Validation sequence before any write:

1. Parse Solana public key
2. Fetch Mainnet account
3. Reject missing / system / Core NFT accounts
4. Require Token-2022 mint, initialized, 6 decimals
5. Derive Pump PDA `["bonding-curve", mint]` on `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`
6. Require Pump program owner + BondingCurve discriminator
7. Refuse if `shape72Token.active` already stores a mint
8. Print public preview
9. Write only with `--confirm-production`

Dry-run against public Pump Token-2022 fixture `8Vte25yt28L8BfLXm8DrzjSYEyaKX8yry6hRKRmX7FGd` (labeled test only; never written to production):

```text
token program: Token-2022
decimals: 6
pump provenance: PASS
runtime config currently active: false
DRY RUN — no Global Config write
```

| Input | Result |
| --- | --- |
| `not-a-mint` | Invalid Solana public key |
| Shape 01 Core asset | Account is a Metaplex Core NFT |
| System account / wallet | Account is not a token mint |
| Official `PUMP` mint | Pump bonding-curve provenance failed |
| Already-active official mint | refused (no `--force` on this command) |

---

## Pump provenance

| Check | Method |
| --- | --- |
| Program | `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P` |
| PDA | `findProgramAddress(["bonding-curve", mint], pump)` |
| Account | owner = Pump program |
| Layout | BondingCurve discriminator `17 b7 f8 37 60 d8 ac 60` from official Pump IDL |
| Token program | mint owner must be Token-2022 (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`) |
| Decimals | 6 (current `create_v2`) |
| Symbol | reported `pending` if Token-2022 metadata is not yet readable; not used as proof |

Name/symbol indexers are not treated as provenance.

---

## Site API

`GET /api/token` — server-only Global Config / fixture read.

Prelaunch:

```json
{ "active": false, "symbol": "72" }
```

Active fixture:

```json
{
  "active": true,
  "symbol": "72",
  "mint": "8Vte25yt28L8BfLXm8DrzjSYEyaKX8yry6hRKRmX7FGd",
  "network": "solana-mainnet",
  "launchPlatform": "pump.fun",
  "activatedAt": "2026-09-24T11:55:36.232Z"
}
```

No Global Config credentials in the payload.

`GET /api/token/market` — DexScreener enrichment keyed only from `shape72Token.mint`. Cache **10s**.

---

## Market tracking

| Item | Detail |
| --- | --- |
| Provider | DexScreener `GET /latest/dex/tokens/{mint}` (public, documented) |
| On-chain | mint + Pump bonding curve via activation/verify |
| Cache | 10 seconds, server-side |
| PRELAUNCH | no official mint |
| INDEXING | mint active, no usable DexScreener pairs yet |
| LIVE | usable price / cap / volume / liquidity |
| DEGRADED | provider error; official mint still shown |

Placeholder `$842K` / `$1.8M` token-strip numbers were removed. Unknown values render `—` or `MARKET DATA INDEXING`.

---

## UI

| Surface | Prelaunch | Active |
| --- | --- | --- |
| Announcement bar | `$72 — COMING SOON` | `$72 IS LIVE · OFFICIAL MINT <short>` |
| Token strip | `$72` + Coming soon | official mint + Copy mint + Trade $72 |
| Market stats | hidden | live numbers or INDEXING / DEGRADED |
| Pump.fun | no link | `https://pump.fun/coin/<mint>` |
| Copied value | n/a | full runtime mint |

No mint is hard-coded in frontend source. Layout stays compact / terminal, 1440 / 1024 / 390 via existing stacked type and wrap. Homepage HTML is client-fetched; states were proven through `/api/token` and `/api/token/market`.

Magic Eden CTA remains pending. `PENDING MARKETPLACE REINDEX` unchanged.

---

## Security

| Secret | Client bundle (`.next/static`) |
| --- | --- |
| `VERCEL_TOKEN` | absent |
| Global Config management / `GLOBAL_CONFIG` | absent |
| `PINATA_JWT` | absent |
| `SHAPE72_OPERATOR_KEYPAIR_PATH` | absent |
| Asset keypairs | absent |

Only the official mint is public after a future real activation.

---

## NFT state

| Check | Result |
| --- | --- |
| Collection | `4D5Z3iGXSNqamtQ8NzJbkM6WidV5vAvPou5YSfYW5vBk` |
| `numMinted` | **1** |
| `currentSize` | **1** |
| Shape 01 | unchanged (`ipfs://bafkreibiyluoin5hvtoutyle2jjpipvhdc3fun4d3tgbv435ut7x3ksnxi`) |
| Shapes 02–72 | unminted |
| `SHAPE72_PUBLIC_MINT_ENABLED` | unset |
| Core transactions this gate | **none** |

---

## Tooling

| Check | Result |
| --- | --- |
| lint | **pass** |
| `tsc --noEmit` | **pass** |
| `build` | **pass** — `/api/token`, `/api/token/market` dynamic |
| `collection:verify` | **pass** |
| `shape01:verify` | **pass** |
| `shapes:verify-inventory` | **pass** |
| `token:verify` | **pass** — inactive / official mint none |
| `token:activate -- --dry-run` | **pass** on Pump Token-2022 fixture |
| `token:rehearse` | **pass** |

---

## Scope

- `$72` **not** launched
- no production `$72` mint configured
- no fake mint left in production config
- no NFT write
- no Shape mint
- no Shape 01 metadata update
- no Magic Eden URL invented
- no Supabase
- no deployment
- no commit
- no push

---

## Launch-day operator flow (not this gate)

```text
1. Launch $72 on Pump.fun
2. npm run token:activate -- <OFFICIAL_MINT>
3. Confirm preview
4. npm run token:activate -- <OFFICIAL_MINT> --confirm-production
```

Requires `VERCEL_TOKEN` + `VERCEL_GLOBAL_CONFIG_ID` (and a store connected so `GLOBAL_CONFIG` exists on Vercel). No git commit, push, or Vercel redeploy after that write.
