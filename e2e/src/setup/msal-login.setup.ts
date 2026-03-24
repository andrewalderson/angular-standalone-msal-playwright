import { workspaceRoot } from '@nx/devkit';
import { test as setup } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileOlderThan, tryGetEnviromentVariable } from '../utils';

const sessionStorageFilePath = tryGetEnviromentVariable(
  'SESSION_STORAGE_FILE_PATH',
);

const hourInMilliseconds = 60 * 60 * 1000;

setup.skip(
  existsSync(sessionStorageFilePath) &&
    !fileOlderThan(sessionStorageFilePath, hourInMilliseconds),
);
setup('msal-login', async ({ page }) => {
  const username = tryGetEnviromentVariable('MSAL_USERNAME');
  const password = tryGetEnviromentVariable('MSAL_PASSWORD');
  const clientId = tryGetEnviromentVariable('MSAL_CLIENT_ID');
  const authority = tryGetEnviromentVariable('MSAL_AUTHORITY');

  // only scopes for api calls should be passed in
  // if no scopes are passed in we need to send the client id as a scope
  // as either an api scope or the client id is required
  const scopes = tryGetEnviromentVariable('MSAL_SCOPES', clientId);

  const requestParams = {
    grant_type: 'password',
    client_id: clientId,
    username,
    password,
    scope: `openid offline_access ${scopes}`,
    response_type: 'token id_token',
    client_info: '1', // this is undocumented but needs to be set to return client_info in the ExternalTokenResponse when caching the tokens
  };

  const formData = new FormData();
  Object.entries(requestParams).forEach(([name, value]) =>
    formData.set(name, value),
  );

  const tokenRequest = await fetch(`${authority}/oauth2/v2.0/token`, {
    method: 'POST',
    body: formData,
  });

  const externalTokens = await tokenRequest.json();

  // IMPORTANT: Navigate before adding the script to the page below
  // Failure to do this will result in the script executing in a non secure browser context
  // causing calls in the msal browser library to window.crypto.subtle to fail
  await page.goto('/');

  // Need to add the msal-browser library to the page so we can load the tokens into the cache below
  // We use the version from node_modules so there are no version mismatches and becuase new version
  // of the library are no longer available on the Microsoft CDN
  const moduleFile = path.join(
    workspaceRoot,
    'node_modules/@azure/msal-browser/lib/msal-browser.min.js',
  );

  // Add the msal browser script to the page
  await page.addScriptTag({
    path: moduleFile,
    type: 'module',
  });

  // Have the msal browser library add the tokens to browser storage
  // Doing it this way will ensure that the browser storage keys have the correct schema
  const sessionStorage: string = await page.evaluate(
    async ({ externalTokens, authority, clientId, scopes }) => {
      await (window as any).msal.loadExternalTokens(
        {
          auth: {
            authority,
            clientId,
          },
        },
        { authority, scopes },
        externalTokens,
        {},
      );
      // read and return the tokens added to sessionStorage by 'loadExternalTokens'
      // sessionStorage is set as the cache location in the msal config (see ../fixtures.ts)
      return JSON.stringify(window.sessionStorage);
    },
    { externalTokens, authority, clientId, scopes },
  );

  const dir = path.dirname(sessionStorageFilePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(sessionStorageFilePath, sessionStorage, 'utf-8');
});
