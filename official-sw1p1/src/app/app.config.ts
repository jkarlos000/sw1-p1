import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import {
  ExtraOptions,
  provideRouter,
  withRouterConfig,
  withViewTransitions,
} from '@angular/router';

import { provideHttpClient } from '@angular/common/http';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { routes } from './app.routes';
import { ConfigService } from './common/services/config.service';

const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled',
  scrollPositionRestoration: 'enabled',
};

// Configuración temporal para Socket.IO
// Se actualizará dinámicamente cuando se cargue config.json
const config: SocketIoConfig = { url: 'http://localhost:3000', options: {} };

/**
 * Factory para inicializar la configuración antes de que arranque la app
 */
export function initializeApp(configService: ConfigService) {
  return () => configService.loadConfig();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withViewTransitions(),
      withRouterConfig(routerOptions)
    ),
    provideHttpClient(),
    importProvidersFrom(SocketIoModule.forRoot(config)),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConfigService],
      multi: true
    }
  ],
};
