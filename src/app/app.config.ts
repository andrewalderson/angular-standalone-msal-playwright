import {
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {
  provideRouter,
  withDisabledInitialNavigation,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
import { BrowserUtils } from '@azure/msal-browser';
import { appRoutes } from './app.routes';
import { provideMsal, withGuard, withInterceptor } from './auth/provide-msal';
import {
  _MSAL_GUARD_CONFIG,
  _MSAL_INSTANCE_CONFIG,
  _MSAL_INTERCEPTOR_CONFIG,
} from './auth/tokens';

const disableInitialNavigation =
  BrowserUtils.isInIframe() || BrowserUtils.isInPopup();

const withInitialNavigation = () =>
  disableInitialNavigation
    ? withDisabledInitialNavigation()
    : withEnabledBlockingInitialNavigation();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withInitialNavigation()),
    provideMsal(
      _MSAL_INSTANCE_CONFIG,
      withGuard(_MSAL_GUARD_CONFIG),
      withInterceptor(_MSAL_INTERCEPTOR_CONFIG)
    ),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
  ],
};
