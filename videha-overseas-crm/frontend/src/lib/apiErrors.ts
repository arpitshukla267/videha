export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const CONFLICT_REFRESH_MESSAGE =
  'This record was modified by another user. Please refresh and try again.';

export function isConflictError(err: unknown): err is ApiError {
  return err instanceof ApiError && err.status === 409;
}

export function alertSaveError(err: unknown, fallback: string): void {
  if (err instanceof ApiError) {
    alert(err.message || fallback);
    return;
  }
  alert(err instanceof Error ? err.message : fallback);
}

export async function handleConflictWithReload(
  err: unknown,
  reload: () => Promise<void>,
  fallback: string,
): Promise<boolean> {
  if (isConflictError(err)) {
    alert(err.message || CONFLICT_REFRESH_MESSAGE);
    await reload();
    return true;
  }
  alertSaveError(err, fallback);
  return false;
}
