import { useTranslation } from 'react-i18next';
import type { KiroQuotaState } from '@/types';
import { useNow } from '@/hooks/useNow';
import { buildResetDisplay } from '@/utils/quota';
import { QuotaMeter } from '../../components/QuotaMeter';
import { QuotaResetLabel } from '../../components/QuotaResetLabel';
import type { QuotaBodyProps } from '../../types';

export function KiroQuotaBody({ quota, classes }: QuotaBodyProps<KiroQuotaState>) {
  const { t, i18n } = useTranslation();
  const now = useNow();
  const locale = i18n.resolvedLanguage;
  const account = quota.windows.find((w) => w.id === 'account');
  const expiry = quota.windows.find((w) => w.id === 'token_expiry');
  const formatCredits = (value: number): string =>
    new Intl.NumberFormat(locale || undefined, { maximumFractionDigits: 2 }).format(value);
  const resetDisplay = quota.nextResetMs
    ? buildResetDisplay(null, quota.nextResetMs, now, locale)
    : null;
  const expiryDisplay = expiry?.atMs ? buildResetDisplay(null, expiry.atMs, now, locale) : null;

  return (
    <>
      {(quota.plan || account?.value) && (
        <div className={classes.codexPlan}>
          {quota.plan && (
            <span className={classes.codexPlanItem}>
              <span className={classes.codexPlanLabel}>{t('kiro_quota.plan_label')}</span>
              <span className={classes.codexPlanValue}>{quota.plan}</span>
            </span>
          )}
          {account?.value && (
            <span className={classes.codexPlanItem}>
              <span className={classes.codexPlanLabel}>{t('kiro_quota.account_label')}</span>
              <span className={classes.codexPlanValue}>{account.value}</span>
            </span>
          )}
        </div>
      )}
      {quota.entries.map((entry, index) => {
        const remainingPercent =
          entry.limit > 0 ? Math.max(0, ((entry.limit - entry.used) / entry.limit) * 100) : null;
        const trialRemaining =
          entry.freeTrial && entry.freeTrial.limit !== undefined && entry.freeTrial.limit > 0
            ? Math.max(
                0,
                ((entry.freeTrial.limit - (entry.freeTrial.used ?? 0)) / entry.freeTrial.limit) *
                  100
              )
            : null;
        return (
          <div className={classes.quotaRow} key={entry.name ?? index}>
            <div className={classes.quotaRowHeader}>
              <span className={classes.quotaModel}>
                {entry.name ?? t('kiro_quota.entry_unknown')}
              </span>
              <span className={classes.quotaAmount}>
                {t('kiro_quota.usage_value', {
                  remaining: formatCredits(Math.max(0, entry.limit - entry.used)),
                  capacity: formatCredits(entry.limit),
                })}
              </span>
            </div>
            <QuotaMeter percent={remainingPercent} classes={classes} />
            {trialRemaining !== null && (
              <div className={classes.quotaMeta}>
                <span className={classes.quotaReset}>
                  {t('kiro_quota.free_trial_value', {
                    remaining: formatCredits(
                      Math.max(0, (entry.freeTrial?.limit ?? 0) - (entry.freeTrial?.used ?? 0))
                    ),
                    capacity: formatCredits(entry.freeTrial?.limit ?? 0),
                  })}
                </span>
              </div>
            )}
          </div>
        );
      })}
      {quota.entries.length === 0 && (
        <div className={classes.quotaRow}>
          <span className={classes.quotaReset}>{t('kiro_quota.no_data')}</span>
        </div>
      )}
      {resetDisplay && (
        <div className={classes.quotaRow}>
          <div className={classes.quotaRowHeader}>
            <span className={classes.quotaModel}>{t('kiro_quota.next_reset')}</span>
            <div className={classes.quotaMeta}>
              <QuotaResetLabel display={resetDisplay} classes={classes} />
            </div>
          </div>
        </div>
      )}
      {expiry && (
        <div className={classes.quotaRow}>
          <div className={classes.quotaRowHeader}>
            <span className={classes.quotaModel}>{t('kiro_quota.token_expiry')}</span>
            <div className={classes.quotaMeta}>
              {expiryDisplay ? (
                <QuotaResetLabel display={expiryDisplay} classes={classes} />
              ) : (
                <span className={classes.quotaReset}>{t('kiro_quota.expiry_unknown')}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
