// -----------------------------------------------------------------------------
// ARCHIVO: /routes/analytics.js
// -----------------------------------------------------------------------------

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getSecretarias,
  getSecretariaById,
  getResumen,
  compararSecretarias,
  getEstadisticasPorCampo,
  downloadSecretariaPDF,
  getHistorialSecretaria
} = require('../controllers/analyticsController');

router.get('/secretarias', authenticateToken, getSecretarias);
router.get('/secretarias/:id', authenticateToken, getSecretariaById);
router.get('/secretarias/:id/download', authenticateToken, downloadSecretariaPDF);
router.get('/secretarias/:id/historial', authenticateToken, getHistorialSecretaria);
router.get('/resumen', authenticateToken, getResumen);
router.get('/comparar/:id1/:id2', authenticateToken, compararSecretarias);
router.get('/estadisticas/:campo', authenticateToken, getEstadisticasPorCampo);

module.exports = router;