# Reconstrucción de "Cian duerme" desde el bundle de producción

## Contexto

Perdí el código fuente de esta app (formateé la máquina sin pushear). Recuperé el
build de producción desde Firebase Hosting. **No hay sourcemaps.** El objetivo es
reconstruir el proyecto fuente a partir del bundle minificado.

Ya está recuperado y verificado:

| Ruta | Estado |
|---|---|
| `recuperado/assets/index-BLha0cqC.js` | bundle minificado, ya pasado por prettier (44.809 líneas) |
| `recuperado/assets/index-CeiMDDbw.css` | CSS del build |
| `src/styles/index.css` | **mi CSS original, íntegro** (líneas 218–1956 del anterior) |
| `functions/index.js` | **fuente original sin minificar**, recuperado de GCS |
| `recuperado/icons/`, `favicon.svg`, `manifest.webmanifest` | assets originales |
| `src/lib/firebase.js`, `src/lib/datos.js` | ya reconstruidos |
| `src/context/AuthContext.jsx`, `src/context/DataContext.jsx` | ya reconstruidos |
| `firestore.rules` | reconstruido (comparar con la consola antes de deployar) |

Falta: **todos los componentes y pantallas de React.**

## Regla de oro

El bundle es la fuente de verdad. **No inventes, no mejores, no rediseñes.**
Si algo no se puede determinar leyendo el bundle, dejá un `// TODO:` y seguí —
no rellenes con una suposición silenciosa.

## Cómo leer el bundle

El código de app arranca alrededor de la línea **36000** (antes hay React,
Firebase SDK, react-day-picker, lucide-react). Tu código está mezclado con
lucide y date-fns, que se identifican por sus comentarios `@license`.

El JSX está compilado a llamadas del runtime automático:

```js
w.jsx("div", { className: "tarjeta", children: [...] })
w.jsxs("div", { ... })   // varios children
w.Fragment
```

Se traduce mecánicamente a JSX. `w` es el runtime, ignoralo.

Identificadores ya mapeados (usalos, son consistentes en todo el bundle):

| Minificado | Real |
|---|---|
| `Y` | React |
| `w.jsx` / `w.jsxs` | jsx runtime |
| `zt` | `db` |
| `bp` | `auth` |
| `t2` | `functions` |
| `hi` / `Sf` / `pS` | `useData` (los tres son el mismo hook) |
| `Pl` | `useAuth` |
| `zu` | `nombreCorto` |
| `vg` | `inicialDe` |
| `Bu` | `aMillis` |
| `Wt` | `aTimestamp` |
| `rt` | `Timestamp` |

Los iconos de lucide aparecen como componentes con `iconNode` inline; identificá
cada uno por su path SVG y mapealo al nombre de `lucide-react`.

## Los nombres de clase CSS son el contrato

El CSS está recuperado exacto y **usa nombres semánticos en español**
(`.app-header`, `.tarjeta`, `.crono--grande`, `.btn-gota`, `.mascota-blob`,
`.pantalla-titulo`, `.ahora-estado-txt`, …). Vite no mangla nombres de clase, así
que los `className` del bundle coinciden 1:1 con `src/styles/index.css`.

Usá eso como checklist de completitud:

```bash
# todas las clases que define mi CSS
grep -oE '\.[a-z][a-z0-9_-]*' src/styles/index.css | sort -u > /tmp/clases-css.txt
# todas las que usan mis componentes
grep -rhoE '"[a-z][a-z0-9_ -]*"' src/components src/screens | tr -d '"' | tr ' ' '\n' | sort -u > /tmp/clases-jsx.txt
comm -23 /tmp/clases-css.txt /tmp/clases-jsx.txt
```

Toda clase del CSS que no aparezca en ningún componente es una pieza de UI que
todavía no reconstruiste. Apuntá a que esa lista quede vacía (salvo clases de
estado que se aplican condicionalmente).

## Alcance de la app

Del bundle y del CSS se desprende:

- **Auth**: solo Google con popup. Pantalla de login + bienvenida/onboarding
  (`bienvenidaVista` en `users/{uid}`).
- **Multi-bebé**: menú de bebé, agregar, borrar, salir; bebé activo en
  `localStorage` bajo `cian.babyActivo`.
- **4 tabs**: Ahora, Hoy, Historial, Ajustes. Barra de navegación inferior con
  `aria-label="Navegación principal"`.
- **Ahora**: mascota animada (blob que "respira"), cronómetro grande, botón
  gota "Se despertó"/"Se durmió", botón "Empezar toma"/"Terminar toma",
  link sutil "desde HH:MM · ajustar".
- **Hoy**: tarjetas de resumen en grilla de 3, notas de fase tipo
  "Anoche estiró un buen tramo de sueño."
- **Historial**: navegación por día (Día anterior / Día siguiente), date picker
  con react-day-picker v9 (con overrides de tema en el CSS), lista de registros,
  editar y borrar, "Sin registros este día."
- **Ajustes**: tema, mascota (Patito / Gatito / Ovejita), notas de contexto,
  datos del bebé, invitar cuidador (generar / copiar link / revocar / regenerar),
  unirse con código, respaldo (importar / exportar JSON), zona de datos,
  política de privacidad.
- **Ajuste de hora**: el modal de Ahora es solo `<input type="datetime-local">` con `max` en el ahora. Los steppers ±5 min / ±1 h y los chips "Hace 5 min / 15 / 30 / 1 h" pertenecen al **editor de registro** (clases `timepicker`, `tp-grupo`, `tp-step`, `tp-num`, `editor-atajos`).
  hora", etc. son los `aria-label`).
- **Accesibilidad**: hay `aria-label` en español por todos lados. Preservalos
  literalmente, están en el bundle.

## Modelo de datos (confirmado contra Firestore)

```
users/{uid}            → { bienvenidaVista, notasOcultas: [babyId] }
babies/{babyId}        → { nombre, apodo, emoji, fechaNacimiento, cuidadores: [uid],
                           creadoPor, creadoEn, inviteActual,
                           estadoActual: { modo: 'dormido'|'despierto', desde },
                           tomaActiva: { inicio } | null }
babies/{babyId}/registros/{id} → { tipo: 'sueño'|'toma', inicio, fin }
invites/{CODIGO}       → { babyId, creadoPor, creadoEn, expiraEn, usado, usadoPor, usadoEn }
```

Todas las fechas son `Timestamp`. Pasan por `aMillis` / `aTimestamp` en
`src/lib/datos.js`.

## Stack

Vite + React (sin TypeScript), CSS plano (**no Tailwind**), `vite-plugin-pwa`,
Firebase (auth + firestore + functions), `react-day-picker` v9, `lucide-react`,
`date-fns`, `@fontsource/baloo-2` y `@fontsource/gochi-hand`.

Falta crear: `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`.

- `index.html` copialo de `recuperado/index.html` quitando los `<script>` y
  `<link>` con hash que inyecta el build, y dejando `<div id="root">`.
- `vite.config.js` reconstruí la config de `vite-plugin-pwa` a partir de
  `recuperado/manifest.webmanifest` y de `recuperado/sw.js`
  (mirá `navigateFallback`, `globPatterns`, `registerType`).
- Orden de imports en `main.jsx`:
  ```js
  import '@fontsource/baloo-2/400.css'  // 400, 500, 600, 700
  import '@fontsource/gochi-hand/400.css'
  import 'react-day-picker/style.css'
  import './styles/index.css'
  ```

## Plan de trabajo

Andá en este orden, commiteando cada paso:

1. `vite.config.js`, `index.html`, `main.jsx` → que `npm run dev` levante.
2. `App.jsx`: providers, gate de auth, router de tabs, header con avatar.
3. Pantalla **Ahora** (la más visible: mascota, cronómetro, botones).
4. Pantalla **Hoy** (tarjetas de resumen y notas de fase).
5. Pantalla **Historial** (date picker, lista, editar, borrar).
6. Pantalla **Ajustes** (todas las secciones).
7. Modales / hojas: editar registro, ajustar hora, agregar bebé, invitar,
   unirse con código, confirmaciones de borrado, privacidad.

## Verificación

Después de cada pantalla:

```bash
npm run build          # tiene que compilar sin errores
```

Y al final, comparación estructural contra el original:

```bash
# el bundle nuevo debería tener un tamaño del mismo orden que el viejo
ls -la dist/assets/*.js recuperado/assets/index-BLha0cqC.js

# todos los textos de UI del original tienen que existir en el nuevo fuente
# (extraé los strings en español del bundle viejo y buscalos en src/)
```

Escribí un script `_analisis/verificar-textos.sh` que haga esa última
comparación y listá los textos del original que todavía no aparecen en `src/`.

## Restricciones

- **No corras `firebase deploy`** bajo ninguna circunstancia. El sitio en
  producción es la única copia viva de la app y el `.env` está local.
- No toques `src/styles/index.css`, `functions/`, ni `recuperado/`. Son
  material original recuperado; `recuperado/` es solo lectura de referencia.
- No agregues dependencias que no estén ya en `package.json` sin avisar.
- No agregues TypeScript, Tailwind, ni un router (la navegación por tabs es
  estado local, no `react-router` — verificá esto en el bundle antes de asumir).
- Preservá los textos en español **exactos**, incluidos los `aria-label`.
