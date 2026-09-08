export function createClientRequestId(): string {
  return crypto.randomUUID();
}
