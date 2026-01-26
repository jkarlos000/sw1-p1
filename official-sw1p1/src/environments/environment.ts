/**
 * Configuración para DESARROLLO LOCAL
 * 
 * Cuando ejecutas `ng serve`, Angular usa este archivo.
 * El backend debe estar corriendo en localhost:3000
 * 
 * Comandos:
 * - Frontend: ng serve (puerto 4200)
 * - Backend: npm run dev (puerto 3000)
 */

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  wsUrl: 'http://localhost:3000'
};
