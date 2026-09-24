import { optionalEnv } from "../lib/env";

type PinataUploadResponse = {
  data?: { cid?: string };
  cid?: string;
  error?: { message?: string } | string;
};

export async function pinataUpload(options: {
  bytes: Uint8Array;
  filename: string;
  contentType: string;
}): Promise<string> {
  const jwt = optionalEnv("PINATA_JWT");
  if (!jwt) {
    throw new Error("PINATA_JWT is missing");
  }

  const file = new File([Buffer.from(options.bytes)], options.filename, {
    type: options.contentType,
  });
  const body = new FormData();
  body.append("file", file);
  body.append("network", "public");
  body.append("name", options.filename);

  const response = await fetch("https://uploads.pinata.cloud/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body,
  });
  const json = (await response.json()) as PinataUploadResponse;
  const cid = json.data?.cid || json.cid;
  if (!response.ok || !cid) {
    throw new Error("Pinata upload failed");
  }
  return `ipfs://${cid}`;
}
