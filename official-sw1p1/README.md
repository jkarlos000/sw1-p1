# Frontend - Sistema UML Colaborativo

Aplicación Angular 18 con editor UML colaborativo en tiempo real, chat con IA y generación de código.

## 🚀 Inicio Rápido

```bash
npm install
npm start
```

Abrir navegador en `http://localhost:4200`

## 💻 Stack Tecnológico

- **Angular 18** - Framework (Standalone Components)
- **Signals API** - Estado reactivo
- **JointJS/Rappid** - Editor UML
- **Tailwind CSS** - Estilos
- **Socket.IO Client** - WebSockets tiempo real

## 📁 Estructura

```
src/app/
├── auth/               # Login y registro
├── diagramador/        # Editor UML principal
│   ├── chat-ia/        # Chat con IA integrado
│   ├── services/       # Servicios (websocket, rappid, chat-ia)
│   └── interfaces/     # Tipos TypeScript
├── chat/               # Chat general
└── chatsw1/            # Salas de chat
```

## ⚙️ Configuración

**Archivo:** `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  socketUrl: 'http://localhost:3000'
};
```

## ✨ Funcionalidades Principales

### Editor UML
- **Clases UML**: Crear, editar, eliminar con atributos
- **Relaciones**: Herencia, composición, agregación, asociación, dependencia
- **Colaboración tiempo real**: Múltiples usuarios editando simultáneamente
- **Grid inteligente**: Posicionamiento automático 3x∞
- **Persistencia**: Guardado automático en base de datos

### Chat con IA
- **Análisis de diagramas**: IA entiende estructura UML
- **Modificaciones automáticas**: Agregar/eliminar clases y relaciones
- **Sugerencias**: Mejoras de diseño y patrones
- **Historial**: Conversaciones guardadas por sala

### Exportación
- **Spring Boot**: Genera proyecto completo (JPA, servicios, controladores)
- **XML (EA)**: Exporta a Enterprise Architect
- **JSON**: Formato JointJS
- **Postman**: Colección API REST generada por IA

## 🎯 Componentes Clave

### DiagramadorComponent
- Editor principal JointJS/Rappid
- Eventos de modificación (drag, resize, edit)
- Sincronización WebSocket
- Integración con chat IA

### ChatIaComponent
- Interface de chat
- Envío de contexto de diagrama
- Procesamiento de modificaciones IA
- Historial de conversaciones

### DiagramadorService
- Emisión de eventos WebSocket
- Gestión de sala
- Sincronización de cambios

### ChatIaService
- Comunicación HTTP con backend
- Manejo de mensajes
- Escucha de modificaciones IA

## 🛠️ Herramientas del Editor

| Botón | Función |
|--------|----------|
| **Clear Paper** | Limpiar diagrama (sincronizado) |
| **QR** | Generar QR de sala |
| **Export JSON** | Exportar diagrama JointJS |
| **Importar JSON** | Importar diagrama |
| **Importar XML** | Importar desde EA |
| **Exportar XML** | Exportar a EA |
| **Spring Boot** | Generar proyecto backend |
| **Exportar Colección** | Generar Postman con IA |
