import { expect } from '@playwright/test';
import { test } from './fixtures';

/**
 * These test are just for demo and act as snity checks that the apop is configured with
 * all the routes for the auth and that the auth will work as excepted
 *
 * I don't like having to know that selectors of each page and I could add test ids to them
 * but the selectors are not important in the app so the chances of them changing are pretty well nil
 */
test.describe('Auth routes', () => {
  let config: any;
  test.beforeEach(async ({ page }) => {
    const reponsePromise = page.waitForResponse('**/msal.config.json');
    await page.goto('/');
    const response = await reponsePromise;
    config = await response.json();
  });

  test('should have the msal redirect component on the index page', async ({
    page,
  }) => {
    await expect(page.locator('app-redirect')).toBeAttached();
  });
  test('should be able to route to the sign in redirect page', async ({
    page,
  }) => {
    await page.goto(config.auth.redirectUri);
    // this page has no content so it won't be visible
    await expect(page.locator('app-signin-callback')).toBeAttached();
  });

  test('should be able to route to the login failed page', async ({ page }) => {
    await page.goto(config.guard.loginFailedRoute);

    await expect(page.locator('app-login-failed')).toBeVisible();
  });

  test('should be able to route to the signed out page', async ({ page }) => {
    await page.goto(config.auth.postLogoutRedirectUri);

    await expect(page.locator('app-signed-out')).toBeVisible();
  });
});
