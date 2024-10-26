const isAuthorizedQA = (req, res, next) => {
    try {
        const { usuario } = req;

        if (!usuario) {
            return res.status(401).json({ message: 'Usuario No Autenticado' });
        }

        console.log("Rol del usuario:", usuario.rol); // Debugging

        if (usuario.rol !== "QA") {
            console.log("Rol del usuario:", usuario.rol);
            return res.status(403).json({ message: 'Acceso No Autorizado' });
        }

        next();
    } catch (error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
};


module.exports = {
    isAuthorizedQA
};
