import { useState } from 'react'
import { gradienteDe, useTheme } from '../context/ThemeContext'

// TODO: los 9 .webp (pato/gato/oveja × dormido/despierto/tomando) NO están en
// recuperado/assets — el build recuperado solo trae lo que el sw precacheaba, y
// los .webp no entraban en globPatterns. El glob queda vacío y cae siempre al
// SVG de abajo, que es el mismo fallback que tenía el original.
const modulos = import.meta.glob('../assets/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

const IMGS = {}
for (const [ruta, url] of Object.entries(modulos)) {
  const m = ruta.match(/([\w-]+)\.webp$/)
  if (m) IMGS[m[1]] = url
}

/** Qué bicho corresponde a cada tema. */
const MASCOTA_POR_TEMA = {
  cian: {
    dormido: IMGS['pato-dormido'],
    despierto: IMGS['pato-despierto'],
    tomando: IMGS['pato-tomando'],
  },
  rosa: {
    dormido: IMGS['oveja-dormida'],
    despierto: IMGS['oveja-despierta'],
    tomando: IMGS['oveja-tomando'],
  },
  magenta: {
    dormido: IMGS['gato-dormido'],
    despierto: IMGS['gato-despierto'],
    tomando: IMGS['gato-tomando'],
  },
  noche: {
    dormido: IMGS['pato-dormido'],
    despierto: IMGS['pato-despierto'],
    tomando: IMGS['pato-tomando'],
  },
}

const NOMBRE_POR_TEMA = {
  cian: 'Patito',
  rosa: 'Ovejita',
  magenta: 'Gatito',
  noche: 'Patito',
}

export default function Mascota({ estado = 'despierto', size = 200 }) {
  const { themeId } = useTheme()
  const [fallidas, setFallidas] = useState(() => new Set())

  const src = (MASCOTA_POR_TEMA[themeId] || MASCOTA_POR_TEMA.cian)[estado]
  const usarImagen = src && !fallidas.has(src)
  const nombre = NOMBRE_POR_TEMA[themeId] || 'Mascota'

  return (
    <div className="mascota" style={{ width: size, height: size }}>
      <div
        className="mascota-blob"
        style={{ background: gradienteDe(estado) }}
        aria-hidden="true"
      />
      <div className="mascota-figura">
        {usarImagen ? (
          <img
            key={src}
            src={src}
            alt={`${nombre} ${estado}`}
            draggable="false"
            onError={() => setFallidas((s) => new Set(s).add(src))}
            style={{ width: '78%', height: '78%', objectFit: 'contain' }}
          />
        ) : (
          <PatitoSVG estado={estado} />
        )}
      </div>
    </div>
  )
}

function PatitoSVG({ estado = 'despierto' }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width="78%"
      height="78%"
      role="img"
      aria-label={`Patito ${estado}`}
      style={{ display: 'block' }}
    >
      <ellipse cx="100" cy="128" rx="58" ry="50" fill="#FFE07A" />
      <circle cx="100" cy="78" r="42" fill="#FFE895" />

      {estado === 'tomando' ? (
        <path d="M78 84 q-4 10 6 14 q10 3 14 -6 z" fill="#FF9E3D" />
      ) : (
        <path d="M126 78 q22 -4 22 8 q0 12 -22 8 z" fill="#FF9E3D" />
      )}

      {estado === 'dormido' ? (
        <>
          <path
            d="M78 74 q8 8 16 0"
            stroke="#3a3a3a"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M108 74 q8 8 16 0"
            stroke="#3a3a3a"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="86" cy="74" r="5" fill="#3a3a3a" />
          <circle cx="116" cy="74" r="5" fill="#3a3a3a" />
          <circle cx="88" cy="72" r="1.6" fill="#fff" />
          <circle cx="118" cy="72" r="1.6" fill="#fff" />
        </>
      )}

      <circle cx="74" cy="90" r="6" fill="#FFB3B3" opacity="0.7" />
      <circle cx="126" cy="90" r="6" fill="#FFB3B3" opacity="0.7" />

      {estado === 'dormido' && (
        <>
          <path d="M64 52 q36 -40 74 -6 q-38 -6 -74 6 z" fill="currentColor" />
          <circle cx="140" cy="44" r="7" fill="#fff" />
          <text
            x="150"
            y="46"
            fontSize="16"
            fontWeight="700"
            fill="currentColor"
            fontFamily="'Baloo 2', sans-serif"
          >
            z
          </text>
          <text
            x="162"
            y="34"
            fontSize="12"
            fontWeight="700"
            fill="currentColor"
            fontFamily="'Baloo 2', sans-serif"
          >
            z
          </text>
          <text
            x="172"
            y="26"
            fontSize="9"
            fontWeight="700"
            fill="currentColor"
            fontFamily="'Baloo 2', sans-serif"
          >
            z
          </text>
        </>
      )}

      {estado === 'despierto' && (
        <>
          <path d="M48 120 q-24 -6 -18 22 q18 4 26 -10 z" fill="#FFD866" />
          <path d="M152 120 q24 -6 18 22 q-18 4 -26 -10 z" fill="#FFD866" />
        </>
      )}

      {estado === 'tomando' && (
        <g transform="rotate(-18 70 110)">
          <rect
            x="52"
            y="96"
            width="20"
            height="40"
            rx="7"
            fill="#EAF6FF"
            stroke="#9BC7E0"
            strokeWidth="2"
          />
          <rect
            x="55"
            y="112"
            width="14"
            height="22"
            rx="4"
            fill="currentColor"
            opacity="0.5"
          />
          <rect x="57" y="88" width="10" height="10" rx="3" fill="#FF9E3D" />
        </g>
      )}
    </svg>
  )
}
