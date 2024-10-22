//referencia a express
const express = require("express");
const app = express();
// importamos mysql
const mysql = require("mysql");
const cors = require("cors");

//para encriptar mis contraseñas
const bcrypt = require('bcrypt');

//indicar a la aplicacion antes de ejecutar cualquier cosa debe usar
app.use(cors());
app.use(express.json());

//conexion hacia la base de datos
const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"testing"
});


// ****************************************************** USERS ************************************************************
// Creación de la petición para registrar un nuevo usuario
app.post('/register-user', async (req, res) => {
    const { codigo, nombre, correo, password, rol } = req.body;
  
    // Validar que todos los campos necesarios estén presentes
    if (!codigo || !nombre || !correo || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
  
    // Aquí puedes agregar lógica para verificar si el correo ya existe
    db.query('SELECT * FROM users WHERE correo = ?', [correo], async (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al verificar el correo.' });
      }
      if (results.length > 0) {
        return res.status(400).json({ error: 'El correo ya está registrado.' });
      }
  
      // Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Crear el nuevo usuario
      const newUser = {
        codigo,
        nombre_completo: nombre,
        correo,
        password: hashedPassword, // Guarda la contraseña encriptada
        rol,
        status: 'activo', // Por defecto el status es "activo"
      };
  
      // Inserta el nuevo usuario en la base de datos
      db.query('INSERT INTO users SET ?', newUser, (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error al registrar el usuario.' });
        }
        res.status(201).json({ message: 'Usuario registrado con éxito.' });
      });
    });
  });
  
// Método para listar los usuarios registrados
app.get("/usuarios", (req, res) => {
    db.query(
        `SELECT 
            iduser AS id,
            codigo,
            nombre_completo AS nombre,
            correo,
            rol,
            status,
            creado AS fecha_creacion
        FROM users`,
        (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error en la consulta');
            } else {
                res.send(result);
            }
        }
    );
});

// metodo para crear un proyecto
/*
app.post('/create-project', async (req, res) => {
    const { codigo_proyecto, nombre_proyecto, descripcion, fecha_terminacion, id_usuario_responsable } = req.body;

    try {
        // Verifica si el código del proyecto ya existe
        const existingProject = await db.query(`SELECT * FROM projects WHERE codigo_proyecto = ?`, [codigo_proyecto]);

        if (existingProject.length > 0) {
            // Si ya existe, responde con un mensaje de error
            return res.status(400).json({ message: 'El código del proyecto ya está en uso.' });
        }

        // Inserta el proyecto
        const projectResult = await db.query(`INSERT INTO projects (codigo_proyecto, nombre_proyecto, descripcion, fecha_terminacion, id_usuario_responsable) VALUES (?, ?, ?, ?, ?)`, 
            [codigo_proyecto, nombre_proyecto, descripcion, fecha_terminacion, id_usuario_responsable]);

        const projectId = projectResult.insertId; // Obtener el ID del proyecto insertado

        // Responder con un mensaje de éxito
        res.status(200).json({ message: 'Proyecto creado exitosamente', projectId });
    } catch (err) {
        console.error("Error al crear el proyecto:", err.message); // Detalle del error
        res.status(500).send('Error al crear el proyecto');
    }
});*/

// Endpoint para actualizar el status de un usuario a "inactivo"
app.put('/usuarios/:iduser/status', (req, res) => {
    const iduser = req.params.iduser;
    const { status } = req.body;

    const query = `UPDATE users SET status = ? WHERE iduser = ?`;
    db.query(query, [status, iduser], (err, result) => {
        if (err) {
            console.error("Error al actualizar el estado del usuario:", err);
            return res.status(500).send('Error al actualizar el estado del usuario.');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Usuario no encontrado'); // Si no se encontró el usuario
        }
        res.status(200).send(`Estado del usuario actualizado a ${status} correctamente.`); // Respuesta de éxito
    });
});

// Obtener usuarios QA
app.get('/users/qa', (req, res) => {
    const query = `SELECT iduser, nombre_completo FROM users WHERE rol = 'QA'`;
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error al obtener usuarios QA');
        } else {
            res.status(200).json(results);
        }
    });
});

// Obtener usuarios PM
app.get('/users/pm', (req, res) => {
    const query = `SELECT iduser, nombre_completo FROM users WHERE rol = 'PM'`;
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error al obtener usuarios PM');
        } else {
            res.status(200).json(results);
        }
    });
});

// **************************************** PROJECTS **************************************************

//CREACION DE PROYECTO NUEVO
app.post('/create-project', async (req, res) => {
    const { codigo_proyecto, nombre_proyecto, descripcion, fecha_terminacion, id_usuario_responsable } = req.body;

    try {
        // Inserta el proyecto
        const projectResult = await db.query(`INSERT INTO projects (codigo_proyecto, nombre_proyecto, descripcion, fecha_terminacion, id_usuario_responsable) VALUES (?, ?, ?, ?, ?)`, 
            [codigo_proyecto, nombre_proyecto, descripcion, fecha_terminacion, id_usuario_responsable]);

        const projectId = projectResult.insertId; // Obtener el ID del proyecto insertado

        // Responder con un mensaje de éxito
        res.status(200).json({ message: 'Proyecto creado exitosamente', projectId });
    } catch (err) {
        console.error("Error al crear el proyecto:", err.message); // Detalle del error
        res.status(500).send('Error al crear el proyecto');
    }
});

// Método para listar los proyectos
app.get("/projects", (req, res) => {
    db.query(
        `SELECT 
            p.idproject,
            p.codigo_proyecto AS codigo,
            p.nombre_proyecto AS nombre,
            p.descripcion,
            u.nombre_completo AS usuario_responsable,
            p.fecha_terminacion AS fecha_terminacion,
            p.estado AS estado -- Asegúrate de incluir el estado aquí
        FROM projects p
        JOIN users u ON p.id_usuario_responsable = u.iduser`,
        (err, result) => {
            if (err) {
                console.log("Error en la consulta:", err);
                res.status(500).send('Error en la consulta');
            } else {
                //console.log("Resultados de la consulta:", result); // Agrega esto
                res.send(result);
            }
        }
    );
});

// Método para listar los proyectos QUE NO HAN FINALIZADO
app.get("/projects-run", (req, res) => {
    db.query(
        `SELECT 
            p.idproject,
            p.codigo_proyecto AS codigo,
            p.nombre_proyecto AS nombre,
            p.descripcion,
            u.nombre_completo AS usuario_responsable,
            p.fecha_terminacion AS fecha_terminacion,
            p.estado AS estado -- Asegúrate de incluir el estado aquí
        FROM projects p
        JOIN users u ON p.id_usuario_responsable = u.iduser
        WHERE p.estado = 'en curso'`,
        (err, result) => {
            if (err) {
                console.log("Error en la consulta:", err);
                res.status(500).send('Error en la consulta');
            } else {
                console.log("Resultados de la consulta:", result); // Agrega esto
                res.send(result);
            }
        }
    );
});

/*
app.get("/projects", (req, res) => {
    db.query(
        `SELECT 
            p.codigo_proyecto AS codigo,
            p.nombre_proyecto AS nombre,
            p.descripcion,
            u.nombre_completo AS usuario_responsable,
            p.fecha_terminacion AS fecha_terminacion
        FROM projects p
        JOIN users u ON p.id_usuario_responsable = u.iduser`,
        (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error en la consulta');
            } else {
                res.send(result);
            }
        }
    );
});*/
// Obtener proyectos creados
app.get('/projects-name', (req, res) => {
    const query = `SELECT idproject AS value, nombre_proyecto AS label FROM projects
    WHERE estado = 'en curso'`;
    db.query(query, (err, results) => {
        if (err) {
            console.error(err); // Muestra el error en la consola del servidor
            res.status(500).json({ error: 'Error al obtener proyectos' });
        } else {
            res.status(200).json(results); // Envía los resultados al cliente
        }
    });
});


// Asignar usuarios a un proyecto
app.post('/assign-users', (req, res) => {
    const { projectId, userIds } = req.body;

    if (!projectId || !userIds || !Array.isArray(userIds)) {
        return res.status(400).send('Faltan datos requeridos');
    }

    const queries = userIds.map(userId => {
        return new Promise((resolve, reject) => {
            // Usamos INSERT IGNORE para evitar duplicados
            const query = 'INSERT IGNORE INTO user_project (id_usuario, id_project) VALUES (?, ?)';
            db.query(query, [userId, projectId], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    });

    Promise.all(queries)
        .then(() => res.status(200).send('Usuarios asignados exitosamente'))
        .catch(err => {
            console.error(err);
            res.status(500).send('Error al asignar usuarios');
        });
});

/*
// Verifica si un usuario ya se encuentra  asignado a un caso de prueba
app.post('/assign-user', (req, res) => {
    const { id_user, id_test_case } = req.body;

    // Verificar si el usuario ya está asignado a este caso en test_case
    const checkQuery = `
        SELECT * FROM test_case 
        WHERE id_usuario_asignado = ? AND codigo = ?
    `;

    db.query(checkQuery, [id_user, id_test_case], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en la verificación de asignación');
        }

        if (results.length > 0) {
            // Si ya está asignado, enviar un mensaje de que ya fue asignado antes
            return res.status(400).json({ message: 'Este usuario ya está asignado a este caso de prueba' });
        }

        // Si no está asignado, realizar la asignación actualizando el registro del caso de prueba
        const assignQuery = `
            UPDATE test_case 
            SET id_usuario_asignado = ?
            WHERE codigo = ?
        `;
        db.query(assignQuery, [id_user, id_test_case], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error en la asignación del usuario');
            }

            res.status(200).json({ message: 'Usuario asignado exitosamente' });
        });
    });
});*/

// metodo para eliminar un proyecto
app.delete('/projects/:id', (req, res) => {
    const { id } = req.params; // Obtener el ID del proyecto desde los parámetros de la URL
    const query = `DELETE FROM projects WHERE idproject = ?`; // Cambia 'idproyecto' a 'idproject'

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al eliminar el proyecto');
        }

        if (results.affectedRows === 0) {
            return res.status(404).send('Proyecto no encontrado'); // No se encontró el proyecto con ese ID
        }

        res.status(200).send('Proyecto eliminado con éxito'); // Respuesta de éxito
    });
});

// Método para listar los usuarios asignados a un proyecto
app.get("/projects/:idproject/users", (req, res) => {
    const projectId = req.params.idproject;

    db.query(
        `SELECT 
            u.iduser, 
            u.nombre_completo 
        FROM users u
        JOIN user_project up ON u.iduser = up.id_usuario
        WHERE up.id_project = ?`,
        [projectId],
        (err, result) => {
            if (err) {
                console.log("Error al obtener usuarios del proyecto:", err);
                res.status(500).send('Error al obtener usuarios del proyecto');
            } else {
                res.send(result);
            }
        }
    );
});

// Endpoint para contar proyectos creados
app.get('/projects/count', (req, res) => {
    const query = `SELECT COUNT(*) AS Proyectos_Creados FROM projects;`;
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener la cantidad de proyectos.');
        }
        res.status(200).json(results[0]); // Devuelve solo el primer resultado
    });
});

// Endpoint para contar proyectos en curso
app.get('/projects/in-progress', (req, res) => {
    const query = `SELECT COUNT(*) AS Proyectos_En_Curso FROM projects WHERE fecha_terminacion > NOW() AND estado = 'en curso';`;
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener la cantidad de proyectos en curso.');
        }
        res.status(200).json(results[0]);
    });
});

// Endpoint para contar proyectos terminados
app.get('/projects/completed', (req, res) => {
    const query = `SELECT COUNT(*) AS Proyectos_Terminados FROM projects WHERE estado = 'finalizado'`;
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener la cantidad de proyectos terminados.');
        }
        res.status(200).json(results[0]);
    });
});

// Obtener detalles de un proyecto específico
app.get('/projects/:id', (req, res) => {
    const projectId = req.params.id;

    db.query(
        `SELECT 
            p.idproject,
            p.codigo_proyecto AS codigo,
            p.nombre_proyecto AS nombre,
            p.descripcion,
            p.fecha_terminacion AS fecha_terminacion,
            u.nombre_completo AS usuario_responsable,
            p.estado
        FROM projects p
        JOIN users u ON p.id_usuario_responsable = u.iduser
        WHERE p.idproject = ?`,
        [projectId],
        (err, result) => {
            if (err) {
                console.error("Error al obtener los detalles del proyecto:", err);
                return res.status(500).send('Error al obtener los detalles del proyecto');
            }
            if (result.length === 0) {
                return res.status(404).send('Proyecto no encontrado'); // Si no se encontró el proyecto
            }
            res.status(200).json(result[0]); // Devuelve el primer resultado
        }
    );
});

// Actualizar un proyecto existente
app.put('/projects/:id', (req, res) => {
    const projectId = req.params.id;
    const { codigo_proyecto, nombre_proyecto, descripcion, fecha_terminacion, id_usuario_responsable, estado } = req.body;

    // Consulta para actualizar el proyecto
    const query = `
        UPDATE projects 
        SET 
            codigo_proyecto = ?, 
            nombre_proyecto = ?, 
            descripcion = ?, 
            fecha_terminacion = ?, 
            id_usuario_responsable = ?,
            estado = ? -- Asegúrate de incluir el estado aquí
        WHERE idproject = ?`;

    db.query(query, [codigo_proyecto, nombre_proyecto, descripcion, fecha_terminacion, id_usuario_responsable, estado, projectId], (err, result) => {
        if (err) {
            console.error("Error al actualizar el proyecto:", err);
            return res.status(500).send('Error al actualizar el proyecto');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Proyecto no encontrado'); // Si no se encontró el proyecto
        }

        res.status(200).send('Proyecto actualizado con éxito'); // Respuesta de éxito
    });
});

// cargar los usuarios asignados a ese proyecto
app.get('/projects/:id/qa-users', (req, res) => {
    const projectId = req.params.id;
    const query = `
        SELECT u.iduser, u.nombre_completo, u.rol
        FROM users u
        JOIN user_project up ON u.iduser = up.id_usuario
        WHERE up.id_project = ?
    `;
    
    db.query(query, [projectId], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error al obtener usuarios QA');
        } else {
            res.status(200).json(results);
        }
    });
});

// eliminar a un usuario asignado al proyecto
app.delete('/projects/:projectId/qa-users/:userId', (req, res) => {
    const { projectId, userId } = req.params;
    const query = `DELETE FROM user_project WHERE id_usuario = ? AND id_project = ?`;
    
    db.query(query, [userId, projectId], (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error al eliminar usuario QA del proyecto');
        } else {
            res.status(204).send(); // Sin contenido
        }
    });
});

// Verificar si los usuarios ya están asignados a un proyecto
app.post('/check-assigned-users', (req, res) => {
    const { projectId, userIds } = req.body;

    if (!projectId || !userIds || !Array.isArray(userIds)) {
        return res.status(400).send('Faltan datos requeridos');
    }

    const query = `
        SELECT id_usuario FROM user_project 
        WHERE id_project = ? AND id_usuario IN (?)
    `;
    
    db.query(query, [projectId, userIds], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al verificar usuarios asignados');
        }
        
        const assignedUsers = results.map(row => row.id_usuario);
        res.status(200).json(assignedUsers);
    });
});


// *********************************************** TEST-CASE ******************************************************
// AGREGAR UN NUEVO CASO DE PRUEBA
app.post("/test-case", (req, res) => {
    const { codigo_caso, nombre_caso, descripcion, usuario_reporta, prioridad, id_usuario_asignado, proyecto_asignado, link_recurso } = req.body;

    // Consulta para insertar un nuevo caso de prueba
    const query = `
        INSERT INTO test_case (codigo_caso, nombre_caso, descripcion, usuario_reporta, prioridad, id_usuario_asignado, proyecto_asignado, link_recurso)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [codigo_caso, nombre_caso, descripcion, usuario_reporta, prioridad, id_usuario_asignado, proyecto_asignado, link_recurso], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al registrar el caso de prueba' });
        }
        res.status(201).json({ message: 'Caso de prueba registrado con éxito', id: result.insertId });
    });
});

// Endpoint para obtener los casos de prueba
app.get("/test-cases", (req, res) => {
    const query = `
        SELECT 
            tc.idtest_case,
            tc.codigo_caso AS codigo_caso,
            tc.nombre_caso AS nombre_caso,
            u_reporta.nombre_completo AS usuario_reporta,
            u_asignado.nombre_completo AS usuario_asignado,
            tc.prioridad,
            tc.fecha_reporte
        FROM test_case tc
        JOIN users u_reporta ON tc.usuario_reporta = u_reporta.iduser
        JOIN users u_asignado ON tc.id_usuario_asignado = u_asignado.iduser
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error en la consulta');
        } else {
            res.send(result);
        }
    });
});

// Eliminar un caso de prueba por su ID
app.delete("/test-cases/:id", (req, res) => {
    const { id } = req.params; // Obtén el ID del caso de prueba desde los parámetros de la URL

    const deleteQuery = "DELETE FROM test_case WHERE idtest_case = ?"; // Asegúrate de que el nombre de tu tabla sea correcto

    db.query(deleteQuery, [id], (err, result) => {
        if (err) {
            console.error("Error al eliminar el caso de prueba:", err);
            res.status(500).send("Error al eliminar el caso de prueba.");
        } else if (result.affectedRows === 0) {
            res.status(404).send("El caso de prueba no fue encontrado.");
        } else {
            res.status(200).send("Caso de prueba eliminado correctamente.");
        }
    });
});


// *************************************************MENSAJES DEL SERVIDOR*******************************************
//decimos que vamos a escuchar por un puerto
app.listen(3001, () => { 
    console.log("Servidor escuchando en el puerto 3001");
    });

