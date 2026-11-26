export type OriginNamespace = "portal" | "learn" | "sourcecraft" | "procuresherpa" | "learnpmo" | "hcmfusion";

export interface StorageAdapter<T> {
  read(): T | null;
  write(value: T): void;
  remove(): void;
}

export interface StoredEnvelope<T> {
  version: number;
  data: T;
}

export interface Migration<T = unknown> {
  from: number;
  to: number;
  migrate(value: unknown): T;
}

export function storageKey(origin: OriginNamespace, key: string): string {
  if (!key.trim()) throw new Error("Storage key cannot be empty");
  return `digitracks:${origin}:${key}`;
}

export const sourceCraftKeys = {
  favourites: storageKey("sourcecraft", "favourites:v1"),
  recents: storageKey("sourcecraft", "recent:v1")
} as const;

export function runMigrations<T>(raw: unknown, migrations: readonly Migration[], initialData: T): StoredEnvelope<T> {
  if (raw === null || raw === undefined) return { version: 0, data: initialData };
  if (typeof raw !== "object" || !("version" in raw) || !("data" in raw)) {
    throw new Error("Stored state is corrupt: expected a versioned envelope");
  }

  const envelope = raw as StoredEnvelope<unknown>;
  if (!Number.isInteger(envelope.version) || envelope.version < 0) {
    throw new Error("Stored state is corrupt: invalid version");
  }

  let version = envelope.version;
  let data: unknown = envelope.data;
  const ordered = [...migrations].sort((left, right) => left.from - right.from);

  for (const migration of ordered) {
    if (migration.from !== version) continue;
    data = migration.migrate(data);
    version = migration.to;
  }

  if (version !== envelope.version && version !== ordered.at(-1)?.to) {
    throw new Error("Stored state migration chain is incomplete");
  }

  return { version, data: data as T };
}
