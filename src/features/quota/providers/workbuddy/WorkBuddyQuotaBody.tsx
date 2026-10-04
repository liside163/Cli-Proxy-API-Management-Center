import { useTranslation } from 'react-i18next';
import type { WorkBuddyQuotaState } from '@/types';
import { useNow } from '@/hooks/useNow';
import { buildResetDisplay } from '@/utils/quota';
import { QuotaResetLabel } from '../../components/QuotaResetLabel';
import type { QuotaBodyProps } from '../../types';

export function WorkBuddyQuotaBody({ quota, classes }: QuotaBodyProps<WorkBuddyQuotaState>) {
  const { t, i18n } = useTranslation();
  const now = useNow();
  const locale = i18n.resolvedLanguage;
  const account = quota.windows.find((w) => w.id === 'account');
  const expiry = quota.windows.find((w) => w.id === 'token_expiry');
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
      {!quota.site && !expiry && (
        <div className={classes.quotaRow}>
          <span className={classes.quotaReset}>{t('workbuddy_quota.no_data')}</span>
        </div>
      )}
    </>
  );
}
