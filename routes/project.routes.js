require("dotenv").config();
// const {KEY} = process.env;
const {Router} = require("express");
const  router = Router();
const db = require('../db/database');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
//importar middleware de autenticacion
const  {autenticacion} = require("../middleware/auth");
//importar autorizaciones middleware
const {isAuthorized} = require("../middleware/authorized");
// **************************************** PROJECTS **************************************************
// *********############### ENDPOINTS PARA USER "PM" *************#########################################
//CREACION DE PROYECTO NUEVO
router.post('/create-project',autenticacion,isAuthorized("PM"), async (req, res) => {
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
router.get("/projects",autenticacion,isAuthorized(['PM','QA']),(req, res) => {
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
router.get("/projects-run",autenticacion,isAuthorized("PM"), (req, res) => {
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
router.get('/projects-name',autenticacion,isAuthorized("PM"), (req, res) => {
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
router.post('/assign-users',autenticacion,isAuthorized("PM"), (req, res) => {
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
router.delete('/projects/:id',autenticacion,isAuthorized("PM"), (req, res) => {
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
router.get("/projects/:idproject/users",autenticacion,isAuthorized(['QA','PM']), (req, res) => {
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
router.get('/projects/count',autenticacion,isAuthorized("PM"), (req, res) => {
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
router.get('/projects/in-progress',autenticacion,isAuthorized("PM"), (req, res) => {
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
router.get('/projects/completed',autenticacion,isAuthorized("PM"), (req, res) => {
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
router.get('/projects/:id',autenticacion,isAuthorized("PM"), (req, res) => {
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
router.put('/projects/:id',autenticacion,isAuthorized("PM"), (req, res) => {
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
router.get('/projects/:id/qa-users',autenticacion,isAuthorized(['QA','PM']), (req, res) => {
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
router.delete('/projects/:projectId/qa-users/:userId',autenticacion,isAuthorized("PM"), (req, res) => {
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
router.post('/check-assigned-users',autenticacion,isAuthorized("PM"), (req, res) => {
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

//*************************PARA REPORTES******************************** */
// Endpoint para obtener un reporte específico para QA
router.get("/reports-qa/:id", autenticacion, isAuthorized("QA"), (req, res) => {
    const reportId = req.params.id; // ID del reporte a obtener

    // Consulta para obtener el reporte específico
    const queryGetReport = `
  SELECT 
                tc.codigo_caso,
                tc.nombre_caso,
                p.nombre_proyecto,                        -- Se asume que este es el nombre del proyecto
                u.nombre_completo AS usuario_reporta,              -- Suponiendo que tienes una tabla de usuarios para obtener el nombre
                r.resumen,
                r.prioridad,
                r.precondiciones,
                r.datos_entrada,
                r.pasos,
                r.resultado_esperado,
                r.resultado_obtenido,
                r.ambiente_version,
                r.fecha_ejecucion
            FROM 
                report r
            JOIN 
                test_case tc ON r.id_test_case = tc.idtest_case
            JOIN 
                users u ON tc.usuario_reporta = u.iduser  -- Suponiendo que este es el campo que relaciona al usuario que reporta
            JOIN 
                projects p ON tc.proyecto_asignado = p.idproject     -- Suponiendo que este es el campo que relaciona el proyecto
            WHERE 
                r.id_test = ?
    `;

    db.query(queryGetReport, [reportId], (err, results) => {
        if (err) {
            console.error("Error al obtener el reporte:", err);
            return res.status(500).json({ error: 'Error al obtener el reporte' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Reporte no encontrado' });
        }

        // Responder con los resultados
        res.status(200).json(results[0]); // Devolviendo solo el primer resultado
    });
});

//CARGA TODOS LOS REPORTES CREADOS
router.get("/all-reports", autenticacion, isAuthorized("PM"), (req, res) => {
    // Consulta para obtener los reportes, incluyendo el nombre del usuario asignado al test_case
    const queryGetReports = `
        SELECT 
            r.id_test,
            tc.codigo_caso AS codigo_test_case, 
            r.resumen, 
            r.resultado_esperado, 
            r.resultado_obtenido, 
            r.fecha_ejecucion,
            r.estado,
            u.nombre_completo AS usuario_asignado  
        FROM 
            report r
        JOIN 
            test_report tr ON r.id_test = tr.idreport
        JOIN 
            test_case tc ON tr.idtest_case = tc.idtest_case
        JOIN 
            users u ON tc.id_usuario_asignado = u.iduser`;

    db.query(queryGetReports, (err, results) => {
        if (err) {
            console.error("Error al obtener los reportes:", err);
            return res.status(500).json({ error: 'Error al obtener los reportes' });
        }

        // Responder con los resultados
        res.status(200).json(results);
    });
});

//CARGA EL REPORTE COMPLETO PARA VISUALIZARLO
router.get("/full-report/:id", autenticacion, isAuthorized("PM"), (req, res) => {
    const reportId = req.params.id; // ID del reporte a obtener

    // Consulta SQL para obtener el reporte completo con los detalles requeridos
    const queryGetFullReport = `
        SELECT 
            tc.codigo_caso,
            tc.nombre_caso,
            p.nombre_proyecto AS nombre_proyecto_asignado,
            u_encargado.nombre_completo AS usuario_encargado,         
            u_reporta.nombre_completo AS usuario_reporta,           
            u_asignado.nombre_completo AS usuario_asignado,          
            tc.prioridad AS prioridad_test_case,
            tc.estado AS estado,
            r.resumen,
            r.prioridad AS prioridad_reporte,
            r.precondiciones,
            r.datos_entrada,
            r.pasos,
            r.resultado_esperado,
            r.resultado_obtenido,
            r.ambiente_version,
            r.fecha_ejecucion
        FROM 
            report r
        JOIN 
            test_case tc ON r.id_test_case = tc.idtest_case
        JOIN 
            users u_reporta ON tc.usuario_reporta = u_reporta.iduser  -- Usuario que reporta el test case
        JOIN 
            projects p ON tc.proyecto_asignado = p.idproject          -- Proyecto asignado
        JOIN 
            users u_encargado ON p.id_usuario_responsable = u_encargado.iduser -- Usuario encargado del proyecto
        JOIN 
            users u_asignado ON tc.id_usuario_asignado = u_asignado.iduser     -- Usuario asignado al test_case
        WHERE 
            r.id_test = ?;
    `;

    db.query(queryGetFullReport, [reportId], (err, results) => {
        if (err) {
            console.error("Error al obtener el reporte completo:", err);
            return res.status(500).json({ error: 'Error al obtener el reporte completo' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Reporte no encontrado' });
        }

        // Responder con el primer resultado (reporte completo)
        res.status(200).json(results[0]);
    });
});

// Endpoint para contar reportes
router.get('/reports-count', autenticacion, isAuthorized("PM"), (req, res) => {
    const query = `SELECT COUNT(*) AS total_reportes 
    FROM report
    WHERE estado = "en curso";`;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al contar los reportes.');
        }
        res.status(200).json(results[0]); // Devuelve solo el primer resultado
    });
});

// Actualizar el estado de un reporte y su caso de prueba
router.put('/report-resolved/:id', autenticacion, isAuthorized("PM"), async (req, res) => {
    const reportId = req.params.id;

    try {
        // Cambiar el estado del reporte
        const updateReportQuery = `
            UPDATE reports 
            SET estado = 'finalizado' 
            WHERE id_test = ?`;

        const [reportResult] = await db.query(updateReportQuery, [reportId]);

        if (reportResult.affectedRows === 0) {
            return res.status(404).send('Reporte no encontrado'); // Si no se encontró el reporte
        }

        // Aquí debes obtener el ID del test_case relacionado
        const testCaseId = await getTestCaseId(reportId); // Función hipotética para obtener el ID del caso de prueba

        // Cambiar el estado del caso de prueba
        const updateTestCaseQuery = `
            UPDATE test_case 
            SET estado = 'finalizado' 
            WHERE idtest_case = ?`;

        const [testCaseResult] = await db.query(updateTestCaseQuery, [testCaseId]);

        if (testCaseResult.affectedRows === 0) {
            return res.status(404).send('Caso de prueba no encontrado'); // Si no se encontró el caso de prueba
        }

        res.status(200).send('Reporte y caso marcados como finalizados'); // Respuesta de éxito
    } catch (error) {
        console.error("Error al marcar como resuelto:", error);
        res.status(500).send('Error al marcar como resuelto');
    }
});

/*
// Función para obtener el ID del caso de prueba relacionado con el reporte
const getTestCaseId = async (reportId) => {
    const query = 'SELECT id_test_case FROM report WHERE id_test = ?';
    const [result] = await db.query(query, [reportId]);
    return result.length > 0 ? result[0].id_test_case : null; // Devuelve el ID del caso de prueba o null
};*/

// Endpoint para marcar un reporte y su caso de prueba como finalizados
router.put('/resolved/:id', autenticacion, isAuthorized("PM"), async (req, res) => {
    const reportId = req.params.id;

    try {
        // Consultar y actualizar en una sola operación
        const queryUpdate = `
            UPDATE report r
            JOIN test_case tc ON r.id_test_case = tc.idtest_case
            SET r.estado = 'finalizado', tc.estado = 'finalizado'
            WHERE r.id_test = ?`;

        const result = await db.query(queryUpdate, [reportId]);

        // Verificar si se actualizó algún registro
        if (result.affectedRows === 0) {
            return res.status(404).send('Reporte no encontrado o ya resuelto');
        }

        res.status(200).send('Reporte y caso de prueba marcados como resueltos');
    } catch (error) {
        console.error("Error al marcar el reporte como resuelto:", error);
        res.status(500).send('Error al marcar el reporte como resuelto');
    }
});


module.exports =  router;