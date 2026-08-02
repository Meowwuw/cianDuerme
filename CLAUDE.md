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
                             EditorComida, DatePicker, Mascota, header, tabs;
                             Modal, AtajosHora y BotonBorrar los comparten los
                             dos editores
  styles/index.css           hoja completa, nombres de clase en español. Todo
                             lo de alimentación complementaria está al final,
                             en un bloque aparte
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
babies/{babyId}/comidas/{id}     { inicio, nombre, momento,
                                   alimentos: [{id, nombre}],
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
- **El editor de comidas es un componente propio, no un tercer chip de
  `EditorRegistro`.** Ese está construido alrededor de un tramo con inicio,
  fin y validación de solape; la comida es un instante con tres campos que los
  otros dos tipos no tienen. Un chip más habría dejado un componente con dos
  formas internas y condicionales por tipo repartidos: la versión en JSX del
  `tipo: 'comida'` dentro de `registros` que ya se descartó. Lo compartido se
  extrajo antes, sin cambio de comportamiento: `Modal`, `AtajosHora`,
  `BotonBorrar`, más `DatePicker` y `TimePicker` que ya estaban sueltos.
- **La tarjeta de Comidas aparece solo si ese día hubo alguna**, y ahí la
  grilla pasa a 2×2 con `.tarjetas--cuatro`. Sin comidas, Hoy e Historial se
  ven exactamente como antes.
- **`ComidaContext` es un contexto propio** y consume `listo` de `DataContext`
  (el gate de `confirmados`). Ese booleano se exporta justamente para no
  duplicar el invariante: si se copiara, el día que cambie la condición la
  copia queda vieja y el síntoma es una suscripción que dispara antes de
  tiempo, muy molesto de diagnosticar.
- **`comidaValida()` usa `keys().hasOnly()`, así que agregar un campo a una
  comida rompe los writes hasta que las reglas estén publicadas.** El orden es
  siempre: cambiar las reglas, deployarlas, y recién después escribir el campo
  desde el cliente. Los dos workflows corren en paralelo sobre el mismo push,
  así que hay un minuto de ventana; con dos cuidadores no importa, pero está
  bueno saber por qué rebota si rebota.
- **El `nombre` del plato es decorativo; `alimentos` es el dato.** En la línea
  de tiempo gana el nombre si está, pero en el editor los dos campos conviven
  y si hay nombre sin ingredientes aparece un aviso: la regla de los 3 días
  del paso 2 solo mira `alimentos`.
- **El banco de platos no es una colección**: `bancoDeComidas()` lo deriva de
  las comidas ya registradas, quedándose con la versión más reciente de cada
  nombre. No hay `recetas/` que mantener sincronizada. Las sugerencias
  aparecen con 2 letras, no autocompletan, no roban el Enter, y al elegir una
  suman los ingredientes que faltaban sin pisar los que ya cargaste.
- **Alimento nuevo = su primera aparición en todo el historial del bebé**, y
  la ventana de vigilancia son 3 días contados **desde esa primera vez**, no
  desde la última: contando desde la última, mientras se la sigas dando la
  ventana no cerraría nunca. Todo derivado, nada persistido: editar la fecha
  de una comida vieja recalcula solo.
- **Una reacción anotada bloquea la confirmación de TODOS los ingredientes de
  esa comida.** La reacción vive en la comida, no en el alimento, así que no
  existe el dato de cuál fue: darlo por conocido a uno "porque el sospechoso
  era el otro" sería inventar. El costo de equivocarse es asimétrico —callar
  una reacción real es mucho peor que esperar un par de días—, así que esto
  es a propósito y no es un error de precisión que convenga "arreglar".
- **Prioridad de las notas**: primero lo que pasó hoy con la comida (alimento
  nuevo, alimento que cumple la ventana), después las cuatro de sueño y tomas
  en su orden de siempre, y última la de vigilancia, que describe que *no*
  pasó nada. Sin ese último matiz, durante los meses de introducción las notas
  de sueño no aparecerían nunca. El interruptor de notas de contexto es uno
  solo: las apaga a todas.
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
6. El truncado de la línea de tiempo y `listaDeNombres` cortan a partir de 4
   alimentos, cada uno por su lado y con criterios distintos ("y 2 más" vs
   "4 alimentos"). Si algún día molesta, unificar.

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
