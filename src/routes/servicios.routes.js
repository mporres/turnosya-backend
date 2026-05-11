const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/servicios.controller');

const router = Router();

router.get('/', asyncHandler(ctrl.listarServicios));
router.get('/:id', asyncHandler(ctrl.obtenerServicio));
router.post('/', asyncHandler(ctrl.crearServicio));
router.patch('/:id', asyncHandler(ctrl.actualizarServicio));
router.delete('/:id', asyncHandler(ctrl.eliminarServicio));

module.exports = router;
