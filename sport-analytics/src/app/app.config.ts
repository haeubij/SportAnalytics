import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app.routes';

/**
 * @author Janis Häubi
 * @version 1.0.0
 * @date 07.05.2024 (KW19)
 * @purpose Konfiguration der Angular-Anwendung
 * @description Definiert die Provider, Routing- und HTTP-Konfiguration der App.
 */

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi())
  ]
};
