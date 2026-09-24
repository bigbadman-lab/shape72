# SHAPE72 — Gate 4: Shape 01 End-to-End Free Mint Canary

## Verdict

**PASS — GATE 4 SHAPE 01 MAINNET MINT VERIFIED**

Shape 01 exists on Solana Mainnet as a Metaplex Core Asset, owned by the intended claimant, linked to the production SHAPE72 collection. Exactly one collection asset is minted. Canary is disabled. No second mint was performed this closeout.

---

## Repository

| Field | Value |
| --- | --- |
| UTC timestamp | `2026-09-24T10:00:55Z` |
| Branch | `main` |
| HEAD | `43fa1c7` — `feat: create SHAPE72 Metaplex Core collection` |
| Working tree | dirty — Gate 4 implementation uncommitted; **no commit / no push** |

`.env.local` is gitignored. It does not appear in `git status`.

---

## Environment (presence / public values only)

```text
SHAPE72_CANARY_SHAPE01_ENABLED: false
SHAPE72_SHAPE_01_ASSET_ADDRESS: 54B31jQ9ESZ9vFm56kKJdWuAaucA5vUjpnEBBPfcevdc
```

Canary is **not** `true`. Duplicate Shape 01 prepare is refused because the asset address is recorded and `numMinted = 1`.

---

## Canary asset

| Field | Value |
| --- | --- |
| Core Asset address | `54B31jQ9ESZ9vFm56kKJdWuAaucA5vUjpnEBBPfcevdc` |
| Name | `SHAPE 01` |
| Owner | `44tkTKCk1wRUZuFkqnS8AE6wAJBAn26f6i6xxLzU3X27` |
| Metadata URI | `ipfs://bafkreibvqcpfprjt7npdocu6umvul674jmriremac4q55nr56wuc4pwoeq` |
| Image URI | `ipfs://bafkreib5cb7ahxxcetdebqyy2mymbnzhovzkmz5umf6cyvohc3pchofv3i` |
| Update authority | Collection `4D5Z3iGXSNqamtQ8NzJbkM6WidV5vAvPou5YSfYW5vBk` |
| Program | `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` |
| Application mint price | **0 SOL** — no treasury/operator transfer in the mint path |
| Shape 01 minted | **exactly once** |

---

## Collection

| Field | Value |
| --- | --- |
| Address | `4D5Z3iGXSNqamtQ8NzJbkM6WidV5vAvPou5YSfYW5vBk` |
| Name | `SHAPE72` |
| Update authority | `G1j79DPv71wGSxunG75aoqwuX3kwCguncU2mHA9GJF2z` |
| `numMinted` | `1` |
| `currentSize` | `1` |

```text
Shape 01 → MINTED (exactly once)
Shape 02 → UNMINTED
…
Shape 72 → UNMINTED
```

Shapes 02–72 have no real mint route. Only `POST /api/shapes/1/prepare-claim` exists.

---

## Architecture (as executed)

- Operator co-sign stays server-side (`SHAPE72_OPERATOR_KEYPAIR_PATH`).
- Claimant / fee payer is the connected Reown wallet.
- Free mint: no application SOL price.
- No royalty plugin.

---

## Tooling (re-run this closeout)

| Check | Result |
| --- | --- |
| Lint | **pass** |
| Typecheck | **pass** |
| Build | **pass** |
| `shape01:verify` | **pass** |
| `collection:verify` | **pass** — `numMinted = 1`, `currentSize = 1` |

---

## Scope confirmations

- exactly one Shape Core Asset created (Shape 01)
- Shape 02–72 remain unminted and have no live mint path
- no second collection created
- no application SOL mint price charged
- no creator-reward logic added (UI copy remains mocked)
- no Pump.fun integration
- no native-token logic
- no Supabase
- no website deployment
- no commit
- no push
- canary left `false`
- this closeout did not mint again
