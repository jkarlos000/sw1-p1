# 🚀 GUÍA PASO A PASO: Ejecutar Flutter Screens

## 📋 Requisitos Previos

- ✅ PostgreSQL instalado y ejecutándose
- ✅ Node.js v18+ instalado
- ✅ Angular CLI instalado
- ✅ Git (para cambios)

Verificar:
```powershell
psql --version        # PostgreSQL
node --version        # Node.js
npm --version         # NPM
ng version           # Angular
```

---

## ⚙️ PASO 1: Aplicar Migración a Base de Datos (5 min)

### Opción A: Usando psql CLI (Recomendado)

1. **Abrir terminal:**
   ```powershell
   cd c:\work\U\jk\backend-p1sw1\database
   ```

2. **Ejecutar migración:**
   ```powershell
   psql -U postgres -d tu_nombre_base_datos -f migration-flutter-screens.sql
   ```

3. **Verificar que se creó:**
   ```powershell
   psql -U postgres -d tu_nombre_base_datos -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'flutter%';"
   ```

   Debe devolver:
   ```
   table_name
   ─────────────────────────
   flutter_component
   flutter_screen
   ```

### Opción B: Usando pgAdmin (Visual)

1. **Abrir pgAdmin**
2. **Conectarse a tu base de datos**
3. **Abrir "Query Tool"**
4. **Copiar contenido de:**
   ```
   c:\work\U\jk\backend-p1sw1\database\migration-flutter-screens.sql
   ```
5. **Pegar en Query Tool**
6. **Ejecutar (F5 o Play button)**
7. **Debe mostrar: "Query returned successfully"**

### Opción C: Psql Interactivo

```powershell
# Conectarse a BD
psql -U postgres -d tu_base_datos

# Dentro de psql:
\i 'c:\work\U\jk\backend-p1sw1\database\migration-flutter-screens.sql'

# Verificar tablas
\dt flutter*

# Salir
\q
```

---

## ⚙️ PASO 2: Backend Setup (5 min)

### 2.1 Verificar conexión a BD

```powershell
# Ir a backend
cd c:\work\U\jk\backend-p1sw1

# Ver config de BD
cat .\database\config.ts
```

Asegúrate que coincida con tu BD:
```typescript
{
  user: "postgres",        // Tu usuario
  password: "tu_password", // Tu contraseña
  host: "localhost",
  port: 5432,
  database: "tu_base_datos" // Tu BD
}
```

### 2.2 Compilar TypeScript

```powershell
cd c:\work\U\jk\backend-p1sw1

# Compilar (sin errores)
npx tsc --noEmit

# Debe devolver: (sin output = sin errores)
```

### 2.3 Iniciar Backend

```powershell
cd c:\work\U\jk\backend-p1sw1

# Método 1: npm start
npm run start

# Método 2: node directo
node index.js

# Método 3: ts-node (si está instalado)
npx ts-node index.ts
```

**Esperar logs:**
```
✅ Server listening on port 3001
✅ Database connected
```

---

## ⚙️ PASO 3: Frontend Setup (2 min)

### 3.1 Angular ya está listo

Angular ya detectó los cambios (hot reload activo):
```
Application bundle generation complete. [X.XXX seconds]
Page reload sent to client(s).
```

Si ves esto, significa que ya está compilado.

### 3.2 Si necesitas recargar:

```powershell
cd c:\work\U\jk\official-sw1p1

# Opción 1: Usar ng build
npx ng build

# Opción 2: Usar ng serve (si no está ejecutándose)
ng serve --open
```

**Esperar:**
```
✨ Angular build complete
➜ Local: http://localhost:4200
```

---

## 🧪 PASO 4: Testing Básico (10 min)

### Test 1: Verificar BD está conectada

**En pgAdmin o psql:**
```sql
-- Debe devolver tabla vacía (si es primera vez)
SELECT * FROM flutter_screen;

-- Debe devolver tabla vacía
SELECT * FROM flutter_component;

-- Verificar índices
SELECT indexname FROM pg_indexes 
WHERE tablename LIKE 'flutter%';
```

### Test 2: Abrir aplicación

1. **Abrir navegador:**
   ```
   http://localhost:4200
   ```

2. **Login:**
   - Email: tu_email@email.com
   - Contraseña: tu_contraseña

3. **Abrir sala colaborativa:**
   - Selecciona una sala existente O
   - Crea una nueva sala

### Test 3: Crear clase UML

1. **En pizarra UML:**
   - Click en "Nueva clase"
   - Nombre: "Empleado"
   - Agregar 3 atributos:
     - id: Integer
     - nombre: String
     - cargo: String

2. **Guardar clase:**
   - Click en clase
   - Guardar en BD
   - Ver logs: "✅ Clase guardada"

### Test 4: Generar Flutter Screen

1. **Hacer clic en clase "Empleado"**
2. **Sistema debe:**
   - Generar screen automáticamente
   - Crear en BD (logs: "✅ Flutter Screen guardado")
   - Mostrar preview

3. **Verificar en BD:**
   ```sql
   SELECT * FROM flutter_screen;
   -- Debe haber 1 registro
   
   SELECT * FROM flutter_component;
   -- Debe haber 3 registros (uno por atributo)
   ```

### Test 5: Reordenar componentes

1. **Modo edición en Flutter Preview:**
   - Activar "Modo Edición"
   
2. **Reordenar:** Cargo arriba, luego Nombre, luego ID
   
3. **Verificar:**
   - Visual cambia ✅
   - Código Dart se actualiza ✅
   - Logs muestran: "📋 Nuevo orden: cargo → nombre → id" ✅
   - BD actualizado: `SELECT * FROM flutter_component ORDER BY position;` ✅

### Test 6: Recargar página

1. **F5 en navegador**
   
2. **Volver a hacer clic en clase**
   
3. **Verificar:**
   - Orden se mantiene ✅
   - Componentes igual ✅
   - Se cargó desde BD (no se regeneró) ✅

---

## 🔄 PASO 5: Multi-Usuario (10 min)

### Setup: 2 Navegadores

1. **Navegador 1:** http://localhost:4200 (Usuario A)
2. **Navegador 2:** http://localhost:4200 (en otra ventana, Usuario B)

Ambos logueados, misma sala

### Test: Sincronización

1. **Usuario A:**
   - Abre clase "Empleado"
   - Ve Flutter Preview

2. **Usuario B:**
   - Abre MISMA clase "Empleado"
   - Ve Flutter Preview

3. **Usuario A reordena:**
   - Cargo arriba
   - Logs muestran envío WebSocket

4. **Usuario B debe ver:**
   - Preview actualizado automáticamente ✅
   - Nuevo orden: cargo, nombre, id ✅

5. **Recargar ambos:**
   - Ambos mantienen nuevo orden ✅
   - BD tiene cambios de ambos ✅

---

## 📝 VERIFICACIÓN FINAL

Ejecutar este checklist:

```sql
-- Verificar tablas existen
SELECT COUNT(*) FROM flutter_screen;   -- Debe ser ≥ 1
SELECT COUNT(*) FROM flutter_component;-- Debe ser ≥ 1

-- Verificar integridad
SELECT COUNT(*) FROM flutter_screen fs
WHERE NOT EXISTS (SELECT 1 FROM clase_uml cu WHERE cu.id_clase = fs.id_clase);
-- Debe ser 0 (sin pantallas huérfanas)

-- Ver datos
SELECT fs.id_screen, cu.nombre_clase, COUNT(fc.id_component) as componentes
FROM flutter_screen fs
LEFT JOIN flutter_component fc ON fs.id_screen = fc.id_screen
LEFT JOIN clase_uml cu ON fs.id_clase = cu.id_clase
GROUP BY fs.id_screen, cu.nombre_clase;
```

---

## 🐛 Troubleshooting

### "Migración no se ejecutó"

**Solución:**
```powershell
# Verificar archivo existe
Test-Path c:\work\U\jk\backend-p1sw1\database\migration-flutter-screens.sql

# Verificar BD existe
psql -U postgres -l

# Verificar usuario tiene permisos
psql -U postgres -d tu_db -c "CREATE TABLE test(id INT); DROP TABLE test;"
```

### "Backend no se conecta a BD"

**Verificar:**
```powershell
# Ver config actual
cat c:\work\U\jk\backend-p1sw1\database\config.ts

# Probar conexión directa
psql -U postgres -d tu_db -h localhost -p 5432
```

### "Angular no compila"

**Soluciones:**
```powershell
cd c:\work\U\jk\official-sw1p1

# Limpiar cache
rm -r node_modules
rm -r .angular

# Reinstalar
npm install

# Build
npx ng build
```

### "WebSocket no sincroniza"

**Verificar:**
```powershell
# En navegador (F12 → Network → WS)
# Debe estar conectado ws://localhost:3001

# En backend logs:
# "Socket.IO: Client connected"

# Reiniciar backend
npm run start
```

### "Datos no persisten al recargar"

**Verificar:**
```sql
-- BD tiene datos?
SELECT COUNT(*) FROM flutter_screen;

-- Componentes guardados?
SELECT COUNT(*) FROM flutter_component;

-- Ver logs del navegador (F12 → Console)
-- "✅ Flutter Screen guardado en BD"
```

---

## 📊 Logs Esperados

### Backend (Terminal)
```
✅ Server listening on port 3001
✅ Database connected
🔄 Socket.IO server initialized
📱 Guardando Flutter Screen en BD: { id_sala: 1, id_clase: 1, ... }
✅ Flutter Screen guardado en BD: { ok: true, id_screen: 1, ... }
```

### Frontend (F12 → Console)
```
📝 Generando código Dart para EmpleadoScreen
📥 Cambios recibidos del Flutter Preview: { className: "Empleado", ... }
💾 Guardando Flutter Screen en BD
✅ Flutter Screen guardado en BD: { ok: true, id_screen: 1, ... }
🔄 Regenerando código Dart inmediatamente...
📋 Nuevo orden: cargo → nombre → id
```

---

## ✅ Checklists de Validación

### ✅ BD
- [ ] Tablas flutter_screen y flutter_component existen
- [ ] Índices creados (4 índices)
- [ ] Triggers creados
- [ ] Sin pantallas huérfanas

### ✅ Backend
- [ ] TypeScript compila sin errores
- [ ] Server arranca exitosamente
- [ ] Conecta a BD
- [ ] Socket.IO inicializado

### ✅ Frontend
- [ ] Angular compila sin errores
- [ ] Hot reload activo
- [ ] Aplicación abre en http://localhost:4200
- [ ] Login funciona

### ✅ Sistema Completo
- [ ] Crear clase UML → Pantalla Flutter generada
- [ ] Reordenar componentes → Orden se guarda en BD
- [ ] Recargar página → Cambios persisten
- [ ] 2 usuarios en misma sala → Se sincronizan en tiempo real
- [ ] Código Dart muestra orden visual correcto

---

## 🎉 ¡LISTO!

Si pasaste todos los tests, el sistema está **completamente funcional**:

```
╔═════════════════════════════════════════════════════════╗
║                                                         ║
║     ✅ Flutter Screens System OPERATIONAL               ║
║                                                         ║
║     ✅ Base de Datos: OK                               ║
║     ✅ Backend: Running                                ║
║     ✅ Frontend: Loaded                                ║
║     ✅ WebSocket: Connected                            ║
║     ✅ Persistence: Working                            ║
║     ✅ Synchronization: Live                           ║
║                                                         ║
║     Ready for: PRODUCTION / TESTING                    ║
║                                                         ║
╚═════════════════════════════════════════════════════════╝
```

---

## 📚 Próximos Pasos

1. **Leer documentación:**
   - `FLUTTER_SCREENS_ARQUITECTURA.md`
   - `FLUTTER_SCREENS_FLUJOS.md`

2. **Ejecutar tests completos:**
   - `CHECKLIST_FLUTTER_SCREENS.md`

3. **Debugging cuando sea necesario:**
   - `QUERIES_DEBUGGING.sql`

4. **Mantener sistema:**
   - Respaldar BD regularmente
   - Monitorear logs
   - Actualizar según necesidades

---

*Guía creada: 2026-01-27*
*Sistema: Flutter Screens Persistence v1.0*
*Status: ✅ Listo para Producción*
