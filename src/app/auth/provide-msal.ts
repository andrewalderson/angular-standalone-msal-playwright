import { HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  EnvironmentProviders,
  InjectionToken,
  Provider,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalGuard,
  MsalGuardConfiguration,
  MsalInterceptor,
  MsalInterceptorConfiguration,
  MsalService,
} from '@azure/msal-angular';
import { Configuration, PublicClientApplication } from '@azure/msal-browser';

export enum MsalFeatureKind {
  Interceptor,
  Guard,
}

export interface MsalFeature<KindT extends MsalFeatureKind> {
  ɵkind: KindT;
  ɵproviders: Provider[];
}

function makeMsalFeature<KindT extends MsalFeatureKind>(
  kind: KindT,
  providers: Provider[]
): MsalFeature<KindT> {
  return {
    ɵkind: kind,
    ɵproviders: providers,
  };
}

export function provideMsal(
  configuration: Configuration,
  ...features: MsalFeature<MsalFeatureKind>[]
): EnvironmentProviders;
export function provideMsal(
  configuration: InjectionToken<Configuration>,
  ...features: MsalFeature<MsalFeatureKind>[]
): EnvironmentProviders;
export function provideMsal(
  configuration: Configuration | InjectionToken<Configuration>,
  ...features: MsalFeature<MsalFeatureKind>[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    MsalBroadcastService,
    MsalService,
    {
      provide: MSAL_INSTANCE,
      useFactory: () =>
        new PublicClientApplication(
          unwrapInjectionTokenIfNeeded(configuration)
        ),
    },
    features.map((feature) => feature.ɵproviders),
  ]);
}

export function withInterceptor(
  configuration: MsalInterceptorConfiguration
): MsalFeature<MsalFeatureKind.Interceptor>;
export function withInterceptor(
  configuration: InjectionToken<MsalInterceptorConfiguration>
): MsalFeature<MsalFeatureKind.Interceptor>;
export function withInterceptor(
  configuration:
    | MsalInterceptorConfiguration
    | InjectionToken<MsalInterceptorConfiguration>
): MsalFeature<MsalFeatureKind.Interceptor> {
  return makeMsalFeature(MsalFeatureKind.Interceptor, [
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: () => unwrapInjectionTokenIfNeeded(configuration),
    },
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
  ]);
}

export function withGuard(
  configuration: MsalGuardConfiguration
): MsalFeature<MsalFeatureKind.Guard>;
export function withGuard(
  configuration: InjectionToken<MsalGuardConfiguration>
): MsalFeature<MsalFeatureKind.Guard>;
export function withGuard(
  configuration: MsalGuardConfiguration | InjectionToken<MsalGuardConfiguration>
): MsalFeature<MsalFeatureKind.Guard> {
  return makeMsalFeature(MsalFeatureKind.Guard, [
    MsalGuard,
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: () => unwrapInjectionTokenIfNeeded(configuration),
    },
  ]);
}

function unwrapInjectionTokenIfNeeded<T>(token: InjectionToken<T> | T): T {
  return token instanceof InjectionToken ? inject(token) : token;
}
