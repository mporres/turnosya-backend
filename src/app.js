const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health.routes');
const clientesRoutes = require('./routes/clientes.routes');
const serviciosRoutes = require('./routes/servicios.routes');
const turnosRoutes = require('./routes/turnos.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/turnos', turnosRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
