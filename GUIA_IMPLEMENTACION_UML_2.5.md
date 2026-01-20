# 🚀 Guía de Implementación - Editor UML 2.5

## 📋 Pasos para Activar la Funcionalidad

### 1️⃣ **Actualizar Base de Datos**

```bash
# Conectar a PostgreSQL
psql -U postgres -d nombre_de_tu_base_de_datos

# Ejecutar el schema de UML 2.5
\i backend-p1sw1/database/uml-metodos-schema.sql

# Verificar que las tablas se crearon
\dt
```

**Tablas esperadas:**
- ✅ `clase_uml`
- ✅ `atributo_clase`
- ✅ `metodo_clase`
- ✅ `parametro_metodo`

---

### 2️⃣ **Configurar Backend**

```bash
cd backend-p1sw1
npm install
npm run dev
```

**Verificar que el servidor esté corriendo:**
```bash
curl http://localhost:3000/health
# Respuesta esperada: {"ok":true,"status":"healthy",...}
```

**Nuevos endpoints disponibles:**
- `POST /uml/clase` - Guardar clase
- `POST /uml/clases` - Guardar múltiples clases
- `GET /uml/clases/:id_sala` - Obtener clases de una sala
- `DELETE /uml/clase/:id_sala/:cell_id` - Eliminar clase

---

### 3️⃣ **Configurar Frontend**

```bash
cd official-sw1p1

# Instalar dependencias (si no están instaladas)
npm install

# Iniciar servidor de desarrollo
ng serve
```

**Verificar compilación:**
- ✅ Sin errores TypeScript
- ✅ `UmlClassEditorComponent` importado correctamente
- ✅ `ClaseUmlService` inyectado

---

### 4️⃣ **Probar la Funcionalidad**

#### **Paso 1: Crear una sala**
1. Ir a `http://localhost:4200`
2. Iniciar sesión o registrarse
3. Crear una nueva sala o unirse a una existente

#### **Paso 2: Agregar una clase UML**
1. En el diagramador, arrastrar una clase desde el stencil (panel izquierdo)
2. La clase aparecerá en el canvas

#### **Paso 3: Abrir el Editor UML 2.5**
1. **Hacer clic en la clase** → Se abre el panel del editor UML 2.5 en el lado derecho
2. El editor muestra:
   - Nombre de la clase (editable)
   - Panel de atributos
   - Panel de métodos

#### **Paso 4: Agregar atributos**
1. Clic en **"+ Agregar Atributo"**
2. Completar:
   - **Nombre**: `nombre`
   - **Tipo**: `String`
   - **Visibilidad**: `private` (-)
   - **Valor por defecto** (opcional): `"Sin nombre"`
3. Repetir para más atributos

**Ejemplo:**
```
- nombre : String = "Sin nombre"
- email : String
+ id : Number
```

#### **Paso 5: Agregar métodos**
1. Clic en **"+ Agregar Método"**
2. Completar:
   - **Nombre**: `validarEmail`
   - **Tipo de Retorno**: `Boolean`
   - **Visibilidad**: `public` (+)
3. Agregar parámetros:
   - Clic en **"+ Agregar Parámetro"**
   - **Nombre**: `email`, **Tipo**: `String`

**Ejemplo:**
```
+ validarEmail(email : String) : Boolean
+ getNombre() : String
- calcularEdad(fechaNacimiento : Date) : Number
```

#### **Paso 6: Ver el renderizado**
La clase en el diagrama se actualiza automáticamente con el formato UML 2.5:

```
Usuario
──────────────────────────────
- nombre : String
- email : String
+ id : Number
───────────────────────────────
+ validarEmail(email : String) : Boolean
+ getNombre() : String
- calcularEdad(fechaNacimiento : Date) : Number
```

---

## 🧪 Verificar Persistencia en Base de Datos

### **Consultas SQL para validar:**

```sql
-- Ver todas las clases guardadas
SELECT * FROM clase_uml;

-- Ver atributos de una clase específica
SELECT * FROM atributo_clase WHERE id_clase = 1;

-- Ver métodos de una clase específica
SELECT m.nombre, m.tipo_retorno, m.visibility
FROM metodo_clase m
WHERE m.id_clase = 1;

-- Ver parámetros de un método específico
SELECT p.nombre, p.tipo, p.orden_parametro
FROM parametro_metodo p
WHERE p.id_metodo = 1
ORDER BY p.orden_parametro;

-- Consulta completa: Clase con todos sus datos
SELECT 
  c.nombre_clase,
  a.nombre AS atributo_nombre,
  a.tipo AS atributo_tipo,
  a.visibility AS atributo_visibility,
  m.nombre AS metodo_nombre,
  m.tipo_retorno,
  m.visibility AS metodo_visibility,
  p.nombre AS param_nombre,
  p.tipo AS param_tipo
FROM clase_uml c
LEFT JOIN atributo_clase a ON c.id_clase = a.id_clase
LEFT JOIN metodo_clase m ON c.id_clase = m.id_clase
LEFT JOIN parametro_metodo p ON m.id_metodo = p.id_metodo
WHERE c.id_sala = 1;
```

---

## 🐛 Solución de Problemas

### **Problema 1: El editor no se abre al hacer clic en la clase**

**Causa:** El listener de eventos no está registrado.

**Solución:**
1. Abrir consola del navegador (F12)
2. Verificar errores en `diagramador.component.ts`
3. Revisar que `this.rappid.paper` esté inicializado antes de agregar el listener

```typescript
// Verificar en ngOnInit()
this.rappid.paper.on('cell:pointerclick', (cellView: any) => {
  console.log('🖱️ Clic detectado:', cellView.model.get('type'));
  // Debería imprimir: "🖱️ Clic detectado: app.RectangularModel"
});
```

---

### **Problema 2: Error 404 en las APIs de backend**

**Causa:** Las rutas no están registradas en `router.ts`.

**Solución:**
```bash
# Verificar que el backend tenga las rutas registradas
curl http://localhost:3000/uml/clases/1
# Si devuelve 404, revisar backend-p1sw1/routes/router.ts
```

**Verificar importaciones:**
```typescript
// En router.ts
import {
  guardarClaseUML,
  obtenerClasesUML,
  eliminarClaseUML,
  guardarClasesMultiples
} from "../controller/clase-uml.controller";
```

---

### **Problema 3: Error al guardar en base de datos**

**Causa:** Las tablas no existen o hay problemas de permisos.

**Solución:**
```sql
-- Verificar que las tablas existan
\dt

-- Si no existen, ejecutar:
\i backend-p1sw1/database/uml-metodos-schema.sql

-- Verificar permisos del usuario
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tu_usuario;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tu_usuario;
```

---

### **Problema 4: Los cambios no se sincronizan entre usuarios**

**Causa:** WebSocket no está emitiendo el evento `modificar-diagrama`.

**Solución:**
```typescript
// Verificar en diagramador.component.ts > actualizarTextoClase()
if (this.rappid && this.rappid.graph) {
  const jsonDiagrama = this.rappid.graph.toJSON();
  this.diagramadorService.wsService.emit('modificar-diagrama', {
    sala: this.nombreSala,
    diagrama: jsonDiagrama
  });
  console.log('🔄 Diagrama sincronizado via WebSocket');
}
```

---

## 📊 Ejemplo de Uso Completo

### **Caso de Uso: Sistema de Autenticación**

#### **1. Crear clase "Usuario"**
```
Usuario
──────────────────────────────
- id : Number
- email : String
- password : String
- nombre : String
───────────────────────────────
+ validarEmail(email : String) : Boolean
+ hashPassword(password : String) : String
+ verificarPassword(password : String) : Boolean
+ getToken() : String
```

#### **2. Crear clase "Sesion"**
```
Sesion
──────────────────────────────
- id : Number
- idUsuario : Number
- token : String
- fechaExpiracion : Date
───────────────────────────────
+ esValida() : Boolean
+ renovar() : void
+ cerrar() : void
```

#### **3. Verificar en BD**
```sql
-- Debería retornar 2 clases
SELECT COUNT(*) FROM clase_uml WHERE id_sala = 1; -- 2

-- Debería retornar 8 atributos (4 por clase)
SELECT COUNT(*) FROM atributo_clase WHERE id_clase IN (SELECT id_clase FROM clase_uml WHERE id_sala = 1); -- 8

-- Debería retornar 7 métodos (4 + 3)
SELECT COUNT(*) FROM metodo_clase WHERE id_clase IN (SELECT id_clase FROM clase_uml WHERE id_sala = 1); -- 7
```

---

## 🎯 Próximos Pasos

Después de verificar que todo funciona correctamente:

1. ✅ **Implementar carga inicial**: Al abrir una sala, cargar clases desde BD
2. ✅ **Agregar validaciones**: Verificar que los tipos de datos sean válidos
3. ✅ **Exportar código**: Generar TypeScript/Java desde las clases UML
4. ✅ **Agregar relaciones**: Soportar herencia, composición y asociaciones
5. ✅ **Historial de cambios**: Implementar undo/redo en el editor

---

## 📞 Soporte

Si encuentras algún problema:

1. **Revisar la consola del navegador** (F12 → Console)
2. **Revisar los logs del backend** (terminal donde corre `npm run dev`)
3. **Verificar las consultas SQL** usando `psql` o pgAdmin
4. **Revisar la documentación**:
   - `INTEGRACION_EDITOR_UML.md`
   - `SOPORTE_UML_2.5.md`
   - `GUIA_EDITOR_UML_2.5.md`

---

## ✅ Checklist de Verificación

Antes de considerar la implementación completa, verificar:

- [ ] ✅ Base de datos con 4 tablas nuevas creadas
- [ ] ✅ Backend corriendo sin errores en puerto 3000
- [ ] ✅ Frontend compilando sin errores TypeScript
- [ ] ✅ Clic en clase abre el editor UML 2.5
- [ ] ✅ Agregar atributo actualiza el diagrama visualmente
- [ ] ✅ Agregar método con parámetros funciona correctamente
- [ ] ✅ Los cambios se guardan en PostgreSQL
- [ ] ✅ Los cambios se sincronizan via WebSocket con otros usuarios
- [ ] ✅ La clase renderiza con formato UML 2.5 correcto

---

## 🎉 ¡Felicitaciones!

Si todos los pasos se completaron exitosamente, ahora tienes un **sistema UML colaborativo con soporte completo para UML 2.5**, incluyendo:

- 🎨 **Editor visual** para atributos y métodos
- 💾 **Persistencia** en base de datos PostgreSQL
- 🔄 **Sincronización en tiempo real** via WebSocket
- 📝 **Renderizado UML 2.5** con visibilidad y tipos
- 🧪 **APIs REST** para operaciones CRUD

**¡A diagramar!** 🚀
