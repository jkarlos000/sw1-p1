/**
 * Database Configuration
 * Configuración de conexión a PostgreSQL
 * 
 * @author Jkarlos
 * @date 2026
 */

import { Pool } from 'pg';

export const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'parcial1sw1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
