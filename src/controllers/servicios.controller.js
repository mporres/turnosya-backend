const crypto = require('crypto');
const { readJsonFile, writeJsonFile } = require('../services/jsonFile.service');

const SERVICIOS_FILE = 'servicios.json';
const TURNOS_FILE = 'turnos.json';

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isNonNegativeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

async function listarServicios(_req, res) {
  const servicios = await readJsonFile(SERVICIOS_FILE);
  res.json(servicios);
}

async function obtenerServicio(req, res) {
  const servicios = await readJsonFile(SERVICIOS_FILE);
  const servicio = servicios.find((s) => s.id === req.params.id);
  if (!servicio) {
    return res.status(404).json({ error: 'Servicio no encontrado' });
  }
  res.json(servicio);
}

async function crearServicio(req, res) {
  const { nombre, descripcion, duracionMinutos, precio } = req.body || {};

  if (!isNonEmptyString(nombre)) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  if (!isPositiveNumber(duracionMinutos)) {
    return res
      .status(400)
      .json({ error: 'duracionMinutos debe ser un número mayor a 0' });
  }
  if (precio !== undefined && precio !== null && !isNonNegativeNumber(precio)) {
    return res
      .status(400)
      .json({ error: 'precio debe ser un número mayor o igual a 0' });
  }

  const servicios = await readJsonFile(SERVICIOS_FILE);
  const nuevo = {
    id: crypto.randomUUID(),
    nombre: nombre.trim(),
    descripcion: isNonEmptyString(descripcion) ? descripcion.trim() : '',
    duracionMinutos,
    precio: precio === undefined || precio === null ? null : precio,
  };
  servicios.push(nuevo);
  await writeJsonFile(SERVICIOS_FILE, servicios);
  res.status(201).json(nuevo);
}

async function actualizarServicio(req, res) {
  const servicios = await readJsonFile(SERVICIOS_FILE);
  const idx = servicios.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Servicio no encontrado' });
  }

  const { nombre, descripcion, duracionMinutos, precio } = req.body || {};
  const actual = servicios[idx];

  if (nombre !== undefined && !isNonEmptyString(nombre)) {
    return res.status(400).json({ error: 'El nombre no puede estar vacío' });
  }
  if (duracionMinutos !== undefined && !isPositiveNumber(duracionMinutos)) {
    return res
      .status(400)
      .json({ error: 'duracionMinutos debe ser un número mayor a 0' });
  }
  if (
    precio !== undefined &&
    precio !== null &&
    !isNonNegativeNumber(precio)
  ) {
    return res
      .status(400)
      .json({ error: 'precio debe ser un número mayor o igual a 0' });
  }

  const actualizado = {
    ...actual,
    ...(nombre !== undefined ? { nombre: nombre.trim() } : {}),
    ...(descripcion !== undefined
      ? { descripcion: typeof descripcion === 'string' ? descripcion.trim() : '' }
      : {}),
    ...(duracionMinutos !== undefined ? { duracionMinutos } : {}),
    ...(precio !== undefined ? { precio: precio === null ? null : precio } : {}),
  };

  servicios[idx] = actualizado;
  await writeJsonFile(SERVICIOS_FILE, servicios);
  res.json(actualizado);
}

async function eliminarServicio(req, res) {
  const servicios = await readJsonFile(SERVICIOS_FILE);
  const idx = servicios.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Servicio no encontrado' });
  }

  const turnos = await readJsonFile(TURNOS_FILE);
  const tieneTurnos = turnos.some((t) => t.servicioId === req.params.id);
  if (tieneTurnos) {
    return res.status(400).json({
      error: 'No se puede eliminar el servicio porque tiene turnos asociados',
    });
  }

  const [eliminado] = servicios.splice(idx, 1);
  await writeJsonFile(SERVICIOS_FILE, servicios);
  res.json(eliminado);
}

module.exports = {
  listarServicios,
  obtenerServicio,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
};
