/** Serialize mongoose docs to frontend-friendly shape (`id` instead of `_id`). */
export function toClient<T extends Record<string, unknown>>(doc: T | null | undefined): T | null {
  if (!doc) return null;
  const maybeToObject = doc as unknown as { toObject?: () => T };
  const obj = typeof maybeToObject.toObject === "function" ? maybeToObject.toObject() : { ...doc };

  const raw = obj as Record<string, unknown>;
  if (raw._id != null) {
    raw.id = String(raw._id);
    delete raw._id;
  }
  delete raw.__v;
  delete raw.passwordHash;

  // Flatten common ObjectId refs
  for (const key of Object.keys(raw)) {
    const val = raw[key];
    if (val && typeof val === "object" && !(val instanceof Date) && !Array.isArray(val)) {
      const nested = val as Record<string, unknown>;
      if (nested._id != null && nested.name == null && nested.email == null && nested.code == null) {
        raw[key] = String(nested._id);
      } else if (nested._id != null) {
        nested.id = String(nested._id);
        delete nested._id;
        delete nested.__v;
        delete nested.passwordHash;
      }
    }
  }

  return raw as T;
}

export function toClientList<T extends Record<string, unknown>>(docs: T[]): T[] {
  return docs.map((d) => toClient(d)!);
}
