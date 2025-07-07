const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token requerido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = user;
    next();
  });
};

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId || req.user._id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso solo para administradores' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error de autenticación' });
  }
};

module.exports = { authenticateToken, requireAdmin };