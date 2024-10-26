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
const {isAuthorized} = require("../middleware/authorized")

//******************************************para usarios PM ******************************************* */
// AGREGAR UN NUEVO CASO DE PRUEBA
router.post("/test-case",autenticacion,isAuthorized("PM"), (req, res) => {
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
router.get("/test-cases",autenticacion,isAuthorized("PM"), (req, res) => {
    const query = `
        SELECT 
            tc.idtest_case,
            tc.codigo_caso AS codigo_caso,
            tc.nombre_caso AS nombre_caso,
            u_reporta.nombre_completo AS usuario_reporta,
            u_asignado.nombre_completo AS usuario_asignado,
            tc.prioridad,
            tc.estado,
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

// Endpoint para obtener los detalles de un caso de prueba específico
// Endpoint para obtener los detalles de un caso de prueba específico
router.get("/all-cases/:id", autenticacion, isAuthorized("PM"), (req, res) => {
    const testCaseId = req.params.id; // Obtener el ID del caso de prueba desde los parámetros de la solicitud

    const query = `
        SELECT 
            tc.idtest_case AS id,
            tc.codigo_caso AS codigo_caso,
            tc.nombre_caso AS nombre_caso,
            tc.descripcion AS descripcion,
            u_reporta.nombre_completo AS usuario_reporta,
            u_asignado.nombre_completo AS usuario_asignado,
            tc.prioridad,
            tc.fecha_reporte,
            tc.link_recurso,
            p.idproject AS id_proyecto,
            p.nombre_proyecto AS nombre_proyecto
        FROM test_case tc
        JOIN users u_reporta ON tc.usuario_reporta = u_reporta.iduser
        JOIN users u_asignado ON tc.id_usuario_asignado = u_asignado.iduser
        JOIN projects p ON tc.proyecto_asignado = p.idproject
        WHERE tc.idtest_case = ?`; // Filtrar por el ID del caso de prueba

    db.query(query, [testCaseId], (err, result) => {
        if (err) {
            console.error("Error al obtener los detalles del caso de prueba:", err);
            return res.status(500).send('Error en la consulta');
        }
        if (result.length === 0) {
            return res.status(404).send('Caso de prueba no encontrado'); // Si no se encontró el caso de prueba
        }
        res.status(200).json(result[0]); // Devuelve el primer resultado
    });
});

// Endpoint para actualizar los datos de un caso de prueba específico
router.put('/update-case/:id', autenticacion, isAuthorized("PM"), (req, res) => {
    const testCaseId = req.params.id;
    const { 
        codigo_caso, 
        nombre_caso, 
        descripcion, 
        usuario_reporta, 
        prioridad, 
        id_usuario_asignado, 
        proyecto_asignado, 
        link_recurso 
    } = req.body;

    // Consulta para actualizar el caso de prueba
    const query = `
        UPDATE test_case
        SET 
            codigo_caso = ?, 
            nombre_caso = ?, 
            descripcion = ?, 
            usuario_reporta = ?, 
            prioridad = ?, 
            id_usuario_asignado = ?, 
            proyecto_asignado = ?, 
            link_recurso = ? 
        WHERE idtest_case = ?`;

    db.query(query, [
        codigo_caso, 
        nombre_caso, 
        descripcion, 
        usuario_reporta, 
        prioridad, 
        id_usuario_asignado, 
        proyecto_asignado, 
        link_recurso, 
        testCaseId
    ], (err, result) => {
        if (err) {
            console.error("Error al actualizar el caso de prueba:", err);
            return res.status(500).send('Error al actualizar el caso de prueba');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Caso de prueba no encontrado'); // Si no se encontró el caso de prueba
        }

        res.status(200).send('Caso de prueba actualizado con éxito'); // Respuesta de éxito
    });
});


// Eliminar un caso de prueba por su ID
router.delete("/test-cases/:id",autenticacion,isAuthorized("PM"), (req, res) => {
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

// Endpoint para contar los casos en progreso
router.get('/test-cases/in-progress', autenticacion,isAuthorized("PM"), (req, res) => {
    const query = 'SELECT COUNT(*) AS Casos_Creados FROM test_case WHERE estado = "en progreso"';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al contar casos en progreso:', err);
            return res.status(500).json({ message: 'Error al contar casos en progreso.' });
        }

        const totalCases = results[0].Casos_Creados;
        return res.status(200).json({ Casos_Creados: totalCases });
    });
});


//******************************************para usuarios QA************************************************************ */
// MUESTRA LOS CASOS DE PRUEBA ASIGNADOS A UN USUARIO
router.get("/assigned-cases", autenticacion, isAuthorized("QA"), (req, res) => {
    const userId = req.usuario.iduser; // Obtener el ID del usuario del token

    const query = `
        SELECT DISTINCT
            tc.idtest_case,
            tc.codigo_caso, 
            tc.nombre_caso, 
            tc.descripcion,
            u_reporta.nombre_completo AS usuario_reporta,  -- Obtener el nombre completo del usuario que reporta
            tc.estado, 
            tc.fecha_reporte,
            tc.prioridad, -- Obtener la prioridad del test case
            p.nombre_proyecto -- Obtener el nombre del proyecto asignado
        FROM 
            test_case tc
        JOIN 
            user_project up ON tc.id_usuario_asignado = up.id_usuario
        JOIN 
            users u_reporta ON tc.usuario_reporta = u_reporta.iduser -- Hacer JOIN con la tabla de usuarios
        JOIN 
            projects p ON tc.proyecto_asignado = p.idproject -- Hacer JOIN con la tabla de proyectos
        WHERE 
            up.id_usuario = ? AND tc.estado = 'en progreso'
    `;

    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).send('Error en la consulta');
        }

        // Verificar si se encontraron casos
        if (result.length === 0) {
            return res.status(404).json({ message: "No se encontraron casos asignados." });
        }

        res.send(result);
    });
});

// ENDPOINT PARA CONTAR LOS CASOS DE PRUEBA ASIGNADOS A UN USUARIO
router.get('/assigned-test-cases-count', autenticacion, isAuthorized(['QA', 'PM']), (req, res) => {
    const userId = req.usuario.iduser; // Obtén el ID del usuario desde req.usuario

    console.log('User ID:', userId); // Verificar el ID del usuario

    const query = `
        SELECT COUNT(*) as totalTestCases 
        FROM test_case
        WHERE id_usuario_asignado = ? AND estado = 'en progreso'
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error al contar casos de prueba asignados:', err);
            return res.status(500).json({ message: 'Error al contar casos de prueba asignados.' });
        }

        const totalTestCases = results[0].totalTestCases;
        return res.status(200).json({ assignedTestCasesCount: totalTestCases });
    });
});

//ENDPOINT PARA VISUALIZAR LOS DETALLES DE UN CASO
router.get("/details-cases/:id", autenticacion, isAuthorized("QA"), (req, res) => {
    const userId = req.usuario.iduser; // Obtener el ID del usuario del token
    const caseId = req.params.id; // Obtener el ID del caso de los parámetros

    const query = `
        SELECT DISTINCT
            tc.idtest_case,
            tc.codigo_caso, 
            tc.nombre_caso, 
            tc.descripcion,
            tc.link_recurso AS link,
            u_reporta.nombre_completo AS usuario_reporta,  
            tc.estado, 
            tc.fecha_reporte,
            tc.prioridad, -- Obtener la prioridad del test case
            p.nombre_proyecto -- Obtener el nombre del proyecto asignado
        FROM 
            test_case tc
        JOIN 
            user_project up ON tc.id_usuario_asignado = up.id_usuario
        JOIN 
            users u_reporta ON tc.usuario_reporta = u_reporta.iduser 
        JOIN 
            projects p ON tc.proyecto_asignado = p.idproject
        WHERE 
            up.id_usuario = ? AND tc.idtest_case = ?; 
    `;

    db.query(query, [userId, caseId], (err, result) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).send('Error en la consulta');
        }

        // Verificar si se encontraron casos
        if (result.length === 0) {
            return res.status(404).json({ message: "No se encontraron detalles para el caso." });
        }

        res.send(result[0]); // Enviar solo el primer resultado como detalle del caso
    });
});

//ENDPOINT PARA CREAR UN REPORTE
router.post("/create-report", autenticacion, isAuthorized("QA"), (req, res) => {
    const {
        resumen,
        prioridad,
        precondiciones,
        datos_entrada,
        pasos,
        resultado_esperado,
        resultado_obtenido,
        ambiente_version,
        fecha_ejecucion,
        id_test_case // ID del caso de prueba seleccionado
    } = req.body;

    // Consulta para insertar el nuevo reporte
    const queryInsertReport = `
        INSERT INTO report (resumen, prioridad, precondiciones, datos_entrada, pasos, resultado_esperado, resultado_obtenido, ambiente_version, fecha_ejecucion, id_test_case)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    // Ejecutar la inserción del reporte
    db.query(queryInsertReport, [resumen, prioridad, precondiciones, datos_entrada, pasos, resultado_esperado, resultado_obtenido, ambiente_version, fecha_ejecucion, id_test_case], (err, result) => {
        if (err) {
            console.error("Error al registrar el reporte:", err);
            return res.status(500).json({ error: 'Error al registrar el reporte' });
        }

        const reportId = result.insertId; // Obtener el ID del reporte recién creado

        // Consulta para insertar en la tabla de relación test_report
        const queryInsertTestReport = `
            INSERT INTO test_report (idtest_case, idreport)
            VALUES (?, ?)`;

        // Ejecutar la inserción en la tabla de relación
        db.query(queryInsertTestReport, [id_test_case, reportId], (err) => {
            if (err) {
                console.error("Error al registrar la relación en test_report:", err);
                return res.status(500).json({ error: 'Error al registrar la relación en test_report' });
            }

            // Responder con éxito
            res.status(201).json({ message: 'Reporte creado con éxito', id: reportId });
        });
    });
});

//ENDPOINT PARA OBTENER CIERTOS DATOS DE UN REPORTE PARA UN COMPONENTE LIST
router.get("/reports", autenticacion, isAuthorized(['QA']), (req, res) => {
    const userId = req.usuario.iduser; // Suponiendo que el ID del usuario se guarda en req.user

    // Consulta para obtener los reportes del usuario autenticado
    const queryGetReports = `
        SELECT 
            r.id_test,
            tc.codigo_caso AS codigo_test_case, 
            r.resumen, 
            r.resultado_esperado, 
            r.resultado_obtenido, 
            r.fecha_ejecucion
        FROM report r
        JOIN test_report tr ON r.id_test = tr.idreport
        JOIN test_case tc ON tr.idtest_case = tc.idtest_case
        WHERE tc.id_usuario_asignado = ? -- Filtrar por el ID del usuario
    `;

    db.query(queryGetReports, [userId], (err, results) => {
        if (err) {
            console.error("Error al obtener los reportes:", err);
            return res.status(500).json({ error: 'Error al obtener los reportes' });
        }

        // Responder con los resultados
        res.status(200).json(results);
    });
});


// Endpoint para obtener los detalles de un REPORTE específico
router.get('/user-reports/:id', autenticacion, isAuthorized(['QA']), (req, res) => {
    const reportId = req.params.id;

    db.query(
        `SELECT 
            r.id_test AS id,
            r.resumen, 
            r.prioridad, 
            r.precondiciones, 
            r.datos_entrada, 
            r.pasos, 
            r.resultado_esperado, 
            r.resultado_obtenido, 
            r.ambiente_version, 
            r.fecha_ejecucion, 
            tc.codigo_caso, 
            tc.nombre_caso, 
            tc.descripcion 
        FROM report r
        JOIN test_case tc ON r.id_test_case = tc.idtest_case
        WHERE r.id_test = ?`, 
        [reportId],
        (err, result) => {
            if (err) {
                console.error("Error al obtener los detalles del reporte:", err);
                return res.status(500).send('Error al obtener los detalles del reporte');
            }
            if (result.length === 0) {
                return res.status(404).send('Reporte no encontrado'); // Si no se encontró el reporte
            }
            res.status(200).json(result[0]); // Devuelve el primer resultado
        }
    );
});

// Endpoint para actualizar los datos de un caso específico
router.put('/update-report/:id', autenticacion, isAuthorized("QA"), (req, res) => {
    const reportId = req.params.id;
    const { 
        resumen, 
        prioridad, 
        precondiciones, 
        datos_entrada, 
        pasos, 
        resultado_esperado, 
        resultado_obtenido, 
        ambiente_version, 
        fecha_ejecucion 
    } = req.body;

    // Consulta para actualizar el reporte
    const query = `
        UPDATE report
        SET 
            resumen = ?, 
            prioridad = ?, 
            precondiciones = ?, 
            datos_entrada = ?, 
            pasos = ?, 
            resultado_esperado = ?, 
            resultado_obtenido = ?, 
            ambiente_version = ?, 
            fecha_ejecucion = ? 
        WHERE id_test = ?`;

    db.query(query, [
        resumen, 
        prioridad, 
        precondiciones, 
        datos_entrada, 
        pasos, 
        resultado_esperado, 
        resultado_obtenido, 
        ambiente_version, 
        fecha_ejecucion, 
        reportId
    ], (err, result) => {
        if (err) {
            console.error("Error al actualizar el reporte:", err);
            return res.status(500).send('Error al actualizar el reporte');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Reporte no encontrado'); // Si no se encontró el reporte
        }

        res.status(200).send('Reporte actualizado con éxito'); // Respuesta de éxito
    });
});

module.exports =  router;

