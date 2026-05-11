#!/bin/bash
# Smoke test manual de la API de TurnosYA.
# Requiere el backend corriendo en http://localhost:3001 (npm run dev).
# Uso: bash scripts/smoke-test.sh
set -e
BASE=http://localhost:3001/api

ok() { printf "\n\033[32m== %s ==\033[0m\n" "$1"; }

ok "Health"
curl -s -w "\nstatus=%{http_code}\n" $BASE/health

ok "Listar clientes"
curl -s -w "\nstatus=%{http_code}\n" $BASE/clientes

ok "Listar servicios"
curl -s -w "\nstatus=%{http_code}\n" $BASE/servicios

ok "Listar turnos (enriquecidos)"
curl -s -w "\nstatus=%{http_code}\n" $BASE/turnos

ok "Crear cliente"
CLI=$(curl -s -X POST $BASE/clientes -H "Content-Type: application/json" \
  -d '{"nombre":"Laura Diaz","telefono":"2615559999","email":"laura@email.com","notas":"smoke test"}')
echo "$CLI"
CID=$(echo "$CLI" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).id))")

ok "Crear servicio"
SVC=$(curl -s -X POST $BASE/servicios -H "Content-Type: application/json" \
  -d '{"nombre":"Corte basico","descripcion":"smoke","duracionMinutos":30,"precio":7000}')
echo "$SVC"
SID=$(echo "$SVC" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).id))")

ok "Crear turno"
TRN=$(curl -s -X POST $BASE/turnos -H "Content-Type: application/json" \
  -d "{\"clienteId\":\"$CID\",\"servicioId\":\"$SID\",\"fecha\":\"2026-07-20\",\"hora\":\"11:00\",\"notas\":\"smoke\"}")
echo "$TRN"
TID=$(echo "$TRN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).id))")

ok "Patch turno -> confirmado"
curl -s -w "\nstatus=%{http_code}\n" -X PATCH $BASE/turnos/$TID \
  -H "Content-Type: application/json" -d '{"estado":"confirmado"}'

ok "DELETE cliente con turnos (esperado 400)"
curl -s -w "\nstatus=%{http_code}\n" -X DELETE $BASE/clientes/$CID

ok "DELETE turno (cancelacion logica)"
curl -s -w "\nstatus=%{http_code}\n" -X DELETE $BASE/turnos/$TID

ok "DELETE cliente sin turnos activos (servicio borrado primero falla por turnos)"
curl -s -w "\nstatus=%{http_code}\n" -X DELETE $BASE/servicios/$SID

ok "Cleanup: eliminar turno y luego cliente y servicio del JSON"
node -e "
const fs=require('fs');
for (const f of ['turnos.json']) {
  const p='./data/'+f;
  const d=JSON.parse(fs.readFileSync(p));
  fs.writeFileSync(p, JSON.stringify(d.filter(t=>t.id==='1'||t.id==='2'),null,2)+'\n');
}
for (const f of ['clientes.json']) {
  const p='./data/'+f;
  const d=JSON.parse(fs.readFileSync(p));
  fs.writeFileSync(p, JSON.stringify(d.filter(c=>c.id==='1'||c.id==='2'),null,2)+'\n');
}
for (const f of ['servicios.json']) {
  const p='./data/'+f;
  const d=JSON.parse(fs.readFileSync(p));
  fs.writeFileSync(p, JSON.stringify(d.filter(s=>s.id==='1'||s.id==='2'),null,2)+'\n');
}
console.log('cleanup ok');
"
