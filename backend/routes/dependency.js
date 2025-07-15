// -----------------------------------------------------------------------------
// ARCHIVO: /routes/dependency.js
// -----------------------------------------------------------------------------

const express = require('express');
const router = express.Router();
const Dependency = require('../models/Dependency');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Obtener todas las dependencias (secretarías)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const dependencias = await Dependency.find().sort({ nombre: 1 });
    res.json(dependencias);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener dependencias' });
  }
});

// Crear una nueva dependencia (solo admin)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { nombre, codigo, descripcion } = req.body;
    if (!nombre || !codigo) {
      return res.status(400).json({ message: 'Nombre y código son requeridos' });
    }
    const nueva = new Dependency({
      nombre,
      codigo,
      nivel: 1, // Secretarías principales
      descripcion: descripcion || '',
      idPadre: null,
    });
    await nueva.save();
    res.status(201).json(nueva);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.codigo) {
      return res.status(409).json({ message: 'Ya existe una dependencia con ese código.' });
    }
    res.status(500).json({ message: 'Error al crear dependencia', error: error.message });
  }
});

// Editar una dependencia (solo admin)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { nombre, codigo, descripcion, activo } = req.body;
    const dep = await Dependency.findById(req.params.id);
    if (!dep) return res.status(404).json({ message: 'Dependencia no encontrada' });
    if (nombre) dep.nombre = nombre;
    if (codigo) dep.codigo = codigo;
    if (descripcion !== undefined) dep.descripcion = descripcion;
    if (activo !== undefined) dep.activo = activo;
    await dep.save();
    res.json(dep);
  } catch (error) {
    res.status(500).json({ message: 'Error al editar dependencia', error: error.message });
  }
});

// Eliminar una dependencia (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const dep = await Dependency.findByIdAndDelete(req.params.id);
    if (!dep) return res.status(404).json({ message: 'Dependencia no encontrada' });
    res.json({ message: 'Dependencia eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar dependencia', error: error.message });
  }
});

// Obtener el árbol jerárquico de dependencias
router.get('/tree', authenticateToken, async (req, res) => {
  try {
    const dependencias = await Dependency.find({ activo: true }).lean();
    // Construir mapa de dependencias por id
    const depMap = new Map(dependencias.map(dep => [String(dep._id), dep]));
    // Construir árbol recursivo
    function buildTree(parentId = null) {
      return dependencias
        .filter(dep => dep.idPadre === parentId)
        .sort((a, b) => (a.orden || 999) - (b.orden || 999))
        .map(dep => ({
          ...dep,
          children: buildTree(String(dep._id)),
        }));
    }
    const tree = buildTree(null);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener árbol de dependencias', error: error.message });
  }
});

module.exports = router;
