import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { readModeFromSearch } from '@ag/domain';
import { DEFI_DEFINITIONS, GameStore } from '@ag/state';
import { DEFINITIONS } from './definitions';
import { routes } from './routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation(), withComponentInputBinding()),
    provideAppInitializer(() => {
      inject(GameStore).mode.set(readModeFromSearch(window.location.search));
    }),
    { provide: DEFI_DEFINITIONS, useValue: DEFINITIONS },
  ],
};
