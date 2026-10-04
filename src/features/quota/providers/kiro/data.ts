import type { TFunction } from 'i18next';
import type { AuthFileItem, KiroQuotaData, KiroQuotaState } from '@/types';
import { authFilesApi } from '@/services/api';
import { isKiroFile, isDisabledAuthFile } from '@/utils/quota';
import type { QuotaProviderData } from '../types';

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const readMs = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    // unix seconds vs ms
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n < 1e12 ? n * 1000 : n;
  }
  return null;
};

/** Fetches the account identity and the live read-only usage snapshot. */
const fetchKiroQuota = async (file: AuthFileItem): Promise<KiroQuotaData> => {
  const meta = (file.metadata ?? file) as Record<string, unknown>;
  const fileEmail = readString(meta.email ?? meta.label);
  const expiresAtMs = readMs(meta.expiresAt ?? meta.expires_at ?? meta.expired);
  const usage = await authFilesApi.fetchKiroUsage(file);

  // Earliest upcoming reset across the top-level bucket and each entry.
  const resetCandidates = [usage.nextReset, ...usage.entries.map((e) => e.nextReset)]
    .map((v) => readMs(v))
    .filter((v): v is number => v !== null);
  const nextResetMs = resetCandidates.length > 0 ? Math.min(...resetCandidates) : null;

  return {
    windows: [
      { id: 'account', value: usage.email ?? fileEmail, atMs: null },
      { id: 'token_expiry', value: null, atMs: expiresAtMs },
    ],
    observedAtMs: Date.now(),
    email: usage.email ?? fileEmail,
    plan: usage.subscriptionTitle,
    nextResetMs,
    entries: usage.entries,
  };
};

const emptyData = (): KiroQuotaData => ({
  windows: [],
  observedAtMs: null,
  email: null,
  plan: null,
  nextResetMs: null,
  entries: [],
});

export const KIRO_CONFIG: QuotaProviderData<KiroQuotaState, KiroQuotaData> = {
  type: 'kiro',
  i18nPrefix: 'kiro_quota',
  filterFn: (file) => isKiroFile(file) && !isDisabledAuthFile(file),
  fetchQuota: (file, _t: TFunction) => fetchKiroQuota(file),
  storeSelector: (state) => state.kiroQuota,
  storeSetter: 'setKiroQuota',
  buildLoadingState: () => ({ status: 'loading', ...emptyData() }),
  buildSuccessState: (data) => ({ status: 'success', ...data }),
  buildErrorState: (message, status) => ({
    status: 'error',
    ...emptyData(),
    error: message,
    errorStatus: status,
  }),
};
