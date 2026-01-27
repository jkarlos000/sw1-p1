# 🔄 Flutter Screens en Diagramas Antiguos - Sincronización

## El Problema

Si tienes un diagrama UML **creado ANTES de la migración de Flutter Screens a BD**, cuando intentas editar las pantallas Flutter:
- ✅ Los cambios se ven en pantalla (cache local)
- ❌ NO se reflejan en las tablas `flutter_screen` y `flutter_component`
- ❌ Los cambios se pierden al recargar la página

**Causa raíz:** Las clases UML antiguas no tienen un registro en la tabla `flutter_screen` porque se crearon antes de que existiera esa tabla.

---

## 🔧 Soluciones

### Opción 1: Sincronización Automática (RECOMENDADA)
**Funciona automáticamente al abrir la pantalla Flutter**

Simplemente:
1. Abre tu diagrama antiguo
2. Haz clic en una clase para ver su Flutter Screen
3. El sistema detectará automáticamente que no existe en BD
4. **Sincronizará la clase** creando un registro vacío en `flutter_screen`
5. Generará el Flutter Screen y lo guardará en BD
6. A partir de ahí, todos los cambios persisten

**Indicadores en la consola:**
```
🔍 Buscando Flutter Screen en BD para id_clase: 5
ℹ️ No hay Flutter Screen en BD, sincronizando clase antigua...
🔄 Iniciando sincronización para diagrama antiguo...
✅ Clase sincronizada exitosamente
   - ID Screen: 42
   - Listo para usar: true
✅ Flutter Screen generado exitosamente
🎯 Componentes generados: 8
```

---

### Opción 2: Sincronización Manual por Clase
**Si quieres sincronizar una clase específica manualmente**

#### Desde el Frontend (Interfaz)
1. Abre el diagrama antiguo
2. Haz clic en la clase que quieres sincronizar
3. En la consola de developer tools verás:
   ```
   🔄 Iniciando sincronización para diagrama antiguo...
   POST /api/v1/flutter-screen/sincronizar/[id_sala]/[id_clase]
   ```
4. El endpoint responde con:
   ```json
   {
     "ok": true,
     "mensaje": "Clase sincronizada - Flutter Screen creado vacío",
     "id_screen": 42,
     "id_clase": 5,
     "ya_existe": false,
     "listo_para_usar": true
   }
   ```

#### Desde Postman/cURL
```bash
curl -X POST http://localhost:3001/api/v1/flutter-screen/sincronizar/[id_sala]/[id_clase]
```

**Variables:**
- `[id_sala]`: ID de la sala (ej: 1)
- `[id_clase]`: ID de la clase UML (ej: 5)

**Respuesta exitosa:**
```json
{
  "ok": true,
  "mensaje": "Clase sincronizada - Flutter Screen creado vacío",
  "id_screen": 42,
  "id_clase": 5,
  "ya_existe": false,
  "listo_para_usar": true
}
```

---

### Opción 3: Migración Masiva Completa
**Sincronizar TODAS las clases de una sala de una vez**

Ideal si tienes múltiples clases antiguas en la misma sala.

#### Desde Postman/cURL
```bash
curl -X POST http://localhost:3001/api/v1/flutter-screen/migrar-sala/[id_sala]
```

**Variables:**
- `[id_sala]`: ID de la sala (ej: 1)

**Respuesta:**
```json
{
  "ok": true,
  "mensaje": "Migración completada: 7/7 clases sincronizadas",
  "migraciones_realizadas": 7,
  "clases_migrantes": [
    {"id_clase": 1, "nombre": "Usuario"},
    {"id_clase": 2, "nombre": "Producto"},
    {"id_clase": 5, "nombre": "Pedido"},
    ...
  ],
  "listo_para_usar": true
}
```

#### Desde Node.js/TypeScript
```typescript
// En tu aplicación frontend
this.clasePersistenciaService.migrarSalaCompleta(idSala).subscribe({
  next: (resp) => {
    console.log(`✅ ${resp.migraciones_realizadas} clases sincronizadas`);
    // Recargar la sala
    window.location.reload();
  },
  error: (err) => {
    console.error('Error migrando sala:', err);
  }
});
```

---

## 📋 Diferencias: Nuevo vs Antiguo

| Aspecto | Diagrama Nuevo | Diagrama Antiguo |
|---------|---|---|
| **Cómo se crea** | Después de la migración | Antes de la migración |
| **Registro en `flutter_screen`** | ✅ Se crea automáticamente | ❌ No existe |
| **Persistencia** | ✅ Inmediata | ❌ Solo cache |
| **Cambios se pierden al recargar** | ❌ No | ✅ Sí (sin sincronización) |
| **Sincronización** | Automática | ⚙️ Requiere sincronizar primero |
| **Cómo activar** | Solo usar | Opción 1, 2 o 3 arriba |

---

## 🔍 Verificar Estado de tu Diagrama

### En la Base de Datos

**¿Tiene Flutter Screen registrado?**
```sql
SELECT id_screen, id_clase, nombre_screen, fecha_creacion
FROM flutter_screen
WHERE id_clase = [tu_id_clase];
```

- Si devuelve datos: ✅ Ya está sincronizado
- Si no devuelve nada: ❌ Necesita sincronización

### En la Consola del Navegador
Abre Developer Tools (F12) → Pestaña Console

**Si ves estos mensajes:**
```
✅ Flutter Screen cargado desde BD
```
→ Todo está bien, sigue funcionando

```
🔍 Buscando Flutter Screen en BD para id_clase: 5
ℹ️ No hay Flutter Screen en BD, sincronizando clase antigua...
🔄 Iniciando sincronización para diagrama antiguo...
✅ Clase sincronizada exitosamente
```
→ Se está sincronizando automáticamente (espera a que termine)

---

## ⚡ Después de Sincronizar

Una vez que tu diagrama antiguo está sincronizado:

1. ✅ **Edita la pantalla Flutter** (reorder, cambiar etiquetas, etc.)
2. ✅ **Los cambios se guardan en BD** automáticamente
3. ✅ **Se sincronizan a otros usuarios** vía WebSocket
4. ✅ **Recargar la página mantiene todo** (persiste en BD)

---

## 🐛 Troubleshooting

### P: Sincronicé pero los cambios AÚN no persisten
**R:** 
1. Abre la consola (F12) y verifica los logs
2. Si ves error 500 en `guardarFlutterScreen`, revisa los logs del backend
3. Intenta sincronizar de nuevo (Opción 1: simplemente abre la pantalla)

### P: No veo los cambios reflejados en las otras pantallas colaborativas
**R:**
1. Verifica que el WebSocket está conectado (console debe mostrar eventos `flutterScreenCambios`)
2. Asegúrate de que completó la sincronización (ver logs ✅)
3. Los cambios se sincronizan después de que se guarden en BD (puede tomar 1-2 segundos)

### P: ¿Perderé mis cambios actuales si sincronizo?
**R:** No, la sincronización solo crea un registro vacío en BD. Si ya tenías cambios:
1. El cache local los mantiene
2. Al sincronizar, se generará el Flutter Screen
3. Los cambios que ya habías hecho se guardarán en BD

### P: ¿Puedo sincronizar parcialmente?
**R:** Sí:
- **Opción 1:** Una clase a la vez (abre cada una)
- **Opción 2:** Una clase específica (manual)
- **Opción 3:** Todas de la sala (masivo)

---

## 📊 Arquitectura de Sincronización

```
┌─────────────────────────────────────┐
│ Diagrama Antiguo (sin Flutter_screen)│
└────────────┬────────────────────────┘
             │
             ├─→ Abres clase
             │
             ├─→ Buscas Flutter Screen en BD
             │   └─→ No existe ❌
             │
             └─→ POST /flutter-screen/sincronizar/{id_sala}/{id_clase}
                 │
                 ├─→ Crea registro vacío en flutter_screen
                 ├─→ Retorna id_screen
                 │
                 └─→ Genera Flutter Screen completo
                     │
                     ├─→ Componentes en cache + BD
                     └─→ Listo para usar ✅

┌──────────────────────────────────┐
│ Diagrama Sincronizado (con BD)   │
└──────────────────────────────────┘
             │
             ├─→ Editas componentes
             │
             └─→ POST /flutter-screen/save
                 │
                 ├─→ Guarda en BD
                 ├─→ Emit WebSocket
                 │
                 └─→ Otros usuarios ven cambios ✅
```

---

## 📞 Resumen Rápido

| Situación | Acción |
|-----------|--------|
| **Diagrama antiguo, primera vez** | Opción 1 (automática) |
| **Muchos diagramas antiguos** | Opción 3 (masivo) |
| **Una clase específica** | Opción 2 (manual) |
| **Verificar que funciona** | Consulta SQL de la BD |
| **Cambios no persisten** | Revisa consola, logs backend |

