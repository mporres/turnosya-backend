const crypto = require('crypto');
const { readJsonFile, writeJsonFile } = require('../services/jsonFile.service');

const CLIENTES_FILE = 'clientes.json';
const TURNOS_FILE = 'turnos.json';

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

async function listarClientes(_req, res) {
  const clientes = await readJsonFile(CLIENTES_FILE);
  res.json(clientes);
}

async function obtenerCliente(req, res) {
  const clientes = await readJsonFile(CLIENTES_FILE);
  const cliente = clientes.find((c) => c.id === req.params.id);
  if (!cliente) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }
  res.json(cliente);
}

async function crearCliente(req, res) {
  const { nombre, telefono, email, notas } = req.body || {};

  if (!isNonEmptyString(nombre) || !isNonEmptyString(telefono)) {
    return res
      .status(400)
      .json({ error: 'El nombre y el teléfono son obligatorios' });
  }

  const clientes = await readJsonFile(CLIENTES_FILE);
  const nuevo = {
    id: crypto.randomUUID(),
    nombre: nombre.trim(),
    telefono: telefono.trim(),
    email: isNonEmptyString(email) ? email.trim() : '',
    notas: isNonEmptyString(notas) ? notas.trim() : '',
  };
  clientes.push(nuevo);
  await writeJsonFile(CLIENTES_FILE, clientes);
  res.status(201).json(nuevo);
}

async function actualizarCliente(req, res) {
  const clientes = await readJsonFile(CLIENTES_FILE);
  const idx = clientes.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  const { nombre, telefono, email, notas } = req.body || {};
  const actual = clientes[idx];

  if (nombre !== undefined && !isNonEmptyString(nombre)) {
    return res.status(400).json({ error: 'El nombre no puede estar vacío' });
  }
  if (telefono !== undefined && !isNonEmptyString(telefono)) {
    return res.status(400).json({ error: 'El teléfono no puede estar vacío' });
  }

  const actualizado = {
    ...actual,
    ...(nombre !== undefined ? { nombre: nombre.trim() } : {}),
    ...(telefono !== undefined ? { telefono: telefono.trim() } : {}),
    ...(email !== undefined ? { email: typeof email === 'string' ? email.trim() : '' } : {}),
    ...(notas !== undefined ? { notas: typeof notas === 'string' ? notas.trim() : '' } : {}),
  };

  clientes[idx] = actualizado;
  await writeJsonFile(CLIENTES_FILE, clientes);
  res.json(actualizado);
}

async function eliminarCliente(req, res) {
  const clientes = await readJsonFile(CLIENTES_FILE);
  const idx = clientes.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  const turnos = await readJsonFile(TURNOS_FILE);
  const tieneTurnos = turnos.some((t) => t.clienteId === req.params.id);
  if (tieneTurnos) {
    return res.status(400).json({
      error: 'No se puede eliminar el cliente porque tiene turnos asociados',
    });
  }

  const [eliminado] = clientes.splice(idx, 1);
  await writeJsonFile(CLIENTES_FILE, clientes);
  res.json(eliminado);
}

module.exports = {
  listarClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
};
