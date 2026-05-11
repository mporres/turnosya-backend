# TurnosYA Backend

API REST en Node.js + Express para la gestión de turnos, clientes y servicios del MVP académico **TurnosYA**. La persistencia se realiza en archivos JSON locales, sin base de datos real.

## Descripción

TurnosYA es una aplicación web simple pensada para profesionales independientes y pequeños negocios que necesitan organizar sus turnos sin recurrir a planillas o WhatsApp. Este repositorio contiene el **backend**, que expone una API REST consumida por el frontend ([turnosya-frontend](https://github.com/mporres/turnosya-frontend)).

El backend permite administrar:

- **Clientes**: alta, listado, edición y baja.
- **Servicios**: catálogo de servicios ofrecidos con duración y precio.
- **Turnos**: reservas asociadas a un cliente y a un servicio, con estado.
- **Tickets simulados** (post-desarrollo): documentados en `data/tickets.json`, sin endpoints expuestos.

## Tecnologías utilizadas

- Node.js 18+
- Express 4
- CORS
- dotenv
- nodemon (desarrollo)
- Persistencia en archivos JSON (`data/*.json`)

## Requisitos previos

- Node.js >= 18 (necesario para `crypto.randomUUID()`).
- npm.

## Instalación

```bash
git clone https://github.com/mporres/turnosya-backend.git
cd turnosya-backend
npm install
```

## Variables de entorno

Copiar `.env.example` a `.env`:

```bash
cp .env.example .env
```

Variables disponibles:

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `3001` | Puerto en el que escucha la API. |

## Ejecución

```bash
npm run dev    # con nodemon
npm start      # producción
```

La API queda disponible en `http://localhost:3001`. Health check:

```bash
curl http://localhost:3001/api/health
```

## Estructura del proyecto

```
turnosya-backend/
├── data/
│   ├── clientes.json
│   ├── servicios.json
│   ├── turnos.json
│   └── tickets.json
├── scripts/
│   └── smoke-test.sh
├── src/
│   ├── app.js
│   ├── server.js
│   ├── routes/
│   │   ├── health.routes.js
│   │   ├── clientes.routes.js
│   │   ├── servicios.routes.js
│   │   └── turnos.routes.js
│   ├── controllers/
│   │   ├── clientes.controller.js
│   │   ├── servicios.controller.js
│   │   └── turnos.controller.js
│   ├── services/
│   │   └── jsonFile.service.js
│   ├── middlewares/
│   │   ├── notFound.middleware.js
│   │   └── error.middleware.js
│   └── utils/
│       └── asyncHandler.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Endpoints

Prefijo: `/api`.

### Health

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Verifica que la API esté activa. |

### Clientes

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/clientes` | Lista todos los clientes. |
| GET | `/api/clientes/:id` | Devuelve un cliente por ID. |
| POST | `/api/clientes` | Crea un cliente (`nombre`, `telefono` obligatorios). |
| PATCH | `/api/clientes/:id` | Actualización parcial. |
| DELETE | `/api/clientes/:id` | Elimina un cliente si no tiene turnos asociados. |

### Servicios

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/servicios` | Lista todos los servicios. |
| GET | `/api/servicios/:id` | Devuelve un servicio por ID. |
| POST | `/api/servicios` | Crea un servicio (`nombre`, `duracionMinutos > 0` obligatorios). |
| PATCH | `/api/servicios/:id` | Actualización parcial. |
| DELETE | `/api/servicios/:id` | Elimina un servicio si no tiene turnos asociados. |

### Turnos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/turnos` | Lista turnos enriquecidos con datos de cliente y servicio. |
| GET | `/api/turnos/:id` | Devuelve un turno por ID (enriquecido). |
| POST | `/api/turnos` | Crea un turno (`clienteId`, `servicioId`, `fecha`, `hora` obligatorios). |
| PATCH | `/api/turnos/:id` | Actualización parcial (estado, fecha, hora, notas, etc.). |
| DELETE | `/api/turnos/:id` | **Cancelación lógica**: marca el turno como `cancelado`. |

#### Estados válidos de un turno

`pendiente` (default), `confirmado`, `cancelado`, `finalizado`.

#### Ejemplos

Crear cliente:

```bash
curl -X POST http://localhost:3001/api/clientes \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Laura Díaz","telefono":"2615559999","email":"laura@email.com","notas":"Nueva cliente"}'
```

Crear servicio:

```bash
curl -X POST http://localhost:3001/api/servicios \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Corte básico","descripcion":"Servicio de ejemplo","duracionMinutos":30,"precio":7000}'
```

Crear turno:

```bash
curl -X POST http://localhost:3001/api/turnos \
  -H "Content-Type: application/json" \
  -d '{"clienteId":"1","servicioId":"1","fecha":"2026-06-20","hora":"11:00","estado":"pendiente","notas":"Turno creado por prueba"}'
```

#### Códigos de respuesta

- `200` — OK.
- `201` — Recurso creado.
- `400` — Error de validación o cuerpo inválido.
- `404` — Recurso o ruta inexistente.
- `500` — Error interno del servidor.

Formato de error:

```json
{ "error": "Mensaje claro del error" }
```

## Persistencia en JSON

Todos los datos se almacenan en `data/`:

- `clientes.json`
- `servicios.json`
- `turnos.json`
- `tickets.json` (solo documentación post-desarrollo, sin endpoints).

La capa de persistencia (`src/services/jsonFile.service.js`) usa `fs/promises` y expone `readJsonFile(fileName)` y `writeJsonFile(fileName, data)`.

Decisión de diseño: se eligió JSON sobre una base de datos real para mantener el MVP simple, alineado con la consigna académica y para que cualquier evaluador pueda inspeccionar los datos directamente.

## Decisiones de diseño relevantes

- **Eliminación de turno = cancelación lógica.** El endpoint `DELETE /api/turnos/:id` no borra el registro, sino que cambia el `estado` a `cancelado`. Esto preserva el historial de la agenda.
- **Integridad referencial.** No se permite eliminar un cliente o un servicio si existen turnos que lo referencian (devuelve `400`). De este modo se evita romper relaciones.
- **IDs.** Los registros nuevos usan `crypto.randomUUID()`. Los datos seed conservan IDs cortos (`"1"`, `"2"`) para facilitar pruebas iniciales.
- **Respuesta enriquecida en turnos.** `GET /api/turnos` devuelve cada turno con los datos básicos del cliente y el servicio asociado, evitando llamadas adicionales desde el frontend.

## Pruebas manuales

Con el servidor corriendo (`npm run dev`):

```bash
bash scripts/smoke-test.sh
```

El script ejecuta el flujo completo (alta de cliente, servicio, turno, validaciones, cancelación lógica) y limpia los datos creados al finalizar.

## Tickets simulados (post-desarrollo)

Los tickets de soporte simulados se encuentran en `data/tickets.json`. Hay 5 tickets que cubren los tipos `bug`, `mejora` y `consulta`, con prioridades y estados variados.

### Métricas de seguimiento

- **Tickets por tipo**: 2 bugs, 2 mejoras, 1 consulta.
- **Tickets por estado**: 1 abierto, 1 en progreso, 2 resueltos, 1 cerrado.

### Prompt de análisis utilizado

```txt
Analizá estos 5 tickets simulados de TurnosYA. Clasificalos por tipo, prioridad y estado. Luego proponé conclusiones simples sobre el estado del soporte post-lanzamiento y definí 2 métricas de seguimiento fáciles de documentar.
```

## Uso de IA durante el desarrollo

El backend fue diseñado y desarrollado con asistencia de IA (Windsurf / Cascade). A continuación se documentan los prompts clave utilizados.

### Prompt para generación de código

```txt
Generá la estructura inicial de un backend Node.js + Express para TurnosYA. Debe incluir rutas separadas para clientes, servicios y turnos, persistencia en archivos JSON y manejo básico de errores.
```

### Prompt para decisiones técnicas

```txt
Estoy desarrollando un MVP académico de gestión de turnos. Compará usar archivo JSON versus base de datos real para persistencia. Recomendá la opción más adecuada considerando simplicidad, tiempo de desarrollo y cumplimiento de la consigna.
```

### Prompt para resolución de errores

```txt
Estoy desarrollando una API REST con Node.js + Express y persistencia en archivos JSON. Recibo el siguiente error: [PEGAR ERROR]. Explicá la causa probable y proponé una solución paso a paso sin cambiar la arquitectura general del proyecto.
```

## Mejora futura: autenticación con JWT

La autenticación **no** está implementada en este MVP. Queda documentada como mejora futura.

En una versión posterior, TurnosYA podría incorporar:

- Registro y login de usuarios.
- Generación de tokens JWT firmados.
- Middleware de autenticación que proteja los endpoints de clientes, servicios y turnos.
- Asociación de cada cliente, servicio y turno a un usuario propietario.
- Cierre de sesión desde el frontend.

Se decidió posponer JWT para priorizar el cumplimiento de los requisitos obligatorios de la consigna (API REST, persistencia, tickets, métricas y documentación).

## Licencia

ISC.
