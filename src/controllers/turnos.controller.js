const crypto = require('crypto');
const { readJsonFile, writeJsonFile } = require('../services/jsonFile.service');

const TURNOS_FILE = 'turnos.json';
const CLIENTES_FILE = 'clientes.json';
const SERVICIOS_FILE = 'servicios.json';

const ESTADOS_VALIDOS = ['pendiente', 'confirmado', 'cancelado', 'finalizado'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFechaValida(value) {
  return isNonEmptyString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function isHoraValida(value) {
  return isNonEmptyString(value) && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
}

function enriquecer(turno, clientes, servicios) {
  const cliente = clientes.find((c) => c.id === turno.clienteId);
  const servicio = servicios.find((s) => s.id === turno.servicioId);
  return {
    ...turno,
    cliente: cliente
      ? { id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono }
      : null,
    servicio: servicio
      ? {
          id: servicio.id,
          nombre: servicio.nombre,
          duracionMinutos: servicio.duracionMinutos,
        }
      : null,
  };
}

async function listarTurnos(_req, res) {
  const [turnos, clientes, servicios] = await Promise.all([
    readJsonFile(TURNOS_FILE),
    readJsonFile(CLIENTES_FILE),
    readJsonFile(SERVICIOS_FILE),
  ]);
  res.json(turnos.map((t) => enriquecer(t, clientes, servicios)));
}

async function obtenerTurno(req, res) {
  const [turnos, clientes, servicios] = await Promise.all([
    readJsonFile(TURNOS_FILE),
    readJsonFile(CLIENTES_FILE),
    readJsonFile(SERVICIOS_FILE),
  ]);
  const turno = turnos.find((t) => t.id === req.params.id);
  if (!turno) {
    return res.status(404).json({ error: 'Turno no encontrado' });
  }
  res.json(enriquecer(turno, clientes, servicios));
}

async function crearTurno(req, res) {
  const { clienteId, servicioId, fecha, hora, estado, notas } = req.body || {};

  if (!isNonEmptyString(clienteId)) {
    return res.status(400).json({ error: 'clienteId es obligatorio' });
  }
  if (!isNonEmptyString(servicioId)) {
    return res.status(400).json({ error: 'servicioId es obligatorio' });
  }
  if (!isFechaValida(fecha)) {
    return res
      .status(400)
      .json({ error: 'fecha es obligatoria y debe tener formato YYYY-MM-DD' });
  }
  if (!isHoraValida(hora)) {
    return res
      .status(400)
      .json({ error: 'hora es obligatoria y debe tener formato HH:mm' });
  }

  const estadoFinal = estado === undefined ? 'pendiente' : estado;
  if (!ESTADOS_VALIDOS.includes(estadoFinal)) {
    return res.status(400).json({
      error: `estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
    });
  }

  const [turnos, clientes, servicios] = await Promise.all([
    readJsonFile(TURNOS_FILE),
    readJsonFile(CLIENTES_FILE),
    readJsonFile(SERVICIOS_FILE),
  ]);

  if (!clientes.some((c) => c.id === clienteId)) {
    return res.status(400).json({ error: 'El cliente indicado no existe' });
  }
  if (!servicios.some((s) => s.id === servicioId)) {
    return res.status(400).json({ error: 'El servicio indicado no existe' });
  }

  const nuevo = {
    id: crypto.randomUUID(),
    clienteId,
    servicioId,
    fecha: fecha.trim(),
    hora: hora.trim(),
    estado: estadoFinal,
    notas: isNonEmptyString(notas) ? notas.trim() : '',
  };
  turnos.push(nuevo);
  await writeJsonFile(TURNOS_FILE, turnos);
  res.status(201).json(enriquecer(nuevo, clientes, servicios));
}

async function actualizarTurno(req, res) {
  const turnos = await readJsonFile(TURNOS_FILE);
  const idx = turnos.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Turno no encontrado' });
  }

  const { clienteId, servicioId, fecha, hora, estado, notas } = req.body || {};
  const actual = turnos[idx];

  const [clientes, servicios] = await Promise.all([
    readJsonFile(CLIENTES_FILE),
    readJsonFile(SERVICIOS_FILE),
  ]);

  if (clienteId !== undefined) {
    if (!isNonEmptyString(clienteId) || !clientes.some((c) => c.id === clienteId)) {
      return res.status(400).json({ error: 'El cliente indicado no existe' });
    }
  }
  if (servicioId !== undefined) {
    if (!isNonEmptyString(servicioId) || !servicios.some((s) => s.id === servicioId)) {
      return res.status(400).json({ error: 'El servicio indicado no existe' });
    }
  }
  if (fecha !== undefined && !isFechaValida(fecha)) {
    return res.status(400).json({ error: 'fecha debe tener formato YYYY-MM-DD' });
  }
  if (hora !== undefined && !isHoraValida(hora)) {
    return res.status(400).json({ error: 'hora debe tener formato HH:mm' });
  }
  if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({
      error: `estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
    });
  }

  const actualizado = {
    ...actual,
    ...(clienteId !== undefined ? { clienteId } : {}),
    ...(servicioId !== undefined ? { servicioId } : {}),
    ...(fecha !== undefined ? { fecha: fecha.trim() } : {}),
    ...(hora !== undefined ? { hora: hora.trim() } : {}),
    ...(estado !== undefined ? { estado } : {}),
    ...(notas !== undefined
      ? { notas: typeof notas === 'string' ? notas.trim() : '' }
      : {}),
  };

  turnos[idx] = actualizado;
  await writeJsonFile(TURNOS_FILE, turnos);
  res.json(enriquecer(actualizado, clientes, servicios));
}

async function eliminarTurno(req, res) {
  const turnos = await readJsonFile(TURNOS_FILE);
  const idx = turnos.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Turno no encontrado' });
  }
  if (turnos[idx].estado === 'cancelado') {
    return res.status(400).json({ error: 'El turno ya estaba cancelado' });
  }
  turnos[idx] = { ...turnos[idx], estado: 'cancelado' };
  await writeJsonFile(TURNOS_FILE, turnos);

  const [clientes, servicios] = await Promise.all([
    readJsonFile(CLIENTES_FILE),
    readJsonFile(SERVICIOS_FILE),
  ]);
  res.json(enriquecer(turnos[idx], clientes, servicios));
}

module.exports = {
  listarTurnos,
  obtenerTurno,
  crearTurno,
  actualizarTurno,
  eliminarTurno,
};
