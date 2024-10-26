require("dotenv").config();
const {KEY} = process.env;
const {Router} = require("express");
const  router = Router();
const db = require('../db/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
//importar middleware de autenticacion
const  {autenticacion} = require("../middleware/auth");

// ************************************************** LOGIN **********************************************************

// Endpoint para iniciar sesión
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Verificar que se hayan enviado las credenciales
    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, introduce el correo electrónico y la contraseña.' });
    }

    // Consultar en la base de datos por el usuario que coincida con el email y esté activo
    const query = 'SELECT * FROM users WHERE correo = ? AND status = ?';
    db.query(query, [email,"activo"], (err, results) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: 'Error del servidor' });
        }

        // Verificar si el usuario existe y está activo
        if (results.length === 0) {
            return res.status(404).json({ message: 'Credenciales invalidas.' });
        }

        const user = results[0];

        // Comparar la contraseña enviada con la almacenada en la base de datos
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error al comparar las contraseñas:', err);
                return res.status(500).json({ message: err.message });
            }

            if (!isMatch) {
                return res.status(401).json({ message: 'credenciales invalidas' });
            }

            // Si las credenciales son correctas, generar un token JWT
            const token = jwt.sign(
                {
                    iduser: user.iduser,
                    email: user.correo,
                    rol: user.rol
                },
                KEY,
                { expiresIn: '1h' } // El token expirará en 1 hora
            );

            // Configuración de la cookie con el token
            res.cookie('token', token, {
                httpOnly: true,  // Asegura que la cookie solo se pueda acceder desde el servidor
                secure: false,  // La cookie será segura solo en producción (HTTPS)
                maxAge: 3600000 // 1 hora de duración para la cookie
            });

            // Devolver el token y la información del usuario
            return res.status(200).json({
                message: 'Inicio de sesión exitoso.',
                token,
                user: {
                    iduser: user.iduser,
                    email: user.correo,
                    rol: user.rol,
                    nombre: user.nombre_completo
                }
            });
        });
    });
});

// Endpoint para cerrar sesión y revocar el token
router.post('/logout',autenticacion, (req, res) => {
    const { token } = req;  // El token debe estar disponible en el request

    // Verificar si el token está presente
    if (!token) {
        return res.status(400).send({ mensaje: 'No se proporcionó el token.' });
    }

    // Consulta para insertar el token desechado en la tabla invalid_token
    const query = 'INSERT INTO invalid_tokens (token) VALUES (?)';

    db.query(query, [token], (err, results) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).send({ mensaje: 'Error interno del servidor.' });
        }

        // Si la inserción fue exitosa
        res.status(200).send({ mensaje: 'Sesión cerrada con éxito.' });
    });
});

module.exports =  router;


