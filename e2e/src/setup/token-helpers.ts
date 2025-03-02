import type { ExternalTokenResponse } from '@azure/msal-browser';
import { Logger } from '@azure/msal-browser';
import type {
  AccessTokenEntity,
  Authority,
  ICrypto,
  IdTokenEntity,
  RefreshTokenEntity,
  ScopeSet,
} from '@azure/msal-common/browser';
import {
  AccountEntity,
  AuthToken,
  buildAccountToCache,
  CacheHelpers,
} from '@azure/msal-common/browser';
import type { APIRequestContext } from '@playwright/test';
import { base64Decode } from './utils';

export async function acquireTokenWithUsernameAndPassword(
  request: APIRequestContext,
  username: string,
  password: string,
  authority: string,
  clientId: string,
  scopes: string
): Promise<ExternalTokenResponse> {
  const response = await request.post(`${authority}/oauth2/v2.0/token`, {
    form: {
      grant_type: 'password',
      client_id: clientId,
      username,
      password,
      scope: `openid offline_access ${scopes}`,
      response_type: 'token id_token',
      client_info: 1, // this is undocumented but needs to be set to return client_info in the ExternalTokenResponse when caching the tokens
    },
  });

  return await response.json();
}

export function createCachableAccount(
  response: ExternalTokenResponse,
  authority: Authority
): { key: string; value: AccountEntity } {
  const logger = new Logger({});
  const idTokenClaims = response.id_token
    ? AuthToken.extractTokenClaims(response.id_token, base64Decode)
    : undefined;
  const clientInfo = response.client_info || '';

  const homeAccountId = AccountEntity.generateHomeAccountId(
    clientInfo,
    authority.authorityType,
    logger,
    { base64Decode } as ICrypto,
    idTokenClaims
  );

  const claimsTenantId = idTokenClaims?.tid;
  const account = buildAccountToCache(
    { getAccount: () => null, getAccountKeys: () => [] } as any, // TODO - need better way to Mock CacheManager
    authority,
    homeAccountId,
    base64Decode,
    idTokenClaims,
    clientInfo,
    authority.hostnameAndPort,
    claimsTenantId,
    undefined, // authCodePayload
    undefined, // nativeAccountId
    logger
  );

  const key = account.generateAccountKey();

  return { key, value: account };
}

export function createCachableIdToken(
  response: ExternalTokenResponse,
  homeAccountId: string,
  environment: string,
  clientId: string,
  tenantId: string
): { key: string; value: IdTokenEntity } | null {
  if (!response.id_token) {
    return null;
  }

  const idTokenEntity = CacheHelpers.createIdTokenEntity(
    homeAccountId,
    environment,
    response.id_token,
    clientId,
    tenantId
  );

  const key = CacheHelpers.generateCredentialKey(idTokenEntity);

  return { key, value: idTokenEntity };
}

export function createCachableAccessToken(
  response: ExternalTokenResponse,
  homeAccountId: string,
  environment: string,
  tenantId: string,
  clientId: string,
  scopes: ScopeSet,
  expiresIn: number,
  extendedExpiresIn: number
): { key: string; value: AccessTokenEntity } | null {
  if (!response.access_token) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresOn = now + expiresIn;
  const extendedExpiresOn = now + extendedExpiresIn;

  const accessTokenEntity = CacheHelpers.createAccessTokenEntity(
    homeAccountId,
    environment,
    response.access_token,
    clientId,
    tenantId,
    scopes.printScopes(),
    expiresOn,
    extendedExpiresOn,
    base64Decode
  );

  const key = CacheHelpers.generateCredentialKey(accessTokenEntity);

  return { key, value: accessTokenEntity };
}

export function createCachableRefreshToken(
  response: ExternalTokenResponse,
  homeAccountId: string,
  environment: string,
  clientId: string
): {
  key: string;
  value: RefreshTokenEntity;
} | null {
  if (!response.refresh_token) {
    return null;
  }

  const refreshTokenEntity = CacheHelpers.createRefreshTokenEntity(
    homeAccountId,
    environment,
    response.refresh_token,
    clientId,
    response.foci,
    undefined, // userAssertionHash
    response.refresh_token_expires_in
  );

  const key = CacheHelpers.generateCredentialKey(refreshTokenEntity);

  return { key, value: refreshTokenEntity };
}
