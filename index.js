require("dotenv").config();
const {KEY} = process.env;
//referencia a express
const express = require("express");
const app = express();
// importamos mysql
//const mysql = require("mysql");
const cors = require("cors");
//para encriptar mis contraseñas
const bcrypt = require('bcrypt');
//PARA JSON WEB TOKEN
const jwt = require('jsonwebtoken');
//importar db
const  db = require('./db/database');
//importar middleware de autenticacion
const  {autenticacion} = require("./middleware/auth");
//importar autorizaciones middleware
const {isAuthorized} = require("./middleware/authorized")


//indicar a la aplicacion antes de ejecutar cualquier cosa debe usar
//app.use(cors());
app.use(express.json());
//Configuración de cors
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://3.142.225.164');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, PUT');
    res.setHeader("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization");
    next();
  });
/*
//conexion hacia la base de datos
const db = mysql.createConnection({
    host:HOST,
    user:USER,
    password:PASSWORD,
    database:DATABASE
});*/



// ****************************************************** USERS ************************************************************
// Creación de la petición para registrar un nuevo usuario
app.post('/register-user',autenticacion,isAuthorized("PM"), async (req, res) => {
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
app.get("/usuarios",autenticacion,isAuthorized("PM"), (req, res) => {
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
app.put('/usuarios/:iduser/status',autenticacion,isAuthorized("PM"), (req, res) => {
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
app.get('/users/qa',autenticacion,isAuthorized("PM"), (req, res) => {
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
app.get('/users/pm',autenticacion,isAuthorized(['PM','QA']), (req, res) => {
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

// PROJECTS
app.use(require("./routes/project.routes"));

// *********************************************** TEST-CASE ******************************************************
app.use(require("./routes/case.routes"));

// CONFIGURAR LAS RUTAS DE AUTENTICACION EN EL SERVIDOR LOGIN, LOGOUT
app.use(require("./routes/auth.routes"));

//*********************************************ENDPOINTS PARA USER ROL "QA" ************************************************************* */
app.use(require("./routes/projectQA.routes"));

// *************************************************MENSAJES DEL SERVIDOR*******************************************
//decimos que vamos a escuchar por un puerto
app.listen(3001, () => { 
    console.log("Servidor escuchando en el puerto 3001");
    });



