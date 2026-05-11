const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/clientes.controller');

const router = Router();

router.get('/', asyncHandler(ctrl.listarClientes));
router.get('/:id', asyncHandler(ctrl.obtenerCliente));
router.post('/', asyncHandler(ctrl.crearCliente));
router.patch('/:id', asyncHandler(ctrl.actualizarCliente));
router.delete('/:id', asyncHandler(ctrl.eliminarCliente));

module.exports = router;
