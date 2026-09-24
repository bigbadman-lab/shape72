import { PublicKey } from "@solana/web3.js";
import { loadOperatorEnv } from "../lib/env";
import { rpcCall } from "../collection/rpc";
import {
  BONDING_CURVE_DISCRIMINATOR,
  BONDING_CURVE_SEED,
  EXPECTED_DECIMALS,
  MPL_CORE_PROGRAM,
  PUMP_PROGRAM,
  SPL_TOKEN_PROGRAM,
  TOKEN_2022_PROGRAM,
} from "./constants";

type AccountInfo = {
  owner: string;
  data: [string, string];
  executable: boolean;
  lamports: number;
} | null;

export type MintValidation = {
  mint: string;
  exists: boolean;
  owner: string;
  tokenProgram: string;
  decimals: number | null;
  initialized: boolean;
  bondingCurve: string;
  bondingCurveOwner: string;
  pumpProvenance: boolean;
  symbol: string | "pending";
};

export class TokenValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenValidationError";
  }
}

async function fetchAccount(address: string): Promise<AccountInfo> {
  const result = await rpcCall<{ value?: AccountInfo } | AccountInfo>("getAccountInfo", [
    address,
    { encoding: "base64", commitment: "confirmed" },
  ]);
  if (result && typeof result === "object" && "value" in result) {
    return result.value || null;
  }
  return (result as AccountInfo) || null;
}

function decodeAccount(info: AccountInfo): Buffer {
  if (!info?.data?.[0]) return Buffer.alloc(0);
  return Buffer.from(info.data[0], info.data[1] === "base64" ? "base64" : "base64");
}

function parseMint(data: Buffer): { decimals: number; initialized: boolean } {
  if (data.length < 82) {
    throw new TokenValidationError("Account is not a token mint");
  }
  return {
    decimals: data.readUInt8(44),
    initialized: data.readUInt8(45) === 1,
  };
}

export function bondingCurveAddress(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()],
    new PublicKey(PUMP_PROGRAM),
  )[0];
}

export async function validatePumpMint(raw: string): Promise<MintValidation> {
  loadOperatorEnv();
  let mint: PublicKey;
  try {
    mint = new PublicKey(raw);
  } catch {
    throw new TokenValidationError("Invalid Solana public key");
  }
  if (mint.toBase58() !== raw.trim()) {
    throw new TokenValidationError("Invalid Solana public key");
  }

  const info = await fetchAccount(mint.toBase58());
  if (!info) {
    throw new TokenValidationError("Mint account does not exist");
  }
  if (info.owner === MPL_CORE_PROGRAM) {
    throw new TokenValidationError("Account is a Metaplex Core NFT, not a token mint");
  }
  if (info.owner !== TOKEN_2022_PROGRAM && info.owner !== SPL_TOKEN_PROGRAM) {
    throw new TokenValidationError(`Account is not a token mint (owner ${info.owner})`);
  }
  if (info.owner !== TOKEN_2022_PROGRAM) {
    throw new TokenValidationError(
      "Mint is not Token-2022. Current Pump create_v2 coins must use Token-2022",
    );
  }

  const parsed = parseMint(decodeAccount(info));
  if (!parsed.initialized) {
    throw new TokenValidationError("Token mint is not initialized");
  }
  if (parsed.decimals !== EXPECTED_DECIMALS) {
    throw new TokenValidationError(
      `Token decimals are ${parsed.decimals}, expected ${EXPECTED_DECIMALS}`,
    );
  }

  const curve = bondingCurveAddress(mint);
  const curveInfo = await fetchAccount(curve.toBase58());
  if (!curveInfo) {
    throw new TokenValidationError("Pump bonding curve PDA not found");
  }
  if (curveInfo.owner !== PUMP_PROGRAM) {
    throw new TokenValidationError("Bonding curve is not owned by the Pump program");
  }
  const curveData = decodeAccount(curveInfo);
  if (
    curveData.length < BONDING_CURVE_DISCRIMINATOR.length ||
    !curveData.subarray(0, 8).equals(BONDING_CURVE_DISCRIMINATOR)
  ) {
    throw new TokenValidationError("Pump bonding curve discriminator mismatch");
  }

  return {
    mint: mint.toBase58(),
    exists: true,
    owner: info.owner,
    tokenProgram: "Token-2022",
    decimals: parsed.decimals,
    initialized: true,
    bondingCurve: curve.toBase58(),
    bondingCurveOwner: curveInfo.owner,
    pumpProvenance: true,
    symbol: "pending",
  };
}
