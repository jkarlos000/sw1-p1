import { Request, Response } from 'express';
import { pool } from '../database/config';

/**
 * 🎯 Controlador: Gestión de Clases UML con Atributos y Métodos
 * Endpoints para persistir y recuperar clases con soporte UML 2.5
 */

// ============================================
// 📝 GUARDAR CLASE COMPLETA (POST)
// ============================================
/**
 * Guarda o actualiza una clase completa con sus atributos y métodos
 * Body: { 
 *   id_sala, cell_id, nombre, atributos[], metodos[], posicion: {x, y, width, height} 
 * }
 */
export const guardarClaseUML = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id_sala, cell_id, nombre, atributos = [], metodos = [], posicion } = req.body;
    
    if (!id_sala || !cell_id || !nombre) {
      return res.status(400).json({ 
        ok: false, 
        mensaje: 'Faltan campos requeridos: id_sala, cell_id, nombre' 
      });
    }
    
    await client.query('BEGIN');
    
    // 1️⃣ Insertar o actualizar la clase
    const queryClase = `
      INSERT INTO clase_uml (id_sala, cell_id, nombre_clase, x_position, y_position, ancho, alto)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id_sala, cell_id) 
      DO UPDATE SET 
        nombre_clase = EXCLUDED.nombre_clase,
        x_position = EXCLUDED.x_position,
        y_position = EXCLUDED.y_position,
        ancho = EXCLUDED.ancho,
        alto = EXCLUDED.alto,
        fecha_actualizacion = CURRENT_TIMESTAMP
      RETURNING id_clase;
    `;
    
    const resultClase = await client.query(queryClase, [
      id_sala,
      cell_id,
      nombre,
      posicion?.x || 0,
      posicion?.y || 0,
      posicion?.width || 200,
      posicion?.height || 150
    ]);
    
    const id_clase = resultClase.rows[0].id_clase;
    
    // 2️⃣ Eliminar atributos y métodos anteriores
    await client.query('DELETE FROM atributo_clase WHERE id_clase = $1', [id_clase]);
    await client.query('DELETE FROM metodo_clase WHERE id_clase = $1', [id_clase]);
    
    // 3️⃣ Insertar atributos
    for (let i = 0; i < atributos.length; i++) {
      const attr = atributos[i];
      await client.query(`
        INSERT INTO atributo_clase (id_clase, nombre, tipo, visibility, es_static, valor_default, orden_visualizacion)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        id_clase,
        attr.titulo || attr.nombre || 'atributo',
        attr.tipo || 'String',
        attr.visibility || 'private',
        attr.esStatic || false,
        attr.defaultValue || null,
        i
      ]);
    }
    
    // 4️⃣ Insertar métodos con parámetros
    for (let i = 0; i < metodos.length; i++) {
      const metodo = metodos[i];
      
      // Insertar método
      const resultMetodo = await client.query(`
        INSERT INTO metodo_clase (id_clase, nombre, tipo_retorno, visibility, es_static, es_abstract, orden_visualizacion)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id_metodo
      `, [
        id_clase,
        metodo.nombre || 'metodo',
        metodo.tipoRetorno || 'void',
        metodo.visibility || 'public',
        metodo.esStatic || false,
        metodo.esAbstract || false,
        i
      ]);
      
      const id_metodo = resultMetodo.rows[0].id_metodo;
      
      // Insertar parámetros del método
      const parametros = metodo.parametros || [];
      for (let j = 0; j < parametros.length; j++) {
        const param = parametros[j];
        await client.query(`
          INSERT INTO parametro_metodo (id_metodo, nombre, tipo, orden_parametro)
          VALUES ($1, $2, $3, $4)
        `, [
          id_metodo,
          param.nombre || `param${j}`,
          param.tipo || 'Object',
          j
        ]);
      }
    }
    
    await client.query('COMMIT');
    
    res.json({
      ok: true,
      mensaje: 'Clase guardada exitosamente',
      id_clase,
      atributos_guardados: atributos.length,
      metodos_guardados: metodos.length
    });
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error al guardar clase UML:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al guardar la clase',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// ============================================
// 🔍 OBTENER CLASES DE UNA SALA (GET)
// ============================================
/**
 * Obtiene todas las clases de una sala con sus atributos y métodos
 * Params: id_sala
 */
export const obtenerClasesUML = async (req: Request, res: Response) => {
  try {
    const { id_sala } = req.params;
    
    if (!id_sala) {
      return res.status(400).json({ 
        ok: false, 
        mensaje: 'Falta el parámetro id_sala' 
      });
    }
    
    // 1️⃣ Obtener todas las clases
    const queryClases = `
      SELECT id_clase, cell_id, nombre_clase, x_position, y_position, ancho, alto
      FROM clase_uml
      WHERE id_sala = $1
      ORDER BY fecha_creacion ASC;
    `;
    
    const resultClases = await pool.query(queryClases, [id_sala]);
    
    if (resultClases.rows.length === 0) {
      return res.json({
        ok: true,
        clases: []
      });
    }
    
    const clases = [];
    
    // 2️⃣ Para cada clase, obtener sus atributos y métodos
    for (const clase of resultClases.rows) {
      // Obtener atributos
      const queryAtributos = `
        SELECT nombre, tipo, visibility, es_static, valor_default
        FROM atributo_clase
        WHERE id_clase = $1
        ORDER BY orden_visualizacion ASC;
      `;
      const resultAtributos = await pool.query(queryAtributos, [clase.id_clase]);
      
      // Obtener métodos
      const queryMetodos = `
        SELECT id_metodo, nombre, tipo_retorno, visibility, es_static, es_abstract
        FROM metodo_clase
        WHERE id_clase = $1
        ORDER BY orden_visualizacion ASC;
      `;
      const resultMetodos = await pool.query(queryMetodos, [clase.id_clase]);
      
      // Obtener parámetros de cada método
      const metodosConParametros = [];
      for (const metodo of resultMetodos.rows) {
        const queryParametros = `
          SELECT nombre, tipo
          FROM parametro_metodo
          WHERE id_metodo = $1
          ORDER BY orden_parametro ASC;
        `;
        const resultParametros = await pool.query(queryParametros, [metodo.id_metodo]);
        
        metodosConParametros.push({
          nombre: metodo.nombre,
          tipoRetorno: metodo.tipo_retorno,
          visibility: metodo.visibility,
          esStatic: metodo.es_static,
          esAbstract: metodo.es_abstract,
          parametros: resultParametros.rows.map(p => ({
            nombre: p.nombre,
            tipo: p.tipo
          }))
        });
      }
      
      clases.push({
        id_clase: clase.id_clase,
        cell_id: clase.cell_id,
        nombre: clase.nombre_clase,
        posicion: {
          x: parseFloat(clase.x_position),
          y: parseFloat(clase.y_position),
          width: parseFloat(clase.ancho),
          height: parseFloat(clase.alto)
        },
        atributos: resultAtributos.rows.map(a => ({
          titulo: a.nombre,
          tipo: a.tipo,
          visibility: a.visibility,
          esStatic: a.es_static,
          defaultValue: a.valor_default
        })),
        metodos: metodosConParametros
      });
    }
    
    res.json({
      ok: true,
      clases
    });
    
  } catch (error: any) {
    console.error('❌ Error al obtener clases UML:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener las clases',
      error: error.message
    });
  }
};

// ============================================
// 🗑️ ELIMINAR CLASE (DELETE)
// ============================================
/**
 * Elimina una clase por su cell_id (en cascada elimina atributos, métodos y parámetros)
 * Params: id_sala, cell_id
 */
export const eliminarClaseUML = async (req: Request, res: Response) => {
  try {
    const { id_sala, cell_id } = req.params;
    
    if (!id_sala || !cell_id) {
      return res.status(400).json({ 
        ok: false, 
        mensaje: 'Faltan parámetros: id_sala, cell_id' 
      });
    }
    
    const query = `
      DELETE FROM clase_uml
      WHERE id_sala = $1 AND cell_id = $2
      RETURNING id_clase;
    `;
    
    const result = await pool.query(query, [id_sala, cell_id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Clase no encontrada'
      });
    }
    
    res.json({
      ok: true,
      mensaje: 'Clase eliminada exitosamente',
      id_clase: result.rows[0].id_clase
    });
    
  } catch (error: any) {
    console.error('❌ Error al eliminar clase UML:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar la clase',
      error: error.message
    });
  }
};

// ============================================
// 💾 GUARDAR MÚLTIPLES CLASES (POST)
// ============================================
/**
 * Guarda múltiples clases en una sola transacción
 * Body: { id_sala, clases: [{ cell_id, nombre, atributos, metodos, posicion }] }
 */
export const guardarClasesMultiples = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id_sala, clases } = req.body;
    
    if (!id_sala || !Array.isArray(clases)) {
      return res.status(400).json({ 
        ok: false, 
        mensaje: 'Faltan campos: id_sala o clases[]' 
      });
    }
    
    await client.query('BEGIN');
    
    const resultados = [];
    
    for (const clase of clases) {
      // Reutilizar la lógica de guardarClaseUML pero dentro de la transacción
      const { cell_id, nombre, atributos = [], metodos = [], posicion } = clase;
      
      if (!cell_id || !nombre) continue;
      
      // Insertar clase
      const queryClase = `
        INSERT INTO clase_uml (id_sala, cell_id, nombre_clase, x_position, y_position, ancho, alto)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id_sala, cell_id) 
        DO UPDATE SET 
          nombre_clase = EXCLUDED.nombre_clase,
          x_position = EXCLUDED.x_position,
          y_position = EXCLUDED.y_position
        RETURNING id_clase;
      `;
      
      const resultClase = await client.query(queryClase, [
        id_sala, cell_id, nombre,
        posicion?.x || 0, posicion?.y || 0,
        posicion?.width || 200, posicion?.height || 150
      ]);
      
      const id_clase = resultClase.rows[0].id_clase;
      
      // Eliminar datos anteriores
      await client.query('DELETE FROM atributo_clase WHERE id_clase = $1', [id_clase]);
      await client.query('DELETE FROM metodo_clase WHERE id_clase = $1', [id_clase]);
      
      // Insertar atributos
      for (let i = 0; i < atributos.length; i++) {
        const attr = atributos[i];
        await client.query(`
          INSERT INTO atributo_clase (id_clase, nombre, tipo, visibility, es_static, valor_default, orden_visualizacion)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [id_clase, attr.titulo || 'attr', attr.tipo || 'String', attr.visibility || 'private', attr.esStatic || false, attr.defaultValue || null, i]);
      }
      
      // Insertar métodos y parámetros
      for (let i = 0; i < metodos.length; i++) {
        const metodo = metodos[i];
        const resultMetodo = await client.query(`
          INSERT INTO metodo_clase (id_clase, nombre, tipo_retorno, visibility, es_static, es_abstract, orden_visualizacion)
          VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_metodo
        `, [id_clase, metodo.nombre, metodo.tipoRetorno || 'void', metodo.visibility || 'public', metodo.esStatic || false, metodo.esAbstract || false, i]);
        
        const id_metodo = resultMetodo.rows[0].id_metodo;
        
        for (let j = 0; j < (metodo.parametros || []).length; j++) {
          const param = metodo.parametros[j];
          await client.query(`
            INSERT INTO parametro_metodo (id_metodo, nombre, tipo, orden_parametro)
            VALUES ($1, $2, $3, $4)
          `, [id_metodo, param.nombre, param.tipo || 'Object', j]);
        }
      }
      
      resultados.push({ id_clase, cell_id, nombre });
    }
    
    await client.query('COMMIT');
    
    res.json({
      ok: true,
      mensaje: `${resultados.length} clases guardadas exitosamente`,
      clases: resultados
    });
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error al guardar clases múltiples:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al guardar las clases',
      error: error.message
    });
  } finally {
    client.release();
  }
};
