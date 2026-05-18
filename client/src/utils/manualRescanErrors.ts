import { FirebaseError } from 'firebase/app';

export function isManualRescanCooldownError(error: unknown): boolean {
  if (error instanceof FirebaseError && error.code === 'functions/resource-exhausted') {
    return true;
  }
  const msg = error instanceof Error ? error.message : String(error);
  return /24\s*hours|resource-exhausted|too many requests/i.test(msg);
}
