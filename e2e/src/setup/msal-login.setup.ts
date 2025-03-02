import { Authority, ProtocolMode, ScopeSet } from '@azure/msal-common/browser';
import { test as setup } from '@playwright/test';
import { SESSION_STORAGE_STATE } from 'e2e/playwright.config';
import { existsSync, writeFileSync } from 'node:fs';
import {
  acquireTokenWithUsernameAndPassword,
  createCachableAccessToken,
  createCachableAccount,
  createCachableIdToken,
  createCachableRefreshToken,
} from './token-helpers';

setup.skip(
  existsSync(SESSION_STORAGE_STATE) /*&& !fileOlderThan(storageFilePath, "1h"*/
);
setup('msal-login', async ({ request, page }) => {
  const username = process.env['MSAL_USERNAME'] || '';
  const password = process.env['MSAL_PASSWORD'] || '';
  const clientId = process.env['MSAL_CLIENT_ID'] || '';
  const authority = process.env['MSAL_AUTHORITY'] || '';

  setup.skip(
    !username || !password || !clientId || !authority,
    'MSAL_USERNAME, MSAL_PASSWORD, MSAL_CLIENT_ID, and MSAL_AUTHORITY must be set in the .env file'
  );

  // only scopes for api calls should be passed in
  // if no scopes are passed in we need to send the client id as a scope
  // as either an api scope or the client id is required
  const scopes = process.env['MSAL_SCOPES'] || clientId;

  const externalTokenResponse = await acquireTokenWithUsernameAndPassword(
    request,
    username,
    password,
    authority,
    clientId,
    scopes
  );

  const authorityEntity = new Authority(
    authority,
    {} as any,
    {} as any,
    { protocolMode: ProtocolMode.AAD } as any,
    {} as any,
    ''
  );
  const tokens = [];
  const tokenKeys: Record<string, string[]> = {};

  const account = createCachableAccount(externalTokenResponse, authorityEntity);
  tokens.push({ ...account });
  tokens.push({ key: 'msal.account.keys', value: [account.key] });

  const { value: accountEntity } = account;

  const idToken = createCachableIdToken(
    externalTokenResponse,
    accountEntity.homeAccountId,
    accountEntity.environment,
    clientId,
    accountEntity.realm
  );
  if (idToken) {
    tokens.push({ ...idToken });
    tokenKeys['idToken'] = [idToken.key];
  }

  const accessToken = createCachableAccessToken(
    externalTokenResponse,
    accountEntity.homeAccountId,
    accountEntity.environment,
    accountEntity.realm,
    clientId,
    ScopeSet.fromString(scopes),
    externalTokenResponse.expires_in || 0,
    externalTokenResponse.ext_expires_in ||
      externalTokenResponse.expires_in ||
      0
  );
  if (accessToken) {
    tokens.push({ ...accessToken });
    tokenKeys['accessToken'] = [accessToken.key];
  }

  const refreshToken = createCachableRefreshToken(
    externalTokenResponse,
    accountEntity.homeAccountId,
    accountEntity.environment,
    clientId
  );

  if (refreshToken) {
    tokens.push({ ...refreshToken });
    tokenKeys['refreshToken'] = [refreshToken.key];
  }

  tokens.push({ key: `msal.token.keys.${clientId}`, value: tokenKeys });

  // add this initScript before we naivigate so that the session storage is set
  // preventing a redirect to the b2c endpoint
  await page.addInitScript((tokens) => {
    for (const { key, value } of tokens) {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    }
  }, tokens);

  await page.goto('/');

  const sessionStorage: string = await page.evaluate(() =>
    JSON.stringify(window.sessionStorage)
  );
  writeFileSync(SESSION_STORAGE_STATE, sessionStorage, 'utf-8');
});
