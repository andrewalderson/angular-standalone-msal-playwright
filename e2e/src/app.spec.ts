import { expect } from '@playwright/test';
import { test } from './fixtures';

test.describe('user is not authenticated', () => {
  // this demonstrates how to start the tests with an unauthenticated user
  // if we don't pass a path for the sesion storage the auth tokens will not be set in sessionStorage
  test.use({ sessionStorageFilePath: '' });

  test('should be redirected to the login page', async ({ page }) => {
    await page.goto('/');

    await page.waitForEvent('framenavigated');

    // eslint-disable-next-line playwright/no-conditional-in-test
    const expectedUrl = process.env['MSAL_AUTHORITY'] || '';

    expect(page.url().toLowerCase()).toMatch(expectedUrl.toLowerCase());
  });
});

test.describe('user is authenticated', () => {
  test('has title', async ({ page }) => {
    await page.goto('/');

    expect(await page.locator('h1').innerText()).toContain('Welcome');
  });

  test('should add access token to protected resource', async ({ page }) => {
    // we will just intercept this because the resource endpoint doesn't exist
    await page.route('/resource', async (route) => {
      await route.fulfill({ status: 200, body: '' });
    });

    await page.goto('/');

    const request = await page.waitForRequest('/resource');

    // we only need to know that the header exists
    // the value of it is an implementation detail of the msal library so we don't assert on that
    expect(await request.headerValue('authorization')).not.toBeNull();
  });
});
