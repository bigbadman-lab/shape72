# SHAPE72 — Gate 2: Reown AppKit Solana Wallet Connection

## Verdict

**PASS — GATE 2 REOWN SOLANA WALLET COMPLETE**

Operator verification has been performed with a real Solana wallet. Lint, typecheck, and build were re-run after that verification and still pass. No implementation change was required.

---

## Repository state

| Field | Value |
| --- | --- |
| UTC timestamp | `2026-09-24T08:26:33Z` |
| Branch | `main` |
| HEAD | `8bf8810` — `feat: port SHAPE72 frontend` |
| Working tree | dirty — Gate 2 files uncommitted; **no commit / no push** |

`.env.local` is gitignored (`.gitignore` rule `.env*` with `!.env.example`). It does not appear in `git status`.

---

## Reown implementation

| Item | Detail |
| --- | --- |
| Packages | `@reown/appkit@1.8.24`, `@reown/appkit-adapter-solana@1.8.24` |
| Stack | current `@reown/*` — no `@web3modal/*` |
| Adapter | `SolanaAdapter` from `@reown/appkit-adapter-solana/react` |
| Init | `createAppKit` in `src/lib/reown.ts`, client-only, window-guarded |
| Network | **Solana Mainnet only** (`solana` / `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`) |
| Metadata name | `SHAPE72` |
| Metadata description | `72 shapes. Each 1/1.` |
| Metadata URL | `NEXT_PUBLIC_APP_URL` |
| Icon | `public/shapes/72pfp.png` via `{APP_URL}/shapes/72pfp.png` |
| RPC | `NEXT_PUBLIC_SOLANA_RPC_URL` if set; otherwise public mainnet fallback `https://api.mainnet-beta.solana.com` |

Optional Reown features **disabled**:

- analytics
- swaps
- onramp
- email login
- social login
- network switch
- wallet guide

Enabled / available for later gates:

- wallet connect / select / disconnect
- connected Solana address via `useAppKitAccount({ namespace: "solana" })`
- signing capability remains in the adapter (`useAppKitProvider("solana")`) — **not invoked in Gate 2**

---

## Environment

Presence only — values never printed:

```text
NEXT_PUBLIC_REOWN_PROJECT_ID: present
NEXT_PUBLIC_SOLANA_RPC_URL: present
NEXT_PUBLIC_APP_URL: present
```

Confirmations:

- `.env.local` is ignored by Git
- `.env.example` is tracked (ignore exception)
- no Project ID was hard-coded
- no secrets or config values were committed
- missing Project ID still disables AppKit cleanly if the variable is removed later — no fake/fallback Project ID

---

## Wallet behaviour

| Check | Result | Verification type |
| --- | --- | --- |
| CONNECT control | Existing header pill; opens Reown | operator + automated |
| Reown modal opens from CONNECT | **PASS** | operator |
| Solana wallet selection | **PASS** | operator |
| Real Solana wallet connection | **PASS** | operator |
| Real connected address displayed in SHAPE72 UI | **PASS** | operator |
| Disconnect | **PASS** | operator |
| Reconnect | **PASS** | operator |
| Modal close / rejection leaves UI clean | **PASS** | operator |
| Missing-config path | CONNECT remains; no fake Project ID | automated (pre-operator) |

Claim modal: still non-transactional. If disconnected, `CLAIM SHAPE` opens the wallet connect path. If connected, it only updates local mock state. No mint, no signature, no broadcast.

Mock `AVAILABLE` / `OWNED` / `YOURS` states stay mocked and do **not** follow the real wallet.

---

## Responsive

| Viewport | Disconnected | Connected |
| --- | --- | --- |
| 1440px | CONNECT visible, 4-column gallery, wordmark aligned | operator: no material regression |
| 1024px | CONNECT visible, 4-column gallery | operator: no material regression |
| 390px | 2-column gallery, CONNECT present | operator: no material regression |

Operator confirmation: connected wallet UI checked at desktop/mobile with **no material regression**.

---

## Tooling

Re-run after operator verification:

| Check | Result |
| --- | --- |
| Lint | **pass** — `npm run lint` |
| Typecheck | **pass** — `npx tsc --noEmit` |
| Build | **pass** — `npm run build` (`/` static) |

---

## Files

Implementation was not changed for this verification update. Report-only edit: `audit/gate-2-reown-wallet.md`.

### Added

- `.env.example`
- `.env.local` (gitignored)
- `src/lib/reown.ts`
- `src/lib/solana.ts`
- `src/components/AppKitProvider.tsx`
- `src/components/WalletControl.tsx`
- `audit/gate-2-reown-wallet.md`

### Changed

- `package.json` / `package-lock.json` — `@reown/appkit`, `@reown/appkit-adapter-solana`
- `.gitignore` — keep `.env*` ignored, allow `.env.example`
- `src/app/layout.tsx` — client `AppKitProvider` boundary only
- `src/components/HomePage.tsx` — existing CONNECT control replaced with `WalletControl`; mock Shape state unchanged

---

## Scope confirmations

- no Metaplex package added
- no NFT mint logic added
- no Shape ownership lookup added
- no Pump.fun integration added
- no reward logic added
- no transaction constructed
- no transaction signed
- no transaction broadcast
- no deployment
- no commit
- no push
