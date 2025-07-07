const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Autenticar usuario y obtener token (Login)
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validar que se proporcionen ambos campos
    if (!username || !password) {
      return res.status(400).json({ message: 'Por favor proporciona usuario y contraseña' });
    }

    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({
        _id: user._id,
        username: user.username,
        role: user.role,
        token: token,
        message: 'Login exitoso'
      });
    } else {
      res.status(401).json({ message: 'Usuario o contraseña inválidos' });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @desc    Crear un nuevo usuario (solo para admins)
// @route   POST /api/auth/users
// @access  Private/Admin
router.post('/users', protect, admin, async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // Validar campos requeridos
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Validar rol
    const validRoles = ['user', 'admin'];
    const userRole = role || 'user';
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    // Crear el usuario
    const user = new User({
      username,
      password,
      role: userRole,
    });

    await user.save();

    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      message: 'Usuario creado exitosamente',
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @desc    Obtener información del usuario actual
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @desc    Obtener lista de todos los usuarios (solo admins)
// @route   GET /api/auth/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @desc    Actualizar usuario (solo admins)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
router.put('/users/:id', protect, admin, async (req, res) => {
  try {
    const { username, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar campos
    user.username = username || user.username;
    user.role = role || user.role;

    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      message: 'Usuario actualizado exitosamente',
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @desc    Eliminar usuario (solo admins)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Evitar que el admin se elimine a sí mismo
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Usuario eliminado exitosamente' });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @desc    Cambiar contraseña
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Contraseña actual y nueva son requeridas' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const user = await User.findById(req.user._id);

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Contraseña actualizada exitosamente' });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// --- Script para crear el primer usuario admin ---
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        password: 'admin123', // Cambia esto por una contraseña segura
        role: 'admin'
      });
      await admin.save();
      console.log('Usuario administrador creado.');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('¡IMPORTANTE: Cambia esta contraseña después del primer login!');
    }
  } catch (error) {
    console.error('Error creando usuario admin:', error);
  }
};

// Llama a la función para asegurar que el admin exista al iniciar
createAdminUser();

module.exports = router;