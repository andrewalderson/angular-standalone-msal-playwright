import { test as base } from '@playwright/test';
import type { SessionStorageState } from 'e2e/playwright.config';
import { readFileSync } from 'fs';
import { tryGetEnviromentVariable } from './utils';

export const test = base.extend<
  {
    forEachTest: void;
    context: void;
  } & SessionStorageState
>({
  // make this an empty string and override it in the playwright config - in the use block globally or in each project
  // if a test needs an unauthenticated user they can use 'test.use({sessionStorageFilePath: ''})'
  sessionStorageFilePath: ['', { option: true }],
  forEachTest: [
    async ({ page }, use) => {
      // this code runs before each test.
      const clientId = tryGetEnviromentVariable('MSAL_CLIENT_ID');
      const authority = tryGetEnviromentVariable('MSAL_AUTHORITY');

      await page.route('**/msal.config.json', async (route) => {
        const response = await route.fetch();
        const json = await response.json();
        json.auth.clientId = clientId;
        json.auth.authority = authority;
        // need to ensure we use sessionStorage because if tokens are stored in localStorage the msal library will attempt to
        // refresh them by making a silent request which will fail because we have changed the authority and clientId above
        json.cache.cacheLocation = 'sessionStorage';
        await route.fulfill({ response, json });
      });

      await use();

      // this runs after each test since it is after the 'use()' statement
      await page.unrouteAll({ behavior: 'ignoreErrors' });
    },
    { auto: true },
  ],
  context: async ({ context, baseURL, sessionStorageFilePath }, use) => {
    // this code runs whenever a context is created
    if (!sessionStorageFilePath) {
      console.log('sessionStorage not set: skipping init script');
    } else if (!baseURL) {
      console.warn(
        'baseURL is not set; skipping session storage restoration init script'
      );
    } else {
      const sessionStorageState = readFileSync(sessionStorageFilePath, 'utf-8');
      const sessionStorageEntries = Object.entries(
        JSON.parse(sessionStorageState) as Record<string, string>
      );
      const { hostname } = new URL(baseURL);
      await context.addInitScript(
        function restoreSessionStorage(input) {
          if (window.location.hostname !== input.hostname) {
            console.warn(
              `Unexpected window.location. Expecting ${input.hostname}, got ${window.location.hostname}`
            );
            return;
          }
          for (const [key, value] of input.sessionStorageEntries) {
            window.sessionStorage.setItem(key, value);
          }
        },
        { hostname, sessionStorageEntries }
      );
    }

    await use(context);
  },
});
