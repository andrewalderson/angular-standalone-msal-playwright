import { Route } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { MUST_BE_AUTHENTICATED_TO_ACTIVATE } from './auth/must-be-authenticated.guard';

export const appRoutes: Route[] = [
  ...authRoutes,
  {
    path: '',
    canActivate: [MUST_BE_AUTHENTICATED_TO_ACTIVATE],
    loadComponent: async () =>
      (await import('./nx-welcome.component')).NxWelcomeComponent,
  },
];
