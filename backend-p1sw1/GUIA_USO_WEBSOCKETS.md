# Guía de Uso - Eventos WebSocket

## 🎯 Ejemplos de Uso desde el Frontend

### 1. Chat General

#### Conectarse al Chat General
```typescript
import { inject } from '@angular/core';
import { WebsocketService } from './common/services/websocket.service';

export class MiComponente {
  private wsService = inject(WebsocketService);
  
  iniciarChatGeneral() {
    const usuario = {
      id: this.wsService.socket.ioSocket.id,
      nombre: 'Juan Pérez'
    };
    
    // Emitir evento
    this.wsService.emit('init-chatGeneral', usuario);
    
    // Escuchar respuesta
    this.wsService.listen('clientes-conectados').subscribe(
      (usuarios: UsuarioDto[]) => {
        console.log('Usuarios conectados:', usuarios);
      }
    );
  }
}
```

### 2. Salas de Chat

#### Unirse a una Sala de Chat
```typescript
entrarASala() {
  const usuario = {
    id: this.wsService.socket.ioSocket.id,
    nombre: 'María García'
  };
  
  const sala = 'Sala 1';
  
  // Emitir evento
  this.wsService.emit('entra-sala', { usuario, sala });
  
  // Escuchar usuarios en la sala
  this.wsService.listen('clientes-conectados-sala').subscribe(
    (usuarios: UsuarioDto[]) => {
      console.log('Usuarios en la sala:', usuarios);
    }
  );
}
```

### 3. Salas Privadas SW1

#### Crear/Unirse a Sala Privada
```typescript
import { v4 as uuidv4 } from 'uuid';

crearSalaPrivada() {
  const usuario = {
    id: this.wsService.socket.ioSocket.id,
    nombre: 'Carlos Ruiz'
  };
  
  // Generar ID único para la sala
  const uuid = uuidv4();
  const idSala = uuid.substring(0, 8);
  
  // Emitir evento
  this.wsService.emit('init-sala-privada', { usuario, idSala });
  
  // Escuchar usuarios conectados
  this.wsService.listen('clientes-conectados-sala-privada').subscribe(
    (usuarios: UsuarioDto[]) => {
      console.log('Usuarios en sala privada:', usuarios);
    }
  );
  
  // Escuchar eventos de la sala
  this.wsService.listen('updated-eventos').subscribe(
    (eventos: string[]) => {
      console.log('Eventos de la sala:', eventos);
    }
  );
}
```

#### Agregar Evento a Sala Privada
```typescript
agregarEvento() {
  const idSala = 'abc12345';
  const evento = 'Nuevo mensaje importante';
  
  this.wsService.emit('evento-new-sp', { idSala, evento });
  
  // La respuesta llegará al listener 'updated-eventos'
}
```

#### Eliminar Evento de Sala Privada
```typescript
eliminarEvento() {
  const idSala = 'abc12345';
  const evento = 'Mensaje a eliminar';
  
  this.wsService.emit('delete-evento-sp', { idSala, evento });
  
  // La respuesta llegará al listener 'updated-eventos'
}
```

### 4. Reuniones con Base de Datos

#### Crear Nueva Reunión
```typescript
crearReunion() {
  const idUsuario = 1; // ID del usuario en la BD
  const nombreSala = 'Reunión de Proyecto';
  
  // Emitir evento
  this.wsService.emit('nueva-reunion', { 
    id: idUsuario, 
    nombre: nombreSala 
  });
  
  // Escuchar respuesta
  this.wsService.listen('nueva-reunion').subscribe(
    (response: any) => {
      if (response.ok) {
        console.log('Reunión creada:', response.sala);
        // response.sala = { id, nombre, host }
      }
    }
  );
}
```

#### Unirse a Reunión Existente
```typescript
unirseAReunion() {
  const idUsuario = 2; // ID del usuario en la BD
  const nombreSala = 'Reunión de Proyecto';
  
  // Emitir evento
  this.wsService.emit('unirse-reunion', { 
    id: idUsuario, 
    nombre: nombreSala 
  });
  
  // Escuchar respuesta personal
  this.wsService.listen('unirse-reunion').subscribe(
    (response: any) => {
      if (response.ok) {
        console.log('Unido a reunión:', response.sala);
        console.log('Colaboradores:', response.colaboradores);
      }
    }
  );
  
  // Escuchar actualizaciones broadcast
  this.wsService.listen('colaboradores-sala-trabajo').subscribe(
    (data: any) => {
      console.log('Colaboradores actualizados:', data.asistentes);
    }
  );
}
```

### 5. Sincronización de Diagramas

#### Enviar Cambios de Diagrama
```typescript
sincronizarDiagrama() {
  const sala = 'sala-123';
  const datosDiagrama = {
    tipo: 'actualización',
    elemento: 'nodo-1',
    posicion: { x: 100, y: 200 }
  };
  
  this.wsService.emit('changed-diagrama', { 
    sala, 
    ...datosDiagrama 
  });
}
```

#### Recibir Cambios de Diagrama
```typescript
escucharCambiosDiagrama() {
  this.wsService.listen('changed-diagrama').subscribe(
    (data: any) => {
      console.log('Diagrama actualizado:', data);
      // Actualizar la UI con los cambios recibidos
    }
  );
}
```

## 📦 Servicio Completo de Ejemplo

```typescript
import { inject, Injectable, signal } from '@angular/core';
import { WebsocketService } from '../common/services/websocket.service';

export interface UsuarioDto {
  id: string;
  nombre: string;
}

@Injectable({
  providedIn: 'root',
})
export class SalaService {
  private wsService = inject(WebsocketService);
  
  usuario = signal<UsuarioDto>({ id: '', nombre: '' });
  usuariosConectados = signal<UsuarioDto[]>([]);
  eventos = signal<string[]>([]);
  
  // Configurar usuario
  setUsuario(nombre: string) {
    this.usuario.set({
      id: this.wsService.socket.ioSocket.id,
      nombre
    });
  }
  
  // Iniciar sala privada
  iniciarSalaPrivada(idSala: string) {
    this.wsService.emit('init-sala-privada', {
      usuario: this.usuario(),
      idSala
    });
    
    // Escuchar actualizaciones
    this.escucharUsuarios();
    this.escucharEventos();
  }
  
  // Escuchar usuarios
  private escucharUsuarios() {
    this.wsService.listen('clientes-conectados-sala-privada')
      .subscribe((usuarios: UsuarioDto[]) => {
        this.usuariosConectados.set(usuarios);
      });
  }
  
  // Escuchar eventos
  private escucharEventos() {
    this.wsService.listen('updated-eventos')
      .subscribe((eventos: string[]) => {
        this.eventos.set(eventos);
      });
  }
  
  // Agregar evento
  agregarEvento(idSala: string, evento: string) {
    this.wsService.emit('evento-new-sp', { idSala, evento });
  }
  
  // Eliminar evento
  eliminarEvento(idSala: string, evento: string) {
    this.wsService.emit('delete-evento-sp', { idSala, evento });
  }
}
```

## 🎨 Componente Completo de Ejemplo

```typescript
import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SalaService } from './sala.service';

@Component({
  selector: 'app-sala-privada',
  template: `
    <div class="sala-container">
      <h2>Sala: {{ idSala }}</h2>
      
      <!-- Usuario actual -->
      <div class="usuario-actual">
        <p>Usuario: {{ salaService.usuario().nombre }}</p>
      </div>
      
      <!-- Usuarios conectados -->
      <div class="usuarios-conectados">
        <h3>Usuarios Conectados</h3>
        <ul>
          @for (usuario of salaService.usuariosConectados(); track usuario.id) {
            <li>{{ usuario.nombre }}</li>
          }
        </ul>
      </div>
      
      <!-- Eventos -->
      <div class="eventos">
        <h3>Eventos</h3>
        <input 
          [(ngModel)]="nuevoEvento" 
          placeholder="Nuevo evento"
        />
        <button (click)="agregarEvento()">Agregar</button>
        
        <ul>
          @for (evento of salaService.eventos(); track evento) {
            <li>
              {{ evento }}
              <button (click)="eliminarEvento(evento)">Eliminar</button>
            </li>
          }
        </ul>
      </div>
    </div>
  `
})
export class SalaPrivadaComponent implements OnInit, OnDestroy {
  salaService = inject(SalaService);
  private route = inject(ActivatedRoute);
  
  idSala = this.route.snapshot.paramMap.get('id') || '';
  nuevoEvento = signal<string>('');
  
  ngOnInit() {
    // Configurar usuario (obtener de sesión, localStorage, etc.)
    const nombreUsuario = 'Usuario Test';
    this.salaService.setUsuario(nombreUsuario);
    
    // Iniciar sala
    this.salaService.iniciarSalaPrivada(this.idSala);
  }
  
  ngOnDestroy() {
    // Limpieza si es necesario
  }
  
  agregarEvento() {
    if (this.nuevoEvento()) {
      this.salaService.agregarEvento(this.idSala, this.nuevoEvento());
      this.nuevoEvento.set('');
    }
  }
  
  eliminarEvento(evento: string) {
    this.salaService.eliminarEvento(this.idSala, evento);
  }
}
```

## ⚠️ Consideraciones Importantes

### 1. Gestión de Suscripciones
Siempre desuscribirse de los observables en `ngOnDestroy`:
```typescript
private subscription!: Subscription;

ngOnInit() {
  this.subscription = this.wsService.listen('evento').subscribe(...);
}

ngOnDestroy() {
  this.subscription?.unsubscribe();
}
```

### 2. Verificar Conexión
Antes de emitir eventos, verificar que el socket esté conectado:
```typescript
if (this.wsService.socketStatus()) {
  this.wsService.emit('evento', data);
} else {
  console.error('Socket no conectado');
}
```

### 3. Manejo de Errores
Escuchar errores del servidor:
```typescript
this.wsService.listen('error-msg-servidor').subscribe(
  (mensaje: string) => {
    console.error('Error del servidor:', mensaje);
    // Mostrar mensaje al usuario
  }
);
```

### 4. IDs de Usuario
Para eventos que requieren ID numérico (BD), usar el ID del usuario autenticado:
```typescript
const userAuth = this.authService.getUserAuth();
if (userAuth) {
  this.wsService.emit('nueva-reunion', {
    id: userAuth.id, // ID numérico de BD
    nombre: nombreSala
  });
}
```

### 5. IDs de Socket
Para eventos que requieren ID de socket, usar:
```typescript
const socketId = this.wsService.socket.ioSocket.id;
```

## 🔧 Debugging

### Ver Estado del Socket
```typescript
console.log('Socket conectado:', this.wsService.socketStatus());
console.log('Socket ID:', this.wsService.socket.ioSocket.id);
```

### Logs del Servidor
El backend imprime logs de todos los eventos:
```
init-sala-privada: { usuario: { id: '...', nombre: '...' }, idSala: '...' }
Usuario Juan Pérez conectado a sala privada abc12345
```

### Inspeccionar Eventos en DevTools
Usar las herramientas de red del navegador para ver eventos WebSocket en tiempo real.
