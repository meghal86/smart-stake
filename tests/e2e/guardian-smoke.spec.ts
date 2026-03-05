import { expect, test } from '@playwright/test';

test.describe('Guardian smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const session = {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMmUtdXNlciIsImV4cCI6NDA3MDkwODgwMH0.c2lnbmF0dXJl',
        refresh_token: 'e2e-refresh-token',
        expires_at: nowSeconds + 60 * 60,
        expires_in: 60 * 60,
        token_type: 'bearer',
        user: {
          id: 'e2e-user',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'e2e@example.com',
          email_confirmed_at: '2026-03-05T12:00:00.000Z',
          confirmed_at: '2026-03-05T12:00:00.000Z',
          last_sign_in_at: '2026-03-05T12:00:00.000Z',
          app_metadata: {
            provider: 'email',
            providers: ['email'],
          },
          user_metadata: {
            name: 'E2E User',
          },
          identities: [],
          created_at: '2026-03-05T12:00:00.000Z',
          updated_at: '2026-03-05T12:00:00.000Z',
        },
      };

      window.localStorage.setItem('sb-rebeznxivaxgserswhbn-auth-token', JSON.stringify(session));
      window.localStorage.setItem('guardian_onboard_seen', '1');
    });
  });

  test('loads the Guardian route and enters demo mode', async ({ page }) => {
    await page.goto('/guardian');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Guardian', exact: true })
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole('button', { name: 'Try Guardian demo mode with sample wallet data' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Try Guardian demo mode with sample wallet data' }).click();

    await expect(page.getByText('DEMO DATA')).toBeVisible();
    await expect(page.getByText('Moderate Risk')).toBeVisible();
    await expect(page.getByText('78')).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: 'Exit demo mode and return to normal Guardian interface',
        exact: true,
      })
    ).toBeVisible();
  });
});
