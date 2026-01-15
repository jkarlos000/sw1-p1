/**
 * Script de Prueba - Eventos WebSocket
 * 
 * Este archivo contiene funciones de ejemplo para probar todos los eventos
 * No es necesario incluirlo en producción, solo para testing
 */

import { Socket } from 'socket.io-client';

// Interfaces
interface UsuarioDto {
    id: string;
    nombre: string;
}

interface SalaData {
    id: number;
    nombre: string;
    host: string;
}

// Función de prueba para Chat General
export function testChatGeneral(socket: Socket, nombreUsuario: string) {
    console.log('=== Probando Chat General ===');
    
    const usuario: UsuarioDto = {
        id: socket.id || '',
        nombre: nombreUsuario
    };
    
    // Escuchar respuesta
    socket.on('clientes-conectados', (usuarios: UsuarioDto[]) => {
        console.log('✓ Usuarios en chat general:', usuarios);
    });
    
    // Emitir evento
    socket.emit('init-chatGeneral', usuario);
}

// Función de prueba para Sala de Chat
export function testEntraSala(socket: Socket, nombreUsuario: string, nombreSala: string) {
    console.log('=== Probando Entrada a Sala ===');
    
    const usuario: UsuarioDto = {
        id: socket.id || '',
        nombre: nombreUsuario
    };
    
    // Escuchar respuesta
    socket.on('clientes-conectados-sala', (usuarios: UsuarioDto[]) => {
        console.log(`✓ Usuarios en sala "${nombreSala}":`, usuarios);
    });
    
    // Emitir evento
    socket.emit('entra-sala', { usuario, sala: nombreSala });
}

// Función de prueba para Sala Privada
export function testSalaPrivada(socket: Socket, nombreUsuario: string, idSala: string) {
    console.log('=== Probando Sala Privada ===');
    
    const usuario: UsuarioDto = {
        id: socket.id || '',
        nombre: nombreUsuario
    };
    
    // Escuchar usuarios
    socket.on('clientes-conectados-sala-privada', (usuarios: UsuarioDto[]) => {
        console.log(`✓ Usuarios en sala privada "${idSala}":`, usuarios);
    });
    
    // Escuchar eventos
    socket.on('updated-eventos', (eventos: string[]) => {
        console.log(`✓ Eventos en sala privada "${idSala}":`, eventos);
    });
    
    // Emitir evento
    socket.emit('init-sala-privada', { usuario, idSala });
}

// Función de prueba para Agregar Evento
export function testAgregarEvento(socket: Socket, idSala: string, evento: string) {
    console.log('=== Probando Agregar Evento ===');
    
    socket.emit('evento-new-sp', { idSala, evento });
    console.log(`✓ Evento "${evento}" enviado a sala "${idSala}"`);
}

// Función de prueba para Eliminar Evento
export function testEliminarEvento(socket: Socket, idSala: string, evento: string) {
    console.log('=== Probando Eliminar Evento ===');
    
    socket.emit('delete-evento-sp', { idSala, evento });
    console.log(`✓ Solicitud de eliminar evento "${evento}" enviada`);
}

// Función de prueba para Nueva Reunión
export function testNuevaReunion(socket: Socket, idUsuario: number, nombreSala: string) {
    console.log('=== Probando Nueva Reunión ===');
    
    // Escuchar respuesta
    socket.on('nueva-reunion', (response: any) => {
        if (response.ok) {
            console.log('✓ Reunión creada exitosamente:', response.sala);
        } else {
            console.error('✗ Error al crear reunión');
        }
    });
    
    // Emitir evento
    socket.emit('nueva-reunion', { id: idUsuario, nombre: nombreSala });
}

// Función de prueba para Unirse a Reunión
export function testUnirseReunion(socket: Socket, idUsuario: number, nombreSala: string) {
    console.log('=== Probando Unirse a Reunión ===');
    
    // Escuchar respuesta personal
    socket.on('unirse-reunion', (response: any) => {
        if (response.ok) {
            console.log('✓ Unido a reunión exitosamente:', response.sala);
            console.log('✓ Colaboradores:', response.colaboradores);
        } else {
            console.error('✗ Error al unirse a reunión');
        }
    });
    
    // Escuchar actualizaciones broadcast
    socket.on('colaboradores-sala-trabajo', (data: any) => {
        console.log('✓ Actualización de colaboradores:', data.asistentes);
    });
    
    // Emitir evento
    socket.emit('unirse-reunion', { id: idUsuario, nombre: nombreSala });
}

// Función de prueba para Sincronizar Diagrama
export function testChangedDiagrama(socket: Socket, idSala: string, datos: any) {
    console.log('=== Probando Sincronización de Diagrama ===');
    
    // Escuchar cambios
    socket.on('changed-diagrama', (data: any) => {
        console.log('✓ Cambio en diagrama recibido:', data);
    });
    
    // Emitir cambio
    socket.emit('changed-diagrama', { sala: idSala, ...datos });
    console.log(`✓ Cambio de diagrama enviado a sala "${idSala}"`);
}

// Función de prueba para Manejo de Errores
export function setupErrorHandling(socket: Socket) {
    console.log('=== Configurando Manejo de Errores ===');
    
    socket.on('error-msg-servidor', (mensaje: string) => {
        console.error('✗ Error del servidor:', mensaje);
    });
    
    socket.on('connect_error', (error: Error) => {
        console.error('✗ Error de conexión:', error.message);
    });
    
    socket.on('disconnect', (reason: string) => {
        console.warn('⚠ Desconectado del servidor. Razón:', reason);
    });
    
    socket.on('connect', () => {
        console.log('✓ Conectado al servidor. Socket ID:', socket.id);
    });
}

// Secuencia de prueba completa
export async function runFullTest(socket: Socket) {
    console.log('\n🧪 ========== INICIANDO PRUEBAS COMPLETAS ==========\n');
    
    // Configurar manejo de errores
    setupErrorHandling(socket);
    
    // Esperar conexión
    if (!socket.connected) {
        console.log('⏳ Esperando conexión...');
        await new Promise<void>(resolve => socket.once('connect', () => resolve()));
    }
    
    // Datos de prueba
    const nombreUsuario = 'Usuario Test';
    const idSala = 'test-sala-123';
    const nombreReunion = 'Reunion Test ' + Date.now();
    const idUsuario = 1; // Asegurarse que este usuario existe en BD
    
    // Esperar entre pruebas
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    try {
        // 1. Chat General
        testChatGeneral(socket, nombreUsuario);
        await delay(1000);
        
        // 2. Sala de Chat
        testEntraSala(socket, nombreUsuario, 'Sala Test');
        await delay(1000);
        
        // 3. Sala Privada
        testSalaPrivada(socket, nombreUsuario, idSala);
        await delay(1000);
        
        // 4. Agregar Eventos
        testAgregarEvento(socket, idSala, 'Evento de prueba 1');
        await delay(500);
        testAgregarEvento(socket, idSala, 'Evento de prueba 2');
        await delay(1000);
        
        // 5. Eliminar Evento
        testEliminarEvento(socket, idSala, 'Evento de prueba 1');
        await delay(1000);
        
        // 6. Nueva Reunión (requiere BD)
        // testNuevaReunion(socket, idUsuario, nombreReunion);
        // await delay(2000);
        
        // 7. Unirse a Reunión (requiere BD y reunión existente)
        // testUnirseReunion(socket, idUsuario, nombreReunion);
        // await delay(1000);
        
        // 8. Sincronizar Diagrama
        testChangedDiagrama(socket, idSala, {
            tipo: 'actualización',
            elemento: 'nodo-test',
            posicion: { x: 100, y: 200 }
        });
        
        console.log('\n✅ ========== PRUEBAS COMPLETADAS ==========\n');
        
    } catch (error) {
        console.error('\n❌ Error durante las pruebas:', error);
    }
}

// Ejemplo de uso:
// import io from 'socket.io-client';
// import { runFullTest } from './test-websockets';
//
// const socket = io('http://localhost:5000');
// runFullTest(socket);
