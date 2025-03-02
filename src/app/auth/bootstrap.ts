import { makeEnvironmentProviders } from '@angular/core';
import { _MSAL_CONFIG } from './tokens';

/**
 * This function is used when a config file needs to be loaded
 * before `bootstrapApplication` is called in main.ts
 * It creates am InjectionToken containing the content
 * of the config file.
 * This token is used in other tokens to extract the config data
 * they need.
 */
export async function bootstrapMsalProviders(configPath: string) {
  const response = await fetch(configPath);
  // TODO - should we use zod here to validate the schema of the config file?
  const config = await response.json();

  return makeEnvironmentProviders([
    { provide: _MSAL_CONFIG, useValue: config },
  ]);
}