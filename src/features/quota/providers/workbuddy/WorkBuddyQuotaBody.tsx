import { useTranslation } from 'react-i18next';
import type { WorkBuddyQuotaState } from '@/types';
import { useNow } from '@/hooks/useNow';
import { buildResetDisplay } from '@/utils/quota';
import { QuotaMeter } from '../../components/QuotaMeter';
import { QuotaResetLabel } from '../../components/QuotaResetLabel';
import type { QuotaBodyProps } from '../../types';

export function WorkBuddyQuotaBody({ quota, classes }: QuotaBodyProps<WorkBuddyQuotaState>) {
  const { t, i18n } = useTranslation();
  const now = useNow();
  const locale = i18n.resolvedLanguage;
  const account = quota.windows.find((w) => w.id === 'account');
  const expiry = quota.windows.find((w) => w.id === 'token_expiry');
  const remainingPercent =
    quota.credits !== null && quota.capacity !== null && quota.capacity > 0
      ? (quota.credits / quota.capacity) * 100
      : null;
  const formatCredits = (value: number): string =>
    new Intl.NumberFormat(locale || undefined, { maximumFractionDigits: 2 }).format(value);
  const creditsDisplay =
    quota.credits === null
      ? t('workbuddy_quota.credits_unknown')
      : quota.capacity !== null
        ? t('workbuddy_quota.credits_value', {
            remaining: formatCredits(quota.credits),
            capacity: formatCredits(quota.capacity),
          })
        : formatCredits(quota.credits);
  const expiryDisplay = expiry?.atMs ? buildResetDisplay(null, expiry.atMs, now, locale) : null;

  return (
    <>
      {quota.site && (
        <div className={classes.codexPlan}>
          <span className={classes.codexPlanItem}>
            <span className={classes.codexPlanLabel}>{t('workbuddy_quota.site_label')}</span>
            <span className={classes.codexPlanValue}>
              {quota.site === 'workbuddy-ai' ? 'WorkBuddy AI' : 'WorkBuddy'}
            </span>
          </span>
          {account?.value && (
            <span className={classes.codexPlanItem}>
              <span className={classes.codexPlanLabel}>{t('workbuddy_quota.account_label')}</span>
              <span className={classes.codexPlanValue}>{account.value}</span>
            </span>
          )}
        </div>
      )}
      {quota.credits !== null && (
        <div className={classes.quotaRow}>
          <div className={classes.quotaRowHeader}>
            <span className={classes.quotaModel}>{t('workbuddy_quota.credits_label')}</span>
            <span className={classes.quotaAmount}>{creditsDisplay}</span>
          </div>
          <QuotaMeter percent={remainingPercent} classes={classes} />
        </div>
      )}
      {expiry && (
        <div className={classes.quotaRow}>
          <div className={classes.quotaRowHeader}>
            <span className={classes.quotaModel}>{t('workbuddy_quota.token_expiry')}</span>
            <div className={classes.quotaMeta}>
              {expiryDisplay ? (
                <QuotaResetLabel display={expiryDisplay} classes={classes} />
              ) : (
                <span className={classes.quotaReset}>{t('workbuddy_quota.expiry_unknown')}</span>
              )}
            </div>
          </div>
        </div>
      )}
      {!quota.site && quota.credits === null && !expiry && (
        <div className={classes.quotaRow}>
          <span className={classes.quotaReset}>{t('workbuddy_quota.no_data')}</span>
        </div>
      )}
    </>
  );
}
