const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Importar User para createAdminUser
const Organization = require('../models/Organization'); // Importar modelo de organización

// Importa los controladores y el middleware
const { loginUser, createUser, getUsers } = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Rutas principales usando el controlador
router.post('/login', loginUser);
router.post('/users', authenticateToken, requireAdmin, createUser);
router.get('/users', authenticateToken, requireAdmin, getUsers);

// @desc    Cambiar contraseña de cualquier usuario (solo admin)
// @route   PUT /api/auth/users/:id/change-password
// @access  Private/Admin
router.put('/users/:id/change-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error cambiando contraseña de usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @desc    Obtener información del usuario actual
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @desc    Actualizar usuario (solo admins)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
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
router.delete('/Users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Evitar que el admin se elimine a sí mismo
    const currentUserId = req.user.userId || req.user._id;
    if (user._id.toString() === String(currentUserId)) {
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
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Contraseña actual y nueva son requeridas' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const user = await User.findById(req.user._id);

    if (!(await user.comparePassword(currentPassword))) { // Cambiado de 'matchPassword' a 'comparePassword'
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
    // Eliminar lógica de organización por defecto
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        email: 'admin@example.com', // Cambia esto por un email válido
        password: 'admin1234', // Cambia esto por una contraseña segura
        role: 'admin'
        // organizationId eliminado
      });
      await admin.save();
      console.log('Usuario administrador creado.');
      console.log('Username: admin');
      console.log('Password: admin1234');
      console.log('¡IMPORTANTE: Cambia esta contraseña después del primer login!');
    }
  } catch (error) {
    console.error('Error creando usuario admin:', error);
  }
};

// Llama a la función para asegurar que el admin exista al iniciar
createAdminUser();

module.exports = router;