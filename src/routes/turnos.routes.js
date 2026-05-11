const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/turnos.controller');

const router = Router();

router.get('/', asyncHandler(ctrl.listarTurnos));
router.get('/:id', asyncHandler(ctrl.obtenerTurno));
router.post('/', asyncHandler(ctrl.crearTurno));
router.patch('/:id', asyncHandler(ctrl.actualizarTurno));
router.delete('/:id', asyncHandler(ctrl.eliminarTurno));

module.exports = router;
