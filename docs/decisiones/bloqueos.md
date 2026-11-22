# Bloqueos

Cada entrada: qué falta, qué se puso en su lugar y cómo se completa.

| Fecha | Qué falta | Qué se puso en su lugar | Cómo se completa |
|---|---|---|---|
| sáb 21 nov, 8:26 p.m. | Clave de voz (`ELEVENLABS_API_KEY`): no existe en el servidor | Nada; la voz queda fuera | Leonardo agrega la clave a `/opt/agua/agua.env` y se activa después de la Compuerta 3 |
| sáb 21 nov, 8:30 p.m. | Catálogo real de cartuchos (lo entrega Tulio) | `db/semilla_cartuchos.sql` con productos marcados como ejemplo | Reemplazar la semilla cuando llegue el catálogo |
| sáb 21 nov, 8:30 p.m. | Tira real y foto de su tabla de colores (domingo temprano) | `config/tira.ts` con la referencia de 8 parámetros y carga manual | Calibración del domingo 8:30 a.m. |
| sáb 21 nov, 8:30 p.m. | Costos de la prueba de bacterias, envío, importación y empaque | Supuestos marcados en `docs/negocio/` | Tulio envía los costos y Business recalcula |
