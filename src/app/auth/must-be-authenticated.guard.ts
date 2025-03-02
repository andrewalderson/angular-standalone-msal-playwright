import { InjectionToken, inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

export const MUST_BE_AUTHENTICATED_TO_ACTIVATE = new InjectionToken(
  'mustBeAuthenticatedToActivate',
  {
    providedIn: 'root',
    factory:
      () => (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
        inject(MsalGuard).canActivate(route, state),
  }
);

export const MUST_BE_AUTHENTICATED_TO_ACTIVATE_CHILD = new InjectionToken(
  'mustBeAuthenticatedToActivateChild',
  {
    providedIn: 'root',
    factory:
      () => (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
        inject(MsalGuard).canActivateChild(route, state),
  }
);

export const MUST_BE_AUTHENTICATED_TO_MATCH = new InjectionToken(
  'mustBeAuthenticatedToMatch',
  {
    providedIn: 'root',
    factory: () => () => inject(MsalGuard).canMatch(),
  }
);