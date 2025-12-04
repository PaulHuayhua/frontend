import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { JwtInterceptor } from './core/interceptors/jwt-interceptor';
import { routes } from './app.routes';

import { errorInterceptor } from './core/interceptors/error-interceptor';
import { GlobalErrorHandler } from './core/handlers/global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    provideHttpClient(
      withInterceptors([JwtInterceptor, errorInterceptor])
    ),

    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
