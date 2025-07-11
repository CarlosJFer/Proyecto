const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Lógica para el login
const loginUser = async (req, res) => {
    const { username, password } = req.body;
    try {
        if (!username || !password) {
            return res.status(400).json({ message: 'Por favor proporciona usuario y contraseña' });
        }
        const user = await User.findOne({ username });
        if (user && (await user.comparePassword(password))) {
            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );
            res.json({
                _id: user._id,
                username: user.username,
                role: user.role,
                token: token,
            });
        } else {
            res.status(401).json({ message: 'Usuario o contraseña inválidos' });
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// Lógica para crear un usuario
const createUser = async (req, res) => {
    const { username, password, role, email } = req.body;
    try {
        if (!username || !password || !email) {
            return res.status(400).json({ message: 'Usuario, email y contraseña son requeridos' });
        }
        // Validar nombre de usuario: mínimo 3 caracteres, solo letras, números, guiones y guiones bajos
        const usernameRegex = /^[a-zA-Z0-9_-]{3,}$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ message: 'El nombre de usuario debe tener al menos 3 caracteres y solo puede contener letras, números, guiones y guiones bajos.' });
        }
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'El email no tiene un formato válido.' });
        }
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'El nombre de usuario ya existe' });
        }
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ message: 'El email ya está en uso' });
        }
        const user = await User.create({ username, password, role, email });
        res.status(201).json({
            _id: user._id,
            username: user.username,
            role: user.role,
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            // Mensaje personalizado para error de validación de Mongoose
            if (error.errors && error.errors.password && error.errors.password.kind === 'minlength') {
                return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
            }
            return res.status(400).json({ message: 'Error de validación: ' + error.message });
        }
        console.error('Error creando usuario:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// Lógica para obtener todos los usuarios
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// ... puedes crear más funciones para el resto de tus rutas (deleteUser, updateUser, etc.)

module.exports = {
    loginUser,
    createUser,
    getUsers
    // ...exporta las otras funciones aquí
};
