# SHAPE72 — Gate 5: Productionize All 72 Shape Mints

## Verdict

**PASS — GATE 5 72-SHAPE PRODUCTION MINT SYSTEM READY**

Shape 01 remains the sole Mainnet Core Asset. Shapes 02–72 have predetermined asset addresses and durable IPFS metadata. Live status reads AVAILABLE / OWNED / YOURS from chain. Public mint stays globally off. No Shape 02–72 mint, no deploy, no commit, no push.

---

## Repository

| Field | Value |
| --- | --- |
| UTC timestamp | `2026-09-24T11:02:48Z` |
| Branch | `main` |
| HEAD | `1e49b85` — `feat: add SHAPE01 mainnet mint canary` |
| Working tree | dirty — Gate 5 implementation uncommitted; **no commit / no push** |

`.env.local` is gitignored. It does not appear in `git status`.

---

## Collection

| Field | Value |
| --- | --- |
| Address | `4D5Z3iGXSNqamtQ8NzJbkM6WidV5vAvPou5YSfYW5vBk` |
| Name | `SHAPE72` |
| Update authority | `G1j79DPv71wGSxunG75aoqwuX3kwCguncU2mHA9GJF2z` |
| Metadata | `ipfs://bafkreih3sn36a6nbqeqqvg6ddqal6gguvrim2bvltgggdvk76533lkrtji` |
| `numMinted` | `1` |
| `currentSize` | `1` |

Closeout `collection:verify` and `shape01:verify` both reconfirm these counts.

---

## Shape inventory

| Check | Result |
| --- | --- |
| Manifest entries | **72 / 72** |
| Unique asset addresses | **72 / 72** |
| Duplicate asset addresses | **0** |
| Minted | **1** (Shape 01) |
| Available | **71** (Shapes 02–72) |

`npm run shapes:verify-inventory`:

```text
collection valid
72 manifest entries
72 asset addresses unique
Shape 01 minted
Shapes 02–72 unminted: yes
minted total = 1
available total = 71
metadata = 72/72 valid
```

Shape 01 production asset is unchanged:

`54B31jQ9ESZ9vFm56kKJdWuAaucA5vUjpnEBBPfcevdc`

Owner (live):

`44tkTKCk1wRUZuFkqnS8AE6wAJBAn26f6i6xxLzU3X27`

---

## Asset keypairs

| Check | Result |
| --- | --- |
| Shapes 02–72 keypair files | **71 / 71** |
| Unique public addresses | **71 / 71** |
| Manifest mismatches | **0** |
| Shape 01 replacement keypair | **absent** (correct) |
| Private keys in repo | **none** |
| Secret bytes printed | **no** |

Keys live outside the repository in the suggested operator assets directory. `shapes:generate-asset-keys` refuses to overwrite existing files and writes mode `600`. `SHAPE72_ASSET_KEYPAIR_DIR` is templated in `.env.example` and is unset locally; scripts fall back to the suggested directory. The server loads a predetermined signer only after the public-mint guard is on.

---

## Metadata

| Check | Result |
| --- | --- |
| Durable image URIs | **72 / 72** |
| Durable metadata URIs | **72 / 72** |
| SVG content-address matches | **72 / 72** |
| Shape 01 URIs altered | **no** |

`npm run shapes:verify-metadata`:

```text
72 / 72 manifest entries
72 / 72 image URIs valid
72 / 72 metadata URIs valid
72 / 72 SVG hashes match
```

Shape 01 (unchanged):

- image `ipfs://bafkreib5cb7ahxxcetdebqyy2mymbnzhovzkmz5umf6cyvohc3pchofv3i`
- metadata `ipfs://bafkreibvqcpfprjt7npdocu6umvul674jmriremac4q55nr56wuc4pwoeq`

Local pretty-printed copies for 02–72 live under `metadata/shapes/`. SVGs were not modified.

---

## Pinata

Operator-only upload uses the current public Pinata Files API:

`POST https://uploads.pinata.cloud/v3/files` with `network=public` and `Authorization: Bearer <PINATA_JWT>`.

`PINATA_JWT` is present in gitignored `.env.local`. It is not `NEXT_PUBLIC_*`. Verification uses content-addressed CIDv1 (raw SHA-256) against local SVG / compact metadata bytes, plus authenticated `GET https://api.pinata.cloud/v3/files/public?cid=…` for existence, `image/svg+xml` MIME, and byte size. Public gateways were Cloudflare 1015 rate-limited after the upload burst; the operator API + CID check is the durable verifier.

JWT was not printed and does not appear in the client bundle.

---

## Exclusivity

Each Shape N maps to one predetermined Core Asset keypair / address. Public claim never calls `generateSigner`. The Solana account-init of that fixed address is the lock.

Race-preparation proof (`npm run shapes:prove-exclusivity`) for still-unminted Shape 72, two independent loads, two different claimant pubkeys, **no broadcast**:

```text
claimant A prepared asset address = ARSejkYmovHTwf5uickyZvKc2J4ypdZiHqSC6NzNPovD
claimant B prepared asset address = ARSejkYmovHTwf5uickyZvKc2J4ypdZiHqSC6NzNPovD
samePredeterminedAddress = true
```

If both were broadcast, only the first successful initialization of that account can succeed. The second create fails because the account already exists. A second Shape 72 at a different address cannot be produced by this path.

---

## API

Generic route: `POST /api/shapes/[id]/prepare-claim` (ids 1–72).

| Request | Result |
| --- | --- |
| `id=99` | `400 INVALID_SHAPE` |
| `id=1` (account exists on Mainnet) | `409 SHAPE_ALREADY_CLAIMED` |
| `id=72` (unminted, guard off) | `403 MINT_DISABLED` — no transaction body |
| Available-shape prepare while guard off | refused; `create()` is never reached |

Mint construction (only if `SHAPE72_PUBLIC_MINT_ENABLED=true`) still:

- claimant = Reown wallet / fee payer / owner
- operator + predetermined asset signer server-side
- derived asset pubkey must equal the manifest address
- application SOL transfer `0`
- program allowlist: System, MPL Core, Compute Budget, SPL Noop

`GET /api/shapes/status` (batched `getMultipleAccountsInfo` + `fetchAllAssets`, 5s cache):

```text
mintEnabled = false
72 rows
Shape 01 → owned, ownerFull 44tkTKCk1wRUZuFkqnS8AE6wAJBAn26f6i6xxLzU3X27
Shapes 02–72 → available
```

---

## Live ownership

Status is decoded from the current Core owner, not the original minter.

- Unrelated wallet → Shape 01 **OWNED**, 02–72 **AVAILABLE**
- Connected wallet `44tkTKCk1wRUZuFkqnS8AE6wAJBAn26f6i6xxLzU3X27` → Shape 01 **YOURS**
- A later transfer updates YOURS/OWNED automatically

Creator-reward SOL amounts remain mocked / zeroed. Token-strip market figures remain placeholder. No reward accounting.

---

## Security

| Secret | Client-exposed |
| --- | --- |
| `SHAPE72_OPERATOR_KEYPAIR_PATH` | no |
| `SHAPE72_ASSET_KEYPAIR_DIR` / asset keypair bytes | no |
| `PINATA_JWT` | no |
| `authority.json` | no |

Production bundle / homepage HTML scan: **no hits**.

`SHAPE72_PUBLIC_MINT_ENABLED` is unset / not `true`. Client `claim()` returns immediately when `mintEnabled` is false. Modal CTA is **Mint not live**.

---

## UI

Browser verification against the live local app (`http://localhost:3000`) at **1440**, **1024**, and **390**.

| Check | 1440 | 1024 | 390 |
| --- | --- | --- | --- |
| Shape 01 from live Solana state | **OWNED** + Rewards live | **OWNED** + Rewards live | **OWNED** + Rewards live |
| Shape 01 with no / other wallet | **OWNED** | **OWNED** | **OWNED** |
| Shape 01 with owner `44tk…3X27` connected | **YOURS** (tile + modal) | same path | same path |
| Shapes 02–72 | **AVAILABLE** only | **AVAILABLE** only | **AVAILABLE** only |
| Historical/mock OWNED or YOURS | none | none | none |
| Available modal | opens Shape 02 | opens Shape 02 | opens Shape 02 |
| Modal copy | Free Mint + Network fees only | Free Mint + Network fees only | Free Mint + Network fees only |
| Claim CTA | Mint not live, disabled | Mint not live, disabled | Mint not live, disabled |
| prepare-claim / sign / broadcast | **0** requests | **0** requests | **0** requests |
| Wordmark span / hero width | 1100 / 1100 | 944 / 944 | 342 / 342 |
| Gallery columns | 4 | 4 | 2 |
| Tile label overflow | none | none | none |

Disconnected Shape 01 modal shows **Owned** and `44tk...3X27` from live owner data. Connecting that owner address through the existing wallet context switches the tile to **YOURS** and the modal to **Yours**; the header shows `44tk...3X27`. Headless Chromium cannot finish the Reown AppKit modal, so that owner was applied to the same `useWallet()` context HomePage already uses. A different or missing wallet keeps Shape 01 **OWNED**.

Available-shape CTA clicks while `SHAPE72_PUBLIC_MINT_ENABLED` is unset produced no `/prepare-claim` request.

Layout matches the approved Lovable treatment: full-bleed SHAPE72 wordmark, orange artwork on near-black tiles, Connect control, 390px two-column gallery remains usable. One copy correction this closeout: the disabled-mint subtitle stays **Network fees only**; **Mint not live** is the CTA only.

---

## Tooling

| Check | Result |
| --- | --- |
| `npm run lint` | **pass** |
| `npx tsc --noEmit` | **pass** |
| `npm run build` | **pass** — `/` static; `/api/shapes/[id]/prepare-claim` and `/api/shapes/status` dynamic |
| `collection:verify` | **pass** — reconfirmed this closeout: `numMinted = 1`, `currentSize = 1` |
| `shape01:verify` | **pass** |
| `shapes:verify-asset-keys` | **pass** |
| `shapes:verify-metadata` | **pass** |
| `shapes:verify-inventory` | **pass** |
| `shapes:prove-exclusivity` | **pass** — same address, no broadcast |

---

## Scope

- no new Shape minted
- no Shape 02–72 minted
- collection remains `numMinted = 1`
- no Supabase
- no custom Solana claim program
- no Pump.fun
- no creator-reward accounting
- no application mint price
- no deployment
- no commit
- no push
- public mint left off (`SHAPE72_PUBLIC_MINT_ENABLED` unset)
- this closeout did not sign or broadcast a claim transaction
