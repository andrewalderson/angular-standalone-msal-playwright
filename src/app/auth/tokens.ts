import { InjectionToken, inject } from '@angular/core';
import {
    MsalGuardConfiguration,
    MsalInterceptorConfiguration,
} from '@azure/msal-angular';
import { Configuration, LogLevel } from '@azure/msal-browser';

function loggerCallback(
  logLevel: LogLevel,
  message: string,
  containsPii: boolean
) {
  if (containsPii) {
    return;
  }
  switch (logLevel) {
    case LogLevel.Error:
      console.error(message);
      break;
    case LogLevel.Info:
       
      console.info(message);
      break;
    case LogLevel.Verbose:
       
      console.debug(message);
      break;
    case LogLevel.Warning:
      console.warn(message);
      break;
    case LogLevel.Trace:
      console.trace(message);
      break;
  }
}

type MsalConfig = Configuration & {
  guard: MsalGuardConfiguration;
} & {
  interceptor: MsalInterceptorConfiguration;
};

/**
 * These tokens should be considered private and are only used to configure msal
 * We start them with an underscore so they don;t conflict
 * with the tokens in the msal angualr library
 */
export const _MSAL_CONFIG = new InjectionToken<MsalConfig>('_MSAL_CONFIG');

export const _MSAL_INSTANCE_CONFIG = new InjectionToken<Configuration>(
  '_MSAL_INSTANCE_CONFIG',
  {
    providedIn: 'root',
    factory: () => {
      const configuration = inject(_MSAL_CONFIG);
      return {
        auth: configuration.auth,
        cache: configuration.cache,
        system: {
          ...configuration.system,
          loggerOptions: {
            ...configuration.system?.loggerOptions,
            loggerCallback: loggerCallback,
          },
        },
      };
    },
  }
);
// MSAL already has a token called 'MSAL_GUARD_CONFIG' so don't use that
export const _MSAL_GUARD_CONFIG = new InjectionToken<MsalGuardConfiguration>(
  '_MSAL_GUARD_CONFIG',
  {
    providedIn: 'root',
    factory: () => inject(_MSAL_CONFIG).guard,
  }
);

export const _MSAL_INTERCEPTOR_CONFIG =
  new InjectionToken<MsalGuardConfiguration>('_MSAL_INTERCEPTOR_CONFIG', {
    providedIn: 'root',
    factory: () => {
      const configuration = inject(_MSAL_CONFIG).interceptor;
      return {
        interactionType: configuration.interactionType,
        protectedResourceMap: new Map(configuration.protectedResourceMap),
      };
    },
  });