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
// IMPORTANTE: Esta URL será reemplazada por ConfigService.loadConfig()
const config: SocketIoConfig = { 
  url: 'https://uml.jkhoster.com', 
  options: {
    autoConnect: false, // No conectar automáticamente hasta que se cargue la config
    transports: ['websocket', 'polling']
  } 
};

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
