# SHAPE72 — Gate 3: Metaplex Core Collection

## Verdict

**BLOCKED — MAINNET WRITE AUTHORIZATION REQUIRED**

Final pre-broadcast verification passed. No collection transaction was signed or broadcast. The production SHAPE72 Core Collection does not exist yet.

`SHAPE72_CONFIRM_MAINNET_CREATE` remains unset.

---

## READY FOR MAINNET COLLECTION CREATE — FINAL PREFLIGHT PASS

All read-only checks passed on `2026-09-24T09:23:10Z`.

| # | Check | Result |
| --- | --- | --- |
| 1 | `SHAPE72_COLLECTION_METADATA_URI` matches new CID | **pass** — `ipfs://bafkreih3sn36a6nbqeqqvg6ddqal6gguvrim2bvltgggdvk76533lkrtji` |
| 2 | Hosted JSON resolves | **pass** — Pinata gateway `200` |
| 3 | `name` | **pass** — `SHAPE72` |
| 4 | `symbol` | **pass** — `SHAPE72` |
| 5 | `image` equals collection image URI | **pass** |
| 6 | `properties.files[0].uri` equals image URI | **pass** |
| 7 | `properties.files[0].type` | **pass** — `image/png` |
| 8 | Hosted image content-type | **pass** — `image/png` |
| 9 | Hosted image vs `public/shapes/72pfp.png` | **pass** — SHA-256 `a8788997944275335defd661de357c6617b4e7d83926b9e288bb57ed9b51cf6a` |
| 10 | `shape72meta.jpg` in collection metadata / Gate 3 scripts | **absent** — website OG only (`src/app/layout.tsx`) |
| 11 | Operator keypair loads | **pass** |
| 12 | Operator public key | `G1j79DPv71wGSxunG75aoqwuX3kwCguncU2mHA9GJF2z` |
| 13 | Operator SOL | `0.068382246` (≥ `0.01`) |
| 14 | Mainnet genesis / dedicated RPC health | **pass** — `5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d` |
| 15 | `SHAPE72_COLLECTION_ADDRESS` | **unset** |
| 16 | Duplicate-create guard | **armed** (`SHAPE72_FORCE_NEW_COLLECTION` unset) |
| 17 | Core Assets minted | **0** — no collection; no mint executed |
| 18 | Lint / typecheck / build | **pass** |

`npm run collection:create` printed ready and exited `2` (write guard). No `createCollection` transaction was built or sent.

Stage B is **not** authorized until the operator sets `SHAPE72_CONFIRM_MAINNET_CREATE=YES` and re-runs `npm run collection:create` once.

---

## Repository

| Field | Value |
| --- | --- |
| UTC timestamp | `2026-09-24T09:23:10Z` |
| Branch | `main` |
| HEAD | `b2ccb7c` — `feat: add Reown Solana wallet connection` |
| Working tree | dirty — Gate 3 files uncommitted; **no commit / no push** |

`.env.local` is gitignored. It does not appear in `git status`.

---

## Dependencies

Operator-side only (`devDependencies`). Not imported by `src/`.

| Package | Locked version | Why |
| --- | --- | --- |
| `@metaplex-foundation/mpl-core` | `1.10.0` | Current Core `createCollection` / `fetchCollection` / `mplCore()` |
| `@metaplex-foundation/umi` | `1.6.0` | Signer, `generateSigner`, public-key types |
| `@metaplex-foundation/umi-bundle-defaults` | `1.6.0` | `createUmi(rpc)` |
| `tsx` | `4.23.15` | Run TypeScript operator scripts |

Not used: Token Metadata, Candy Machine, Bubblegum / compressed NFTs.

---

## Network

| Check | Result |
| --- | --- |
| Cluster | Solana Mainnet |
| Genesis | `5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d` |
| RPC configured | **present** (dedicated; public mainnet fallback rejected) |
| RPC health | `getHealth` succeeded |
| URL / credentials printed | no |

---

## Operator

```text
SHAPE72_OPERATOR_KEYPAIR_PATH: present
SHAPE72_COLLECTION_ADDRESS: unset
SHAPE72_COLLECTION_METADATA_URI: present
SHAPE72_COLLECTION_IMAGE_URI: present
SHAPE72_CONFIRM_MAINNET_CREATE: unset
SHAPE72_FORCE_NEW_COLLECTION: unset
```

| Field | Value |
| --- | --- |
| Operator public key | `G1j79DPv71wGSxunG75aoqwuX3kwCguncU2mHA9GJF2z` |
| Operator SOL (preflight) | `0.068382246` |
| Private key | never printed or committed |

---

## Metadata

| Field | Value |
| --- | --- |
| Collection artwork | `public/shapes/72pfp.png` |
| Website / social OG only | `public/shapes/shape72meta.jpg` |
| Image URI | `ipfs://bafkreifipcezpfccouzv336wmhpdk7dgc62opwbze246fcf3k7wzwuopni` |
| Metadata URI | `ipfs://bafkreih3sn36a6nbqeqqvg6ddqal6gguvrim2bvltgggdvk76533lkrtji` |
| Hosting | IPFS; resolved via Pinata gateway |
| Royalties plugin | none planned |
| Empty URI fields | none |

Previous metadata CID `bafkreigzyufgsbbl7qrm25x677ugkn5h53u337pdvownrwhpoact37hpl4` is superseded and must not be used on-chain.

---

## Collection

| Field | Value |
| --- | --- |
| Collection address | not created |
| Transaction signature | none |
| Confirmation | no Mainnet write |
| Plugins | none planned |
| Royalties | **no** |
| Update authority | intended: operator signer; collection left mutable for Gate 4 |

---

## Duplicate prevention

`SHAPE72_COLLECTION_ADDRESS` is unset. Create refuses a second collection if that address is later set, unless `SHAPE72_FORCE_NEW_COLLECTION=YES`. Override unused.

---

## Shape state

```text
Core Assets minted: 0
Shape 01 → UNMINTED
…
Shape 72 → UNMINTED
```

---

## Tooling

| Check | Result |
| --- | --- |
| Lint | **pass** — `npm run lint` |
| Typecheck | **pass** — `npx tsc --noEmit` |
| Build | **pass** — `npm run build` (`/` static) |
| `npm run collection:create` | final preflight ready; exit `2`; **no write** |

---

## Scope confirmations

- no transaction signed
- no broadcast
- no collection created
- no Shape minted
- no deployment
- no commit
- no push
- no operator private key printed
- no RPC URL or Project ID printed
- `.env.local` not auto-written
