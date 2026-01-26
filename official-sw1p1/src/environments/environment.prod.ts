/**
 * Configuración para PRODUCCIÓN (Docker/VPS)
 * 
 * Cuando ejecutas `npm run build`, Angular usa este archivo.
 * Se despliega en Docker con nginx + backend en uml.jkhoster.com
 * 
 * Comandos:
 * - Build: npm run build
 * - Deploy: docker-compose build frontend
 */

export const environment = {
  production: true,
  apiUrl: 'https://uml.jkhoster.com/api',
  wsUrl: 'https://uml.jkhoster.com'
};
