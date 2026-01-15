/**
 * Socket Handlers
 * Manejadores de eventos WebSocket para chat, salas y diagramas
 * 
 * @author Jkarlos
 * @date 2026
 */

import socketIO, { Socket } from 'socket.io';
import { pool } from '../database/config';

// INTERFACE PARA TIPOS
interface UsuarioDto {
    id: string;
    nombre: string;
}

interface SalaData {
    [idSala: string]: {
        usuarios: UsuarioDto[];
        eventos: string[];
    };
}

// ALMACENAMIENTO EN MEMORIA DE SALAS
const salasActivas: SalaData = {};
const usuariosConectadosChatGeneral: UsuarioDto[] = [];
const usuariosConectadosSala: { [sala: string]: UsuarioDto[] } = {};

// ========== CHAT GENERAL ==========
// INIT CHAT GENERAL
export const initChatGeneral = (cliente: Socket, io: socketIO.Server) => {
    cliente.on('init-chatGeneral', (usuario: UsuarioDto) => {
        console.log('init-chatGeneral:', usuario);
        
        // Agregar usuario si no existe
        const existe = usuariosConectadosChatGeneral.find(u => u.id === usuario.id);
        if (!existe) {
            usuariosConectadosChatGeneral.push(usuario);
        }
        
        // Emitir lista actualizada a todos
        io.emit('clientes-conectados', usuariosConectadosChatGeneral);
    });
};

// ========== SALAS DE CHAT ==========
// ENTRAR A SALA DE CHAT
export const entraSala = (cliente: Socket, io: socketIO.Server) => {
    cliente.on('entra-sala', (data: { usuario: UsuarioDto; sala: string }) => {
        console.log('entra-sala:', data);
        
        if (!data.usuario || !data.sala) {
            io.to(cliente.id).emit('error-msg-servidor', 'Datos incompletos para entrar a sala');
            return;
        }
        
        // Unirse a la sala
        cliente.join(data.sala);
        
        // Inicializar array si no existe
        if (!usuariosConectadosSala[data.sala]) {
            usuariosConectadosSala[data.sala] = [];
        }
        
        // Agregar usuario si no existe
        const existe = usuariosConectadosSala[data.sala].find(u => u.id === data.usuario.id);
        if (!existe) {
            usuariosConectadosSala[data.sala].push(data.usuario);
        }
        
        // Emitir lista actualizada a todos en la sala
        io.to(data.sala).emit('clientes-conectados-sala', usuariosConectadosSala[data.sala]);
        console.log(`Usuario ${data.usuario.nombre} conectado a sala ${data.sala}`);
    });
};

// ========== SALAS PRIVADAS SW1 ==========
// INIT SALA PRIVADA
export const initSalaPrivada = (cliente: Socket, io: socketIO.Server) => {
    cliente.on('init-sala-privada', (data: { usuario: UsuarioDto; idSala: string }) => {
        console.log('init-sala-privada:', data);
        
        if (!data.usuario || !data.idSala) {
            io.to(cliente.id).emit('error-msg-servidor', 'Datos incompletos para iniciar sala privada');
            return;
        }
        
        // Unirse a la sala
        cliente.join(data.idSala);
        
        // Inicializar sala si no existe
        if (!salasActivas[data.idSala]) {
            salasActivas[data.idSala] = {
                usuarios: [],
                eventos: []
            };
        }
        
        // Agregar usuario si no existe
        const existe = salasActivas[data.idSala].usuarios.find(u => u.id === data.usuario.id);
        if (!existe) {
            salasActivas[data.idSala].usuarios.push(data.usuario);
        }
        
        // Emitir lista actualizada a todos en la sala
        io.to(data.idSala).emit('clientes-conectados-sala-privada', salasActivas[data.idSala].usuarios);
        io.to(data.idSala).emit('updated-eventos', salasActivas[data.idSala].eventos);
        
        console.log(`Usuario ${data.usuario.nombre} conectado a sala privada ${data.idSala}`);
    });
};

// AGREGAR EVENTO A SALA PRIVADA
export const addEventoSalaPrivada = (cliente: Socket, io: socketIO.Server) => {
    cliente.on('evento-new-sp', (data: { idSala: string; evento: string }) => {
        console.log('evento-new-sp:', data);
        
        if (!data.idSala || !data.evento) {
            io.to(cliente.id).emit('error-msg-servidor', 'Datos incompletos para agregar evento');
            return;
        }
        
        // Inicializar sala si no existe
        if (!salasActivas[data.idSala]) {
            salasActivas[data.idSala] = {
                usuarios: [],
                eventos: []
            };
        }
        
        // Agregar evento si no existe
        if (!salasActivas[data.idSala].eventos.includes(data.evento)) {
            salasActivas[data.idSala].eventos.push(data.evento);
        }
        
        // Emitir lista actualizada a todos en la sala
        io.to(data.idSala).emit('updated-eventos', salasActivas[data.idSala].eventos);
        console.log(`Evento ${data.evento} agregado a sala ${data.idSala}`);
    });
};

// ELIMINAR EVENTO DE SALA PRIVADA
export const deleteEventoSalaPrivada = (cliente: Socket, io: socketIO.Server) => {
    cliente.on('delete-evento-sp', (data: { idSala: string; evento: string }) => {
        console.log('delete-evento-sp:', data);
        
        if (!data.idSala || !data.evento) {
            io.to(cliente.id).emit('error-msg-servidor', 'Datos incompletos para eliminar evento');
            return;
        }
        
        // Verificar que la sala existe
        if (salasActivas[data.idSala]) {
            // Eliminar evento
            salasActivas[data.idSala].eventos = salasActivas[data.idSala].eventos.filter(e => e !== data.evento);
            
            // Emitir lista actualizada a todos en la sala
            io.to(data.idSala).emit('updated-eventos', salasActivas[data.idSala].eventos);
            console.log(`Evento ${data.evento} eliminado de sala ${data.idSala}`);
        }
    });
};

// ========== REUNIONES Y DIAGRAMAS ==========
// CREAR NUEVA REUNION
export const nuevaReunion = async (cliente: Socket, io: socketIO.Server) => {
    cliente.on('nueva-reunion', async (data: { id: number; nombre: string }) => {
        console.log('nueva-reunion:', data);
        
        if (!data.id || !data.nombre) {
            io.to(cliente.id).emit('error-msg-servidor', 'Datos incompletos para crear reunión');
            return;
        }
        
        try {
            // Obtener email del usuario
            const usuarioBD = await pool.query('SELECT email FROM usuario WHERE id_usuario = $1', [data.id]);
            
            if (usuarioBD.rows.length === 0) {
                io.to(cliente.id).emit('error-msg-servidor', 'Usuario no encontrado');
                return;
            }
            
            const emailUsuario = usuarioBD.rows[0].email;
            
            // Crear sala en BD
            const consultaCreacion = await pool.query(
                'INSERT INTO sala (nombre_sala, host_sala, informacion) VALUES ($1, $2, $3) RETURNING id_sala',
                [data.nombre, emailUsuario, '']
            );
            
            const idSala = consultaCreacion.rows[0].id_sala;
            
            // Registrar asistencia
            await pool.query(
                'INSERT INTO asistencia (id_usuario, id_sala, fecha_hora) VALUES ($1, $2, CURRENT_TIMESTAMP)',
                [data.id, idSala]
            );
            
            // Unir cliente a la sala
            cliente.join(data.nombre);
            
            // Responder al cliente
            io.to(cliente.id).emit('nueva-reunion', {
                ok: true,
                sala: {
                    id: idSala,
                    nombre: data.nombre,
                    host: emailUsuario
                }
            });
            
            console.log(`Reunión creada: ${data.nombre} por usuario ${data.id}`);
        } catch (error) {
            console.error('Error al crear reunión:', error);
            io.to(cliente.id).emit('error-msg-servidor', 'Error al crear la reunión en BD');
        }
    });
};

// UNIRSE A REUNION
export const unirseReunion = async (cliente: Socket, io: socketIO.Server) => {
    cliente.on('unirse-reunion', async (data: { id: number; nombre: string }) => {
        console.log('unirse-reunion:', data);
        
        if (!data.id || !data.nombre) {
            io.to(cliente.id).emit('error-msg-servidor', 'Datos incompletos para unirse a reunión');
            return;
        }
        
        try {
            // Verificar que la sala existe
            const salaBD = await pool.query('SELECT * FROM sala WHERE nombre_sala = $1', [data.nombre]);
            
            if (salaBD.rows.length === 0) {
                io.to(cliente.id).emit('error-msg-servidor', 'Sala no encontrada');
                return;
            }
            
            const idSala = salaBD.rows[0].id_sala;
            
            // Verificar que no esté ya registrado
            const asistenciaExistente = await pool.query(
                'SELECT * FROM asistencia WHERE id_usuario = $1 AND id_sala = $2',
                [data.id, idSala]
            );
            
            // Si no existe, registrar asistencia
            if (asistenciaExistente.rows.length === 0) {
                await pool.query(
                    'INSERT INTO asistencia (id_usuario, id_sala, fecha_hora) VALUES ($1, $2, CURRENT_TIMESTAMP)',
                    [data.id, idSala]
                );
            }
            
            // Unir cliente a la sala
            cliente.join(data.nombre);
            
            // Obtener colaboradores
            const colaboradores = await pool.query(`
                SELECT usuario.email
                FROM asistencia  
                JOIN usuario ON asistencia.id_usuario = usuario.id_usuario
                WHERE id_sala = $1
            `, [idSala]);
            
            // Responder al cliente
            io.to(cliente.id).emit('unirse-reunion', {
                ok: true,
                sala: {
                    id: idSala,
                    nombre: data.nombre,
                    host: salaBD.rows[0].host_sala
                },
                colaboradores: colaboradores.rows
            });
            
            // Notificar a todos en la sala
            cliente.broadcast.to(data.nombre).emit('colaboradores-sala-trabajo', {
                asistentes: colaboradores.rows,
                sala: data.nombre,
                ok: true
            });
            
            console.log(`Usuario ${data.id} unido a reunión ${data.nombre}`);
        } catch (error) {
            console.error('Error al unirse a reunión:', error);
            io.to(cliente.id).emit('error-msg-servidor', 'Error al unirse a la reunión');
        }
    });
};

// CHANGED DIAGRAMA (para sincronización en tiempo real)
export const changedDiagrama = (cliente: Socket, io: socketIO.Server) => {
    cliente.on('changed-diagrama', (data: any) => {
        console.log('changed-diagrama recibido:', data.sala);
        
        if (data.sala) {
            // Emitir a todos excepto al emisor en la misma sala
            cliente.broadcast.to(data.sala).emit('changed-diagrama', data);
            console.log(`Diagrama sincronizado en sala: ${data.sala}`);
        } else {
            // Si no hay sala, emitir a todos excepto al emisor
            cliente.broadcast.emit('changed-diagrama', data);
            console.log('Diagrama sincronizado globalmente');
        }
    });
};

// ========== FUNCIONES EXISTENTES OPTIMIZADAS ==========
// CREART UNA SALA DE TRABAJO (Legacy - mantener por compatibilidad)
export const crearSala = async (cliente: Socket, io: socketIO.Server) => {
    cliente.on('nueva-reunion-legacy', (data: any) => {
        console.log(data);
        if (!data.host_sala && !data.nombre_sala) {
            io.to(cliente.id).emit('error-msg-servidor', 'No se ha podido crear la sala');
        }
        // CREAR SALA EN AL BD
        try {
            const consulta = pool.query('INSERT INTO sala (nombre_sala, host_sala) VALUES ($1, $2)', [data.nombre_sala, data.host_sala]);
            console.log('Sala creada en la BD');
        } catch (error) {
            io.to(cliente.id).emit('error-msg-servidor', 'No se ha podido crear la sala por BD');
        }
        console.log(
            `Sala creada por: ${data.host_sala} con nombre: ${data.nombre_sala}`
        );
    });
}

// DATA DE SALA ESPECIFICA
export const dataSala = async (cliente: Socket, io: socketIO.Server) => {
    cliente.on('data-sala-trabajo', async (data: any) => {
        //console.log(data);
        if (!data.cliente && !data.nombre_sala && !data.informacion) {
            io.to(cliente.id).emit('error-msg-servidor', 'No sea recibido la información necesaria');
        }
        // GUARDAR INFORMACION DE LA SALA EN LA BD
        try {
            console.log(data);
            const consulta = await pool.query('UPDATE sala SET informacion = $1 WHERE nombre_sala = $2', [data.informacion, data.nombre_sala]);
            //console.log('Informacion guardada en la BD');
        } catch (error) {
            io.to(cliente.id).emit('error-msg-servidor', 'No sea guardo cambios de la sala en la BD');
        }
        // ENVIAR INFORMACION A LA SALA
        cliente.broadcast.to(data.nombre_sala).emit('data-sala-trabajo', data.informacion);
        console.log(
            `Informacion enviada sala: ${data.nombre_sala} cliente: ${data.cliente}`
        );
    });
}

// ENTRAR A UNA SALA
export const entrarSala = async (cliente: Socket, io: socketIO.Server) => {
    cliente.on('entrar-sala-trabajo', async (data: any) => {
        if (!data.nombreSala) {
            console.log("FALTAN DATOS PARA ENTRAR A LA SALA");
            io.to(cliente.id).emit('error-msg-servidor', 'No se ha podido crear la sala');
        }
        cliente.join(data.nombreSala);
        const salaBD = await pool.query('SELECT * FROM sala WHERE nombre_sala = $1', [data.nombreSala]);
        const { id_sala } = salaBD.rows[0];
        const colaboradores = await pool.query(`
        SELECT usuario.email
        FROM asistencia  
        JOIN usuario ON asistencia.id_usuario = usuario.id_usuario
        WHERE id_sala = $1`, [id_sala]);
        cliente.broadcast.to(data.nombreSala).emit('colaboradores-sala-trabajo', {
            asistentes: colaboradores.rows,
            sala: data.nombreSala,
            ok: true
        });
        console.log("Cliente conectado a la sala: ", data.nombreSala);
    });
}


export const salirSala = async (cliente: Socket, io: socketIO.Server) => {
    cliente.on('salir-sala-trabajo', async (data: any) => {
        console.log("ENTRE A BORRAR LA SALA");
        console.log(data);
        if (!data.nombreSala) {
            console.log("FALTAN DATOS PARA SALIR DE LA SALA");
            io.to(cliente.id).emit('error-msg-servidor', 'No se ha podido salir de la sala');
        }
        cliente.leave(data.nombreSala);
        const salaBD = await pool.query('SELECT * FROM sala WHERE nombre_sala = $1', [data.nombreSala]);
        const { id_sala } = salaBD.rows[0];
        const colaboradores = await pool.query(`
        SELECT usuario.email
        FROM asistencia  
        JOIN usuario ON asistencia.id_usuario = usuario.id_usuario
        WHERE id_sala = $1`, [id_sala]);
        cliente.broadcast.to(data.nombreSala).emit('colaboradores-sala-trabajo', {
            asistentes: colaboradores.rows,
            sala: data.nombreSala,
            ok: true
        });
        console.log("Cliente desconectado de la sala: ", data.nombreSala);
    });

}

export const desconectar = (cliente: Socket) => {
    cliente.on('disconnect', () => {
        console.log("Cliente desconectado");
    });
}

// Escuchar mensajes
export const mensaje = (cliente: Socket, io: socketIO.Server) => {
    cliente.on('mensaje', (payload: { de: string, cuerpo: string }) => {
        console.log('Mensaje recibido', payload);
        io.emit('mensaje-nuevo', payload);
    });
}

// Escuchar Mensaje Prueba Cliente 
export const mensajePrueba = (cliente: Socket, io: socketIO.Server) => {
    cliente.on('mensaje-cliente', (data) => {
        console.log(data);
        io.emit('mensaje-servidor', {
            de: 'Servidor',
            cuerpo: 'Mensaje recibido'
        })
    })
}

// COLABORADORES SALA