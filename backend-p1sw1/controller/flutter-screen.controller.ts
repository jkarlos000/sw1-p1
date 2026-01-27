import { Request, Response } from 'express';
import { Pool } from 'pg';

/**
 * 📱 Controlador: Gestión de Flutter Screens
 * Maneja operaciones CRUD para pantallas Flutter vinculadas a clases UML
 */

export class FlutterScreenController {
  constructor(private db: Pool) {}

  /**
   * Guardar/Actualizar una pantalla Flutter completa
   * POST /flutter-screen/save
   * Body: {
   *   id_sala: number,
   *   id_clase: number,
   *   nombre_screen: string,
   *   componentes: Array<{
   *     id: string,
   *     type: string,
   *     label: string,
   *     id_atributo?: number,
   *     id_metodo?: number,
   *     label_custom?: string,
   *     placeholder_custom?: string,
   *     position: number,
   *     ...
   *   }>
   * }
   */
  async guardarFlutterScreen(req: Request, res: Response): Promise<void> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const { id_sala, id_clase, nombre_screen, componentes } = req.body;

      if (!id_sala || !id_clase || !Array.isArray(componentes)) {
        res.status(400).json({
          ok: false,
          error: 'id_sala, id_clase y componentes son requeridos'
        });
        return;
      }

      // Verificar que la clase existe en la sala
      const claseResult = await client.query(
        'SELECT id_clase FROM clase_uml WHERE id_clase = $1 AND id_sala = $2',
        [id_clase, id_sala]
      );

      if (claseResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({
          ok: false,
          error: 'Clase UML no encontrada en esta sala'
        });
        return;
      }

      // Buscar si ya existe flutter_screen para esta clase
      const screenExistente = await client.query(
        'SELECT id_screen FROM flutter_screen WHERE id_clase = $1',
        [id_clase]
      );

      let id_screen: number;

      if (screenExistente.rows.length > 0) {
        // Actualizar flutter_screen existente
        id_screen = screenExistente.rows[0].id_screen;
        
        await client.query(
          `UPDATE flutter_screen 
           SET nombre_screen = $1, 
               componentes_json = $2,
               fecha_actualizacion = CURRENT_TIMESTAMP
           WHERE id_screen = $3`,
          [nombre_screen || 'Screen', JSON.stringify(componentes), id_screen]
        );

        console.log(`✅ Flutter Screen actualizado: id_screen=${id_screen}`);
      } else {
        // Crear nuevo flutter_screen
        const nuevoScreen = await client.query(
          `INSERT INTO flutter_screen (id_clase, nombre_screen, componentes_json)
           VALUES ($1, $2, $3)
           RETURNING id_screen`,
          [id_clase, nombre_screen || 'Screen', JSON.stringify(componentes)]
        );

        id_screen = nuevoScreen.rows[0].id_screen;
        console.log(`✅ Flutter Screen creado: id_screen=${id_screen}`);
      }

      // Eliminar componentes antiguos
      await client.query(
        'DELETE FROM flutter_component WHERE id_screen = $1',
        [id_screen]
      );

      // Insertar nuevos componentes con sus referencias a UML
      for (let i = 0; i < componentes.length; i++) {
        const comp = componentes[i];
        
        // Extraer id_atributo e id_metodo si están en customProperties
        let id_atributo = comp.id_atributo || null;
        let id_metodo = comp.id_metodo || null;

        if (comp.customProperties) {
          // Intenta encontrar la referencia UML asociada
          // Si el componente viene con información de qué atributo representa
          if (comp.customProperties.atributoUmlId) {
            id_atributo = comp.customProperties.atributoUmlId;
          }
          if (comp.customProperties.metodoUmlId) {
            id_metodo = comp.customProperties.metodoUmlId;
          }
        }

        await client.query(
          `INSERT INTO flutter_component 
           (id_screen, id_atributo, id_metodo, label_custom, placeholder_custom, position, tipo_componente, propiedades_json)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            id_screen,
            id_atributo,
            id_metodo,
            comp.label_custom || comp.label || null,
            comp.placeholder_custom || comp.placeholder || null,
            comp.position || i,
            comp.type || 'TextField',
            JSON.stringify(comp.customProperties || {})
          ]
        );
      }

      await client.query('COMMIT');

      res.json({
        ok: true,
        mensaje: 'Flutter Screen guardado exitosamente',
        id_screen,
        componentes_guardados: componentes.length
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('❌ Error al guardar Flutter Screen:', error);
      res.status(500).json({
        ok: false,
        error: 'Error al guardar Flutter Screen',
        details: error.message
      });
    } finally {
      client.release();
    }
  }

  /**
   * Obtener una pantalla Flutter completa
   * GET /flutter-screen/:id_clase
   */
  async obtenerFlutterScreen(req: Request, res: Response): Promise<void> {
    try {
      const { id_clase } = req.params;

      // Obtener la pantalla Flutter
      const screenResult = await this.db.query(
        `SELECT * FROM flutter_screen WHERE id_clase = $1`,
        [id_clase]
      );

      if (screenResult.rows.length === 0) {
        res.status(404).json({
          ok: false,
          error: 'Flutter Screen no encontrado para esta clase'
        });
        return;
      }

      const screen = screenResult.rows[0];

      // Obtener los componentes con sus referencias UML
      const componentesResult = await this.db.query(
        `SELECT 
          fc.*,
          ac.nombre as atributo_nombre,
          ac.tipo as atributo_tipo,
          mc.nombre as metodo_nombre,
          mc.tipo_retorno as metodo_tipo_retorno
         FROM flutter_component fc
         LEFT JOIN atributo_clase ac ON fc.id_atributo = ac.id_atributo
         LEFT JOIN metodo_clase mc ON fc.id_metodo = mc.id_metodo
         WHERE fc.id_screen = $1
         ORDER BY fc.position`,
        [screen.id_screen]
      );

      res.json({
        ok: true,
        screen: {
          id_screen: screen.id_screen,
          id_clase: screen.id_clase,
          nombre_screen: screen.nombre_screen,
          componentes_json: screen.componentes_json,
          fecha_creacion: screen.fecha_creacion,
          fecha_actualizacion: screen.fecha_actualizacion
        },
        componentes: componentesResult.rows.map(comp => ({
          id_component: comp.id_component,
          id_atributo: comp.id_atributo,
          id_metodo: comp.id_metodo,
          atributo_nombre: comp.atributo_nombre,
          atributo_tipo: comp.atributo_tipo,
          metodo_nombre: comp.metodo_nombre,
          label_custom: comp.label_custom,
          placeholder_custom: comp.placeholder_custom,
          position: comp.position,
          tipo_componente: comp.tipo_componente,
          propiedades_json: comp.propiedades_json
        }))
      });

    } catch (error: any) {
      console.error('❌ Error al obtener Flutter Screen:', error);
      res.status(500).json({
        ok: false,
        error: 'Error al obtener Flutter Screen',
        details: error.message
      });
    }
  }

  /**
   * Actualizar un componente individual
   * PUT /flutter-screen/component/:id_component
   */
  async actualizarComponente(req: Request, res: Response): Promise<void> {
    try {
      const { id_component } = req.params;
      const { label_custom, placeholder_custom, position, tipo_componente } = req.body;

      await this.db.query(
        `UPDATE flutter_component 
         SET label_custom = COALESCE($1, label_custom),
             placeholder_custom = COALESCE($2, placeholder_custom),
             position = COALESCE($3, position),
             tipo_componente = COALESCE($4, tipo_componente)
         WHERE id_component = $5`,
        [label_custom, placeholder_custom, position, tipo_componente, id_component]
      );

      res.json({
        ok: true,
        mensaje: 'Componente actualizado exitosamente'
      });

    } catch (error: any) {
      console.error('❌ Error al actualizar componente:', error);
      res.status(500).json({
        ok: false,
        error: 'Error al actualizar componente',
        details: error.message
      });
    }
  }

  /**
   * Eliminar una pantalla Flutter
   * DELETE /flutter-screen/:id_screen
   */
  async eliminarFlutterScreen(req: Request, res: Response): Promise<void> {
    try {
      const { id_screen } = req.params;

      const result = await this.db.query(
        'DELETE FROM flutter_screen WHERE id_screen = $1 RETURNING id_clase',
        [id_screen]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          ok: false,
          error: 'Flutter Screen no encontrado'
        });
        return;
      }

      res.json({
        ok: true,
        mensaje: 'Flutter Screen eliminado exitosamente',
        id_clase: result.rows[0].id_clase
      });

    } catch (error: any) {
      console.error('❌ Error al eliminar Flutter Screen:', error);
      res.status(500).json({
        ok: false,
        error: 'Error al eliminar Flutter Screen',
        details: error.message
      });
    }
  }

  /**
   * 🔄 SINCRONIZACIÓN: Crear Flutter Screen vacío para clase que aún no tiene
   * POST /flutter-screen/sincronizar/:id_sala/:id_clase
   * Útil para diagramas antiguos creados antes de la migración
   */
  async sincronizarClaseAntigua(req: Request, res: Response): Promise<void> {
    const client = await this.db.connect();
    try {
      const { id_sala, id_clase } = req.params;

      // Verificar que la clase existe en la sala
      const claseResult = await client.query(
        'SELECT id_clase, nombre FROM clase_uml WHERE id_clase = $1 AND id_sala = $2',
        [id_clase, id_sala]
      );

      if (claseResult.rows.length === 0) {
        res.status(404).json({
          ok: false,
          error: 'Clase UML no encontrada en esta sala'
        });
        return;
      }

      const clase = claseResult.rows[0];

      // Verificar si YA existe flutter_screen para esta clase
      const screenExistente = await client.query(
        'SELECT id_screen FROM flutter_screen WHERE id_clase = $1',
        [id_clase]
      );

      if (screenExistente.rows.length > 0) {
        res.json({
          ok: true,
          mensaje: 'Esta clase ya tiene Flutter Screen',
          id_screen: screenExistente.rows[0].id_screen,
          ya_existe: true
        });
        return;
      }

      // Crear Flutter Screen vacío para esta clase
      await client.query('BEGIN');

      const nuevoScreen = await client.query(
        `INSERT INTO flutter_screen (id_clase, nombre_screen, componentes_json)
         VALUES ($1, $2, $3)
         RETURNING id_screen, fecha_creacion`,
        [id_clase, `Screen - ${clase.nombre}`, JSON.stringify([])]
      );

      const id_screen = nuevoScreen.rows[0].id_screen;

      await client.query('COMMIT');

      console.log(`✅ Flutter Screen sincronizado para clase antigua: id_clase=${id_clase}, id_screen=${id_screen}`);

      res.json({
        ok: true,
        mensaje: 'Clase sincronizada - Flutter Screen creado vacío',
        id_screen,
        id_clase,
        ya_existe: false,
        listo_para_usar: true
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('❌ Error al sincronizar clase antigua:', error);
      res.status(500).json({
        ok: false,
        error: 'Error al sincronizar clase',
        details: error.message
      });
    } finally {
      client.release();
    }
  }

  /**
   * 🔄 MIGRACIÓN MASIVA: Sincronizar TODAS las clases de una sala que no tienen Flutter Screen
   * POST /flutter-screen/migrar-sala/:id_sala
   * Útil para migrar toda una sala de una vez
   */
  async migrarSalaCompleta(req: Request, res: Response): Promise<void> {
    const client = await this.db.connect();
    try {
      const { id_sala } = req.params;

      // Obtener todas las clases de la sala que NO tienen flutter_screen
      const clasesResult = await client.query(
        `SELECT cu.id_clase, cu.nombre 
         FROM clase_uml cu
         LEFT JOIN flutter_screen fs ON cu.id_clase = fs.id_clase
         WHERE cu.id_sala = $1 AND fs.id_screen IS NULL
         ORDER BY cu.id_clase`,
        [id_sala]
      );

      const clasesParaMigrar = clasesResult.rows;

      if (clasesParaMigrar.length === 0) {
        res.json({
          ok: true,
          mensaje: 'Todas las clases de esta sala ya tienen Flutter Screen',
          migraciones_realizadas: 0,
          clases_pendientes: []
        });
        return;
      }

      await client.query('BEGIN');

      let migracionesRealizadas = 0;

      for (const clase of clasesParaMigrar) {
        try {
          const resultado = await client.query(
            `INSERT INTO flutter_screen (id_clase, nombre_screen, componentes_json)
             VALUES ($1, $2, $3)
             ON CONFLICT (id_clase) DO NOTHING
             RETURNING id_screen`,
            [clase.id_clase, `Screen - ${clase.nombre}`, JSON.stringify([])]
          );

          if (resultado.rows.length > 0) {
            migracionesRealizadas++;
            console.log(`✅ Migrado: ${clase.nombre} (id_clase=${clase.id_clase})`);
          }
        } catch (err) {
          console.warn(`⚠️ Error migrando clase ${clase.nombre}:`, err);
          // Continuamos con la siguiente
        }
      }

      await client.query('COMMIT');

      res.json({
        ok: true,
        mensaje: `Migración completada: ${migracionesRealizadas}/${clasesParaMigrar.length} clases sincronizadas`,
        migraciones_realizadas: migracionesRealizadas,
        clases_migrantes: clasesParaMigrar,
        listo_para_usar: true
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('❌ Error en migración masiva:', error);
      res.status(500).json({
        ok: false,
        error: 'Error en migración masiva',
        details: error.message
      });
    } finally {
      client.release();
    }
  }
}
