const isAuthorized = (roles) => {
    return async (req, res, next) => {
        try {
            const { usuario } = req;

            if (!usuario) {
                return res.status(401).json({ message: 'Usuario No Autenticado' });
            }

            // Verificar si el rol del usuario está en el arreglo de roles permitidos
            if (!roles.includes(usuario.rol)) {
                console.log(`Rol del usuario: ${usuario.rol}, Roles permitidos: ${roles}`);
                return res.status(403).json({ message: 'Acceso No Autorizado' });
            }

            next();
        } catch (error) {
            return res.status(500).json({ message: 'Error del servidor' });
        }
    };
};

module.exports = {
    isAuthorized
};
