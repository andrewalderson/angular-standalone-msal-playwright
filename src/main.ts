import { provideZoneChangeDetection } from "@angular/core";
import { bootstrapApplication } from '@angular/platform-browser';
import { MsalRedirectComponent } from '@azure/msal-angular';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { bootstrapMsalProviders } from './app/auth/bootstrap';
import { environment } from './environments/environment';

/**
 * We need to load the msal config and set the _MSAL_CONFIG provider
 * here because the router has 'withEnabledBlockingInitialNavigation' set.
 * This prevents APP_INITIALIZER's from resolving until after the initial route
 * navigation. Since we have an MsalGuard on the root route we need the msal config
 * before the app is initialized. This means we can't use a APP_INITIALIZER to fetch it.
 * We will use app.config.ts for configuring the app and simply
 * fetch the config here before bootstrapping and create an InjectionToken with the config
 * The bonus in this is that the redirect for the authentication will happen
 * before the app is bootstrapped
 *
 * NOTE - we are externalizing the msal config and fetching it
 * because we need to intercept it in the Cypress tests to change some
 * of the values for the login in the tests to work and because
 * config like this should be external to the application.
 *
 * We could improve the performance of fetching the msal config by either using SSR
 * and embedding it in the index.html page or adding a Link header to
 * prefetch it. We could also do this in the CI/CD pipeline because the config is
 * the same for every user in each environment. We could also add the headers in a CDN.
 * So many options, but this is something for another day.
 *
 */
bootstrapMsalProviders(environment.msalConfigUrl).then((msalProviders) =>
  bootstrapApplication(AppComponent, {
    providers: [provideZoneChangeDetection(),appConfig.providers, msalProviders],
  })
    // this needs to be done because the MsalRedirectComponent is added to the index.html page
    // not adding this will cause the app to freeze at the signin-callback page after authentication
    .then((ref) => ref.bootstrap(MsalRedirectComponent))
    .catch((err) => console.error(err))
);
