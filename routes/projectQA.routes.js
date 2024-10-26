require("dotenv").config();
// const {KEY} = process.env;
const {Router} = require("express");
const  router = Router();
const db = require('../db/database');
const  {autenticacion} = require("../middleware/auth");
const {isAuthorized} = require("../middleware/authorized");

// **************************** ENDPOINTS PARA USERS QA ****************************************
// Endpoint que permite acceso a usuarios con rol "QA" o "PM"
router.get('/assigned-count', autenticacion, isAuthorized(['QA', 'PM']), (req, res) => {
    const userId = req.usuario.iduser; // Obtén el ID del usuario desde req.usuario

    //console.log('User ID:', userId); // Verificar el ID del usuario

    const query = `
        SELECT COUNT(*) as totalProjects 
        FROM user_project 
        JOIN projects ON user_project.id_project = projects.idproject 
        WHERE user_project.id_usuario = ? AND projects.estado = 'en curso'
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error al contar proyectos asignados:', err);
            return res.status(500).json({ message: 'Error al contar proyectos asignados.' });
        }

        const totalProjects = results[0].totalProjects;
        return res.status(200).json({ assignedProjectsCount: totalProjects });
    });
});

// Permitir acceso a usuarios con rol "QA" o "PM"
router.get('/some-protected-route', autenticacion, isAuthorized(['QA', 'PM']), (req, res) => {
    res.status(200).json({ message: 'Acceso permitido' });
});

// MUESTRA LOS PROYECTOS ASIGNADOS A UN USUARIO EN ESPECIFICO
router.get("/user-projects", autenticacion, isAuthorized("QA"), (req, res) => {
    const userId = req.usuario.iduser; // Obtener el ID del usuario del token

    const query = `
        SELECT 
            p.idproject,
            p.codigo_proyecto AS codigo_proyecto,
            p.nombre_proyecto AS nombre_proyecto,
            p.descripcion AS descripcion_proyecto,
            u.nombre_completo AS usuario_encargado,
            p.estado AS estado_proyecto,
            p.fecha_terminacion AS fecha_terminacion
        FROM 
            projects p
        JOIN 
            user_project up ON p.idproject = up.id_project
        JOIN 
            users u ON p.id_usuario_responsable = u.iduser
        WHERE 
            up.id_usuario = ? AND p.estado = "en curso";
    `;

    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).send('Error en la consulta');
        }

        // Verificar si se encontraron proyectos
        if (result.length === 0) {
            return res.status(404).json({ message: "No se encontraron proyectos asociados." });
        }

        res.send(result);
    });
});

// Método para obtener casos asignados a un proyecto específico
router.get('/projects/:id/cases', autenticacion, isAuthorized("QA"), (req, res) => {
    const projectId = req.params.id;
    const userId = req.usuario.iduser; // Obtener el ID del usuario del token

    const query = `
        SELECT 
            tc.idtest_case AS case_id,
            tc.nombre_caso AS case_name,
            tc.descripcion AS case_description,
            tc.fecha_reporte AS assigned_date
        FROM 
            test_case tc
        JOIN 
            user_project up ON tc.id_usuario_asignado = up.id_usuario
        WHERE 
            up.id_project = ? AND tc.id_usuario_asignado = ?;
    `;

    db.query(query, [projectId, userId], (err, result) => {
        if (err) {
            console.error("Error al obtener casos asignados:", err);
            return res.status(500).send('Error al obtener casos asignados');
        }

        // Verificar si se encontraron casos de prueba
        if (result.length === 0) {
            return res.status(404).json({ message: "No se encontraron casos de prueba asignados." });
        }

        res.status(200).json(result);
    });
});

router.get('/user-projects/:id/qa-users', autenticacion, isAuthorized(['QA', 'PM']), (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.iduser;  // Extrae el ID del usuario de la sesión

    const query = `
        SELECT u.iduser, u.nombre_completo, u.rol
        FROM users u
        JOIN user_project up ON u.iduser = up.id_usuario
        WHERE up.id_project = ? OR u.iduser = ?
    `;
    
    db.query(query, [projectId, userId], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error al obtener usuarios QA');
        } else {
            res.status(200).json(results);
        }
    });
});

// projects.routes.js

// Nuevo endpoint para obtener los detalles de un proyecto específico por idproject
router.get("/user-project/:idproject/details", autenticacion, isAuthorized("QA"), (req, res) => {
    const userId = req.usuario.iduser; // Obtener el ID del usuario del token
    const projectId = req.params.idproject; // Obtener el ID del proyecto desde la URL

    const query = `
        SELECT 
            p.codigo_proyecto AS codigo_proyecto,
            p.nombre_proyecto AS nombre_proyecto,
            p.descripcion AS descripcion_proyecto,
            u.nombre_completo AS usuario_encargado,
            p.estado AS estado_proyecto,
            p.fecha_terminacion AS fecha_terminacion
        FROM 
            projects p
        JOIN 
            user_project up ON p.idproject = up.id_project
        JOIN 
            users u ON p.id_usuario_responsable = u.iduser
        WHERE 
            up.id_usuario = ? AND p.idproject = ?;
    `;

    db.query(query, [userId, projectId], (err, result) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).send('Error en la consulta');
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "No se encontró el proyecto asociado." });
        }

        res.send(result[0]); // Retornamos solo los detalles del proyecto específico
    });
});


module.exports =  router;