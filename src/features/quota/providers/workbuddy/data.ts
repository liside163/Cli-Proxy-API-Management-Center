import type { TFunction } from 'i18next';
import type { AuthFileItem, WorkBuddyQuotaData, WorkBuddyQuotaState } from '@/types';
import { authFilesApi } from '@/services/api';
import { isWorkBuddyFile, isDisabledAuthFile } from '@/utils/quota';
import type { QuotaProviderData } from '../types';

type WorkBuddySite = 'workbuddy' | 'workbuddy-ai';

const siteOf = (file: AuthFileItem): WorkBuddySite => {
  const key = String(file.provider ?? file.type ?? '')
    .trim()
    .toLowerCase();
  return key === 'workbuddy-ai' ? 'workbuddy-ai' : 'workbuddy';
};

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

/** Fetches the account identity and the live read-only billing snapshot. */
const fetchWorkBuddyQuota = async (file: AuthFileItem): Promise<WorkBuddyQuotaData> => {
  const meta = (file.metadata ?? file) as Record<string, unknown>;
  const nickname = readString(meta.nickname ?? meta.name ?? meta.label);
  const uid = readString(meta.uid);
  const expiresAtMs = readMs(meta.expires_at ?? meta.expired);
  const credits = await authFilesApi.fetchWorkBuddyCredits(file);
  const capacity = credits.packages.reduce((total, item) => total + item.capacity, 0);

  return {
    windows: [
      { id: 'account', value: nickname ?? uid, atMs: null },
      { id: 'token_expiry', value: null, atMs: expiresAtMs },
    ],
    observedAtMs: Date.now(),
    site: siteOf(file),
    uid,
    credits: credits.credits,
    capacity: capacity > 0 ? capacity : null,
    packages: credits.packages,
  };
};

const emptyData = (): WorkBuddyQuotaData => ({
  windows: [],
  observedAtMs: null,
  site: null,
  uid: null,
  credits: null,
  capacity: null,
  packages: [],
});

export const WORKBUDDY_CONFIG: QuotaProviderData<WorkBuddyQuotaState, WorkBuddyQuotaData> = {
  type: 'workbuddy',
  i18nPrefix: 'workbuddy_quota',
  filterFn: (file) => isWorkBuddyFile(file) && !isDisabledAuthFile(file),
  fetchQuota: (file, _t: TFunction) => fetchWorkBuddyQuota(file),
  storeSelector: (state) => state.workbuddyQuota,
  storeSetter: 'setWorkBuddyQuota',
  buildLoadingState: () => ({ status: 'loading', ...emptyData() }),
  buildSuccessState: (data) => ({ status: 'success', ...data }),
  buildErrorState: (message, status) => ({
    status: 'error',
    ...emptyData(),
    error: message,
    errorStatus: status,
  }),
};
