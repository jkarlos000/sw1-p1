# Estructura de Base de Datos - Backend P1SW1

## Base de Datos
- **Nombre**: `parcial1sw1`
- **Motor**: PostgreSQL
- **Puerto**: 5432

## Tablas

### 1. `usuario`
Almacena los usuarios registrados en el sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id_usuario | SERIAL | PRIMARY KEY | Identificador único del usuario |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Correo electrónico del usuario |
| password | VARCHAR(255) | NOT NULL | Contraseña del usuario |
| fecha_creacion | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de registro |

### 2. `sala`
Almacena las salas de trabajo creadas por los usuarios.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id_sala | SERIAL | PRIMARY KEY | Identificador único de la sala |
| nombre_sala | VARCHAR(255) | NOT NULL, UNIQUE | Nombre de la sala |
| host_sala | VARCHAR(255) | NOT NULL, FK → usuario(email) | Email del creador de la sala |
| informacion | TEXT | NULL | Información o descripción de la sala |
| fecha_creacion | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

### 3. `asistencia`
Registra la participación de usuarios en salas específicas.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id_asistencia | SERIAL | PRIMARY KEY | Identificador único de la asistencia |
| id_usuario | INTEGER | NOT NULL, FK → usuario(id_usuario) | ID del usuario asistente |
| id_sala | INTEGER | NOT NULL, FK → sala(id_sala) | ID de la sala |
| fecha_hora | TIMESTAMP | NOT NULL | Fecha y hora de registro |

**Restricción única**: Un usuario solo puede registrarse una vez por sala (`UNIQUE(id_usuario, id_sala)`).

## Instalación

### Opción 1: Usando psql (línea de comandos)

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE parcial1sw1;

# Conectar a la base de datos
\c parcial1sw1

# Ejecutar el script de creación
\i database/schema.sql

# (Opcional) Insertar datos de ejemplo
\i database/seed.sql
```

### Opción 2: Usando pgAdmin

1. Abre pgAdmin
2. Crea una nueva base de datos llamada `parcial1sw1`
3. Abre el Query Tool
4. Copia y ejecuta el contenido de `schema.sql`
5. (Opcional) Ejecuta `seed.sql` para datos de ejemplo

### Opción 3: Desde PowerShell

```powershell
# Asegúrate de tener psql en tu PATH
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE parcial1sw1;"

# Ejecutar el script de creación
psql -U postgres -d parcial1sw1 -f database/schema.sql

# (Opcional) Insertar datos de ejemplo
psql -U postgres -d parcial1sw1 -f database/seed.sql
```

## Relaciones

```
usuario (1) ----< (N) sala
    |                   |
    |                   |
    └------ (N) asistencia (N) ------┘
```

- Un **usuario** puede crear múltiples **salas** (relación 1:N)
- Un **usuario** puede asistir a múltiples **salas** (relación N:M a través de asistencia)
- Una **sala** puede tener múltiples **usuarios** asistentes (relación N:M a través de asistencia)

## Índices

Se crearon índices en los siguientes campos para mejorar el rendimiento:
- `usuario.email`
- `sala.nombre_sala`
- `sala.host_sala`
- `asistencia.id_usuario`
- `asistencia.id_sala`

## Mantenimiento

### Limpiar todas las tablas
```sql
TRUNCATE TABLE asistencia, sala, usuario RESTART IDENTITY CASCADE;
```

### Eliminar todas las tablas
```bash
psql -U postgres -d parcial1sw1 -f database/drop-tables.sql
```

## Notas

- Las contraseñas se almacenan en texto plano. **IMPORTANTE**: En producción deberían estar hasheadas (bcrypt, argon2, etc.)
- Las foreign keys tienen `ON DELETE CASCADE` para mantener integridad referencial
- La tabla `asistencia` tiene una restricción única para evitar duplicados
