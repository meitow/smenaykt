import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

/** Where private files live. Swap via PRIVATE_STORAGE_BACKEND in .env */
export type PrivateStorageBackend = "local" | "s3";

const ALLOWED_BACKENDS: PrivateStorageBackend[] = ["local", "s3"];

export function getPrivateStorageBackend(): PrivateStorageBackend {
  const raw = process.env.PRIVATE_STORAGE_BACKEND?.trim().toLowerCase();
  if (raw === "s3") return "s3";
  return "local";
}

export function getPrivateStorageLocalDir() {
  const configured = process.env.PRIVATE_STORAGE_LOCAL_DIR?.trim();
  if (configured) return configured;
  return path.join(process.cwd(), "private-uploads");
}

export function buildIdentityStorageKey(phone: string, ext: string) {
  const hash = createHash("sha256").update(phone).digest("hex").slice(0, 24);
  return `identity/${hash}/${Date.now()}.${ext}`;
}

export async function savePrivateFile(
  storageKey: string,
  bytes: Buffer,
  backend: PrivateStorageBackend = getPrivateStorageBackend()
) {
  if (backend === "s3") {
    throw new Error("PRIVATE_STORAGE_S3_NOT_CONFIGURED");
  }

  const filepath = path.join(getPrivateStorageLocalDir(), storageKey);
  await mkdir(path.dirname(filepath), { recursive: true });
  await writeFile(filepath, bytes);
}

export async function readPrivateFile(
  storageKey: string,
  backend: PrivateStorageBackend = getPrivateStorageBackend()
): Promise<Buffer | null> {
  if (backend === "s3") {
    throw new Error("PRIVATE_STORAGE_S3_NOT_CONFIGURED");
  }

  try {
    const filepath = path.join(getPrivateStorageLocalDir(), storageKey);
    return await readFile(filepath);
  } catch {
    return null;
  }
}

export function assertPrivateStorageBackend(value: string): PrivateStorageBackend {
  if (ALLOWED_BACKENDS.includes(value as PrivateStorageBackend)) {
    return value as PrivateStorageBackend;
  }
  return "local";
}
