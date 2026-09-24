# SHAPE72 — Gate 6A / 6A.1: Magic Eden Compatibility + Shape 01 Marketplace Metadata Migration

## Verdict

**PASS — GATE 6A MAGIC EDEN / SECONDARY MARKET READY**

Shape 01 on-chain metadata is now PNG-primary. Magic Eden’s token API already serves the new PNG `image`. The only remaining marketplace gap is a documented collection-page listing delay. Public mint stays off. No Shape 02–72 mint. No deploy, commit, or push.

`PENDING MARKETPLACE REINDEX` — Magic Eden collection API is still 404. Site CTA stays unlinked until a canonical collection URL is verified. Do not write Shape 01 metadata again to force refresh.

---

## Repository

| Field | Value |
| --- | --- |
| UTC timestamp | `2026-09-24T11:44:30Z` |
| Branch | `main` |
| HEAD | `fc8fc28` — `feat: productionize SHAPE72 mint system` |
| Working tree | dirty — Gate 6A / 6A.1 work uncommitted; **no commit / no push** |

`.env.local` is gitignored.

---

## Authorized write (exactly one)

| Field | Value |
| --- | --- |
| Instruction | Metaplex Core `UpdateV2` |
| Transaction | `NSG6KgDGRL6zgMeJhPLhEnyPAwr8YRVFmFikWidcqquM8eQmVvBUrTnGgS4Z36THXQsZSDKSD7nwidYQJ63MWkM` |
| Slot | `450016468` |
| Result | success (`err: null`) |
| Programs | MPL Core `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` only |
| Application SOL transfer | **0** (fee `5000` lamports only) |
| Signer | `G1j79DPv71wGSxunG75aoqwuX3kwCguncU2mHA9GJF2z` |

Immediate `fetchAsset` after `sendAndConfirm` still returned the old URI (RPC read lag). A later confirmed read and `getTransaction` both show the new URI. No second broadcast. No retry with altered parameters.

---

## Shape 01 after migration

| Field | Before | After |
| --- | --- | --- |
| Core Asset | `54B31jQ9ESZ9vFm56kKJdWuAaucA5vUjpnEBBPfcevdc` | unchanged |
| Owner | `44tkTKCk1wRUZuFkqnS8AE6wAJBAn26f6i6xxLzU3X27` | unchanged |
| Collection | `4D5Z3iGXSNqamtQ8NzJbkM6WidV5vAvPou5YSfYW5vBk` | unchanged |
| Update authority | Collection → collection address | unchanged |
| Name | `SHAPE 01` | unchanged |
| Metadata URI | `ipfs://bafkreibvqcpfprjt7npdocu6umvul674jmriremac4q55nr56wuc4pwoeq` | `ipfs://bafkreibiyluoin5hvtoutyle2jjpipvhdc3fun4d3tgbv435ut7x3ksnxi` |
| Image URI | `ipfs://bafkreib5cb7ahxxcetdebqyy2mymbnzhovzkmz5umf6cyvohc3pchofv3i` (SVG) | `ipfs://bafkreia6awdux33m7yjsfaskhtalvkpxv3so24a2zfkfemis5zclcr2h3q` (PNG) |
| SVG file | `ipfs://bafkreib5cb7ahxxcetdebqyy2mymbnzhovzkmz5umf6cyvohc3pchofv3i` | unchanged in `properties.files` |
| PNG | 1200×1200, `#FF5C00` on `#080808` | uploaded + primary `image` |
| `numMinted` | 1 | **1** |
| `currentSize` | 1 | **1** |

Public manifest Shape 01 now records `imageUri` (PNG), `svgUri` (original SVG), and the new `metadataUri`. Predetermined asset addresses were not changed.

---

## Magic Eden

| Item | Status |
| --- | --- |
| Shape 01 token API | **200** — official token API |
| Token `image` | **new PNG** `ipfs://bafkreia6awdux33m7yjsfaskhtalvkpxv3so24a2zfkfemis5zclcr2h3q` |
| Token files | PNG `image/png` + original SVG `image/svg+xml` |
| Owner | `44tkTKCk1wRUZuFkqnS8AE6wAJBAn26f6i6xxLzU3X27` |
| Collection page | **not found** — `GET …/v2/collections/4D5Z3iGXSNqamtQ8NzJbkM6WidV5vAvPou5YSfYW5vBk` → **404** `"collection not found"` |
| Canonical collection URL | **none verified** — site CTA left pending |
| Creator Hub | no claim/manage action this gate |

Do not use item-detail or search URLs as the collection CTA. Do not mutate Shape 01 again to force a collection page.

---

## Marketplace image strategy

**PNG-primary selected.** SVG source retained.

| Decision | Detail |
| --- | --- |
| Canonical artwork | original SVG (site still uses `/shapes/shape-{n}.svg` + CSS mask) |
| Marketplace `image` | 1200×1200 PNG, `#FF5C00` on `#080808` |
| `properties.files` | PNG `image/png` + SVG `image/svg+xml` |
| Shape 01 JSON | no `properties.category` (matches authorized payload) |
| Shapes 02–72 JSON | existing PNG-primary metadata (includes `properties.category`) |

`npm run shapes:verify-marketplace-metadata`:

```text
72 / 72 marketplace PNGs valid
72 / 72 SVG source files preserved
72 / 72 metadata JSON valid
72 / 72 PNG primary image references valid
```

`npm run shapes:verify-metadata`:

```text
72 / 72 manifest entries
72 / 72 image URIs valid
72 / 72 metadata URIs valid
72 / 72 SVG hashes match
```

---

## Secondary trading UI

Implemented, **pending** (no verified collection URL).

- Copy: `Minting happens on shape72.fun. Secondary market trading is on Magic Eden.`
- CTA: `View collection on Magic Eden` — **not linked**
- Visible state: `Magic Eden collection pending`
- Placement: compact strip below the intro / above the gallery; owned/yours modal repeats the copy

After a Magic Eden sale, `GET /api/shapes/status` reads the **current** Metaplex Core owner. Wallet B becomes YOURS; Wallet A sees OWNED.

---

## Collection / mint guard

| Check | Result |
| --- | --- |
| `numMinted` | **1** |
| `currentSize` | **1** |
| Shapes 02–72 | unminted / AVAILABLE |
| `SHAPE72_PUBLIC_MINT_ENABLED` | unset |
| Mint guard | `isPublicMintEnabled()` is false → `403 MINT_DISABLED` |

---

## Tooling

| Check | Result |
| --- | --- |
| lint | **pass** |
| `tsc --noEmit` | **pass** |
| `build` | **pass** |
| `collection:verify` | **pass** — `numMinted = 1` |
| `shape01:verify` | **pass** — metadata URI is the new PNG-primary JSON |
| `shapes:verify-inventory` | **pass** — minted total 1, 02–72 unminted |
| `shapes:verify-metadata` | **pass** |
| `shapes:verify-marketplace-metadata` | **pass** |

---

## Security

- no private key files added to the repo
- Pinata JWT / operator path not in `.next/static`
- no new `NEXT_PUBLIC_*` secrets
- one authorized Core URI update only
- no Shape 02–72 mint

---

## Scope

- no new NFT minted
- no Shape 02–72 minted
- public mint off
- no `$72` launch work
- no Pump.fun
- no Supabase
- no creator-reward accounting
- no deployment
- no commit
- no push

---

## Operator next step (not this gate)

Claim/list the collection in Magic Eden Creator Hub once a collection page exists. Set the verified collection URL in `MAGIC_EDEN_COLLECTION_URL` before enabling the site CTA.
