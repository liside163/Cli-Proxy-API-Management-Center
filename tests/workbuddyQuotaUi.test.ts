import { beforeAll, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from '@/i18n';
import { WorkBuddyQuotaBody } from '@/features/quota/providers/workbuddy/WorkBuddyQuotaBody';
import { QUOTA_CLASS_KEYS, bindQuotaClasses } from '@/features/quota/types';
import type { WorkBuddyQuotaState } from '@/types';

const classes = bindQuotaClasses(
  Object.fromEntries(QUOTA_CLASS_KEYS.map((key) => [key, key])),
  'test-host'
);

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

describe('WorkBuddyQuotaBody', () => {
  test('renders live remaining credits and progress meter', () => {
    const quota: WorkBuddyQuotaState = {
      status: 'success',
      windows: [],
      observedAtMs: Date.now(),
      site: 'workbuddy-ai',
      uid: 'uid-1',
      credits: 1234,
      capacity: 2000,
      packages: [{ name: 'monthly', capacity: 2000, used: 766, remaining: 1234 }],
    };

    const markup = renderToStaticMarkup(createElement(WorkBuddyQuotaBody, { quota, classes }));

    expect(markup).toContain('Credits remaining');
    expect(markup).toContain('1,234 / 2,000');
    expect(markup).toContain('style="width:61.7%"');
  });
});
