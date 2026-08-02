# Cian duerme

PWA para registrar sueño y tomas de un bebé, compartida entre cuidadores.
Producción: https://cianduerme-6a534.web.app/

## Stack

Vite + React (JS, sin TypeScript) · CSS plano, sin Tailwind · `vite-plugin-pwa`
· Firebase (Auth con Google, Firestore, Functions) · `react-day-picker` v10 con
locale `es` · `lucide-react` **1.24.0 fijo** · `date-fns` ·
`@fontsource/baloo-2` + `@fontsource/gochi-hand`.

Deploy automático: push a `master` → GitHub Actions → Firebase Hosting.
Los PRs generan preview channels. Nunca correr `firebase deploy` a mano
**para Hosting**.

Las **reglas de Firestore van por otro workflow** (`firestore-rules.yml`, se
dispara solo si cambia `firestore.rules`), porque el de Hosting no las toca.
Si ese job falla por permisos de la service account, el fallback es a mano:
`npx firebase-tools deploy --only firestore:rules --project cianduerme-6a534`.

## Estructura

```
src/
  lib/firebase.js     initializeFirestore con cache persistente multi-pestaña
  lib/datos.js        conversión de Timestamps, normalizadores (bebé, registro,
                      comida, alimento), slug de alimentos, código de invitación
  lib/tiempo.js       formateo de fechas y duraciones
  context/AuthContext.jsx    login con Google (popup), sesión
  context/DataContext.jsx    sueño y tomas: TODO ese estado (~32 valores)
  context/ComidaContext.jsx  alimentación complementaria, aparte de DataContext
  context/ThemeContext.jsx   4 temas, setea CSS vars en documentElement
  screens/                   Ahora, Hoy, Historial, Ajustes, Privacidad
  components/                Resumen (compartido Hoy/Historial), EditorRegistro,
                             DatePicker, Mascota, header, tabs, modales
  styles/index.css           hoja completa, nombres de clase en español
functions/index.js    canjearInvite (Node 20, Admin SDK)
```

## Modelo de datos

```
users/{uid}       { bienvenidaVista, notasOcultas: [babyId] }
babies/{babyId}   { nombre, apodo, emoji, fechaNacimiento, cuidadores: [uid],
                    creadoPor, creadoEn, inviteActual,
                    estadoActual: { modo: 'dormido'|'despierto', desde },
                    tomaActiva: { inicio } | null }
babies/{babyId}/registros/{id}   { tipo: 'sueño'|'toma', inicio, fin }
babies/{babyId}/comidas/{id}     { inicio, momento, alimentos: [{id, nombre}],
                                   aceptacion, reaccion, notas, creadoPor }
babies/{babyId}/planes/{id}      (reservado: plan semanal y compras, sin usar)
invites/{CODIGO}  { babyId, creadoPor, creadoEn, expiraEn, usado, usadoPor, usadoEn }
```

Todas las fechas son `Timestamp`; se convierten con `aMillis` / `aTimestamp`.
El estado en curso vive en el documento del bebé (`estadoActual`, `tomaActiva`),
no en los registros. Un registro sin `fin` es un tramo abierto.

Una **comida no tiene `fin`**: es un instante, no un tramo. `momento` es
`desayuno|almuerzo|merienda|cena|extra` y `aceptacion` es
`todo|parte|probo|rechazo` (ids sin acento); ambos pueden ser null. Las listas
válidas están en `MOMENTOS` y `ACEPTACIONES` de `lib/datos.js`.

## Decisiones de diseño que no son obvias

- **El canje de invitaciones pasa por Cloud Function.** El cliente no puede
  agregarse a `cuidadores[]`; solo puede quitarse a sí mismo. Generar y revocar
  códigos sí son escrituras directas del cliente.
- **Un solo código vivo por bebé**: generar uno nuevo borra el anterior.
  Vencen a los 7 días. El alfabeto excluye I, L, O, 0, 1 para dictarlo en voz alta.
- **`Set` de bebés confirmados**: no se suscribe a la subcolección `registros`
  hasta que el bebé llegó del servidor (`!metadata.hasPendingWrites`). Sin eso,
  un bebé creado offline da `permission-denied`.
- **La mascota se deriva del tema**, no es un control aparte:
  cian→Patito, rosa→Ovejita, magenta→Gatito, noche→Patito.
  Archivos: `pato-*`, `gato-*`, `oveja-*` (concuerdan en género:
  `oveja-dormida`, no `oveja-dormido`).
- **Dos unidades de tiempo conviven**: las tarjetas de Hoy usan día calendario
  con las duraciones recortadas a `[00:00, 23:59]`; las notas de fase usan
  `ventanaNoche` = 19:00–06:00.
- **Los batches se parten en 450** (el límite de Firestore es 500).
- **Importar deduplica** con la huella `tipo|inicio|fin`.
- **El cronómetro** es un `setInterval` de 1 s que solo fuerza el re-render;
  el valor sale de `Date.now() - desde`, así que no se desincroniza en segundo
  plano y no necesita `visibilitychange`.
- **El editor de registro no toca `estadoActual`**: devuelve `{tipo, inicio, fin}`
  y el padre (`Resumen`) corrige el estado del bebé si hacía falta.
- **Solape permitido**: guardar dos registros que se pisan solo muestra un aviso.
  Lo único que bloquea Guardar es `fin < inicio`.
- **Las comidas NO van dentro de `registros`** con un `tipo: 'comida'`. Dos
  razones: las reglas de producción validan `tipo in ['sueño','toma']` y lo
  rechazarían, y como la PWA es `autoUpdate` el otro cuidador puede seguir un
  rato con el bundle viejo, que dibujaría cada comida como "Toma" en la línea
  de tiempo. Subcolección aparte.
- **`ComidaContext` es un contexto propio** y consume `listo` de `DataContext`
  (el gate de `confirmados`). Ese booleano se exporta justamente para no
  duplicar el invariante: si se copiara, el día que cambie la condición la
  copia queda vieja y el síntoma es una suscripción que dispara antes de
  tiempo, muy molesto de diagnosticar.
- **`alimentos` son objetos `{id, nombre}`, no strings.** El `id` es un slug sin
  acentos que permite agrupar y detectar alimentos nuevos sin depender de cómo
  se escribió. Normaliza mayúsculas y acentos pero **no sinónimos**: "plátano"
  y "banana" son dos ids distintos. Se resuelve con un catálogo con alias
  cuando exista la UI; que sean objetos es lo que permite hacerlo sin migrar.
- Como `alimentos` es un array de objetos, **no se puede filtrar con
  `array-contains`**. Da igual porque las comidas se cargan enteras al cliente,
  pero si algún día esto pagina por fechas, el filtro por alimento va en memoria.

## Pendientes

1. **Corte de día.** Medianoche parte al medio el sueño nocturno: un tramo
   21:00→06:00 aparece como 3 h un día y 6 h el otro. Migrar a un ancla fija
   (19:00 o 07:00), con cada tramo entero en el día donde arrancó. Métricas
   objetivo: total 24 h, noche vs siestas por separado, tramo más largo.
   Los datos crudos no cambian, solo la agregación.
2. `nSuenos` cuenta entero un sueño que cruza medianoche, en ambos días.
   Se resuelve solo con el punto 1.
3. `setEmoji` existe en `DataContext` y nadie lo llama: el emoji solo se elige
   al crear el bebé. Falta el selector de 8 emojis en Ajustes.
4. Revisar imports de barril (`date-fns`, locales, lucide) con
   `vite-bundle-visualizer`; el bundle tiene margen para achicarse.
5. CSS muerto que se puede borrar: `.ahora-bebe`, `.ajuste-bloque--proximo`,
   `.nota-fase`.
6. `comidas` no valida forma en las reglas, a diferencia de `registros`
   (`registroValido`). Si se quiere una `comidaValida()`, es un cambio aparte.
7. La UI de "Borrar bebé" se le ofrece a cualquier cuidador, pero las reglas
   solo dejan borrar al creador (`creadoPor`): a los demás les va a dar
   `permission-denied`. Es así en el original; revisar cuando se toque Ajustes.

## Contexto histórico

El fuente se perdió en un formateo y se reconstruyó desde el bundle de
producción (sin sourcemaps) en julio de 2026. Recuperados **exactos**: el CSS,
las 9 mascotas `.webp`, `functions/index.js`, iconos, manifest, fuentes y
—desde el 2 de agosto de 2026— `firestore.rules`.

Ojo con las reglas: hasta esa fecha el repo tenía una **reconstrucción** que no
coincidía con producción y era bastante más permisiva (dejaba que cualquier
cuidador borrara el bebé, no protegía `creadoPor`, no validaba la forma de los
registros y permitía leer `invites`). Se bajaron las vivas por la API de Rules
y el archivo del repo pasó a ser exactamente esas, más los `match` de `comidas`
y `planes`. **Si algo en las reglas parece de más, no lo saques sin comparar
contra la consola**: el original es la referencia, no el repo.
El resto es reconstrucción verificada: bundle final dentro del 0,15 % del
original y todos los textos de UI ubicados.

Si algo parece raro y no está en esta lista de pendientes, es probable que sea
así en el original a propósito.
