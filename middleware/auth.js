require("dotenv").config();
const jwt = require('jsonwebtoken');
const { KEY } = process.env;
const db = require('../db/database');

const autenticacion = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    try {
        // Verificar si el token no fue proporcionado
        if (!token) {
            return res.status(403).send({ mensaje: 'Acceso denegado, no se proporcionó token.' });
        }

        // Consultar en la base de datos si el token está en la tabla 'invalid_token'
        const query = 'SELECT * FROM invalid_tokens WHERE token = ?';
        db.query(query, [token], (err, results) => {
            if (err) {
                console.error('Error en la consulta:', err);
                return res.status(500).send({ mensaje: 'Error del servidor.' });
            }

            // Si el token existe en la tabla, significa que ha sido revocado
            if (results.length > 0) {
                return res.status(403).send({ mensaje: 'El token ha sido revocado.' });
            }

            // Si no está revocado, verificar el token con JWT
            try {
                const usuario = jwt.verify(token, KEY); // Usar la clave JWT desde el .env

                // Adjuntar los datos del usuario y el token al request
                req.usuario = usuario;
                req.token = token;
                //console.log('KEY:', KEY);
                //console.log('Authorization Header:', req.headers.authorization);
                //console.log('Raw Token:', token);

                // Continuar con la siguiente función
                next();
            } catch (error) {
                console.error('Error al verificar token:', error);
                return res.status(401).send({ mensaje: 'Error de autenticación: token inválido o expirado.' });
            }
        });
    } catch (error) {
        console.error('Error en el middleware de autenticación:', error);
        return res.status(401).send({ mensaje: 'Error de autenticación.' });
    }
};

module.exports = { 
    autenticacion 
};
