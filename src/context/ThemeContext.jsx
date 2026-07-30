import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// TODO: el bundle no conserva los límites de módulo. En el original, `TEMAS`,
// `gradienteDe` y el provider podrían haber estado en archivos separados.
export const TEMAS = {
  cian: {
    id: 'cian',
    label: 'Cian',
    vars: {
      '--bg': '#EDFFDA',
      '--accent': '#36A783',
      '--deep': '#1f8a63',
      '--amarillo': '#FFE579',
      '--aqua': '#92FFE4',
      '--surface': '#FFFFFF',
      '--text': '#213a2e',
      '--text-soft': '#4d6b5c',
      '--btn-accent': '#6BBF9A',
      '--btn-deep': '#4FA382',
      '--grad-dormido': 'linear-gradient(160deg, #92FFE4 0%, #EDFFDA 100%)',
      '--grad-despierto': 'linear-gradient(160deg, #FFE579 0%, #92FFE4 100%)',
      '--grad-tomando': 'linear-gradient(160deg, #36A783 0%, #92FFE4 100%)',
      '--grad-fondo':
        'radial-gradient(120% 85% at 10% 100%, rgba(146,255,228,0.60) 0%, rgba(146,255,228,0) 55%), radial-gradient(110% 75% at 96% 4%, rgba(255,229,121,0.50) 0%, rgba(255,229,121,0) 52%), radial-gradient(120% 90% at 55% -12%, rgba(146,255,228,0.32) 0%, rgba(146,255,228,0) 55%), #EDFFDA',
    },
  },
  rosa: {
    id: 'rosa',
    label: 'Rosa',
    vars: {
      '--bg': '#FFE8DF',
      '--accent': '#FF96A2',
      '--deep': '#E06A79',
      '--amarillo': '#A6FF6F',
      '--aqua': '#FFB0B9',
      '--surface': '#FFFFFF',
      '--text': '#5a2f34',
      '--text-soft': '#8a5f65',
      '--btn-accent': '#F4A9B3',
      '--btn-deep': '#E08A97',
      '--grad-dormido': 'linear-gradient(160deg, #FFB0B9 0%, #FFE8DF 100%)',
      '--grad-despierto': 'linear-gradient(160deg, #A6FF6F 0%, #FFE8DF 100%)',
      '--grad-tomando': 'linear-gradient(160deg, #FF96A2 0%, #FFE8DF 100%)',
      '--grad-fondo':
        'radial-gradient(120% 85% at 10% 100%, rgba(255,176,185,0.60) 0%, rgba(255,176,185,0) 55%), radial-gradient(110% 75% at 96% 4%, rgba(166,255,111,0.42) 0%, rgba(166,255,111,0) 52%), radial-gradient(120% 90% at 55% -12%, rgba(255,176,185,0.32) 0%, rgba(255,176,185,0) 55%), #FFE8DF',
    },
  },
  magenta: {
    id: 'magenta',
    label: 'Magenta',
    vars: {
      '--bg': '#FEFFE4',
      '--accent': '#C481D5',
      '--deep': '#9D4FA8',
      '--amarillo': '#FFE465',
      '--aqua': '#E2B49C',
      '--surface': '#FFFFFF',
      '--text': '#4a2b50',
      '--text-soft': '#7a5a80',
      '--btn-accent': '#C481D5',
      '--btn-deep': '#9D4FA8',
      '--grad-dormido': 'linear-gradient(160deg, #C481D5 0%, #FEFFE4 100%)',
      '--grad-despierto': 'linear-gradient(160deg, #FFE465 0%, #E2B49C 100%)',
      '--grad-tomando': 'linear-gradient(160deg, #B468B8 0%, #FEFFE4 100%)',
      '--grad-fondo':
        'radial-gradient(120% 85% at 10% 100%, rgba(196,129,213,0.50) 0%, rgba(196,129,213,0) 55%), radial-gradient(110% 75% at 96% 4%, rgba(255,228,101,0.45) 0%, rgba(255,228,101,0) 52%), radial-gradient(120% 90% at 55% -12%, rgba(226,180,156,0.40) 0%, rgba(226,180,156,0) 55%), #FEFFE4',
    },
  },
  noche: {
    id: 'noche',
    label: 'Noche',
    vars: {
      '--bg': '#0f1a17',
      '--accent': '#5fcea9',
      '--deep': '#8fe6c8',
      '--amarillo': '#c9b25a',
      '--aqua': '#3a6f60',
      '--surface': '#182722',
      '--text': '#e4f3ec',
      '--text-soft': '#9db8ad',
      '--grad-dormido': 'linear-gradient(160deg, #1d4a3d 0%, #0f1a17 100%)',
      '--grad-despierto': 'linear-gradient(160deg, #4a4620 0%, #16302a 100%)',
      '--grad-tomando': 'linear-gradient(160deg, #24705a 0%, #12211c 100%)',
      '--grad-fondo':
        'radial-gradient(120% 85% at 10% 100%, rgba(58,111,96,0.55) 0%, rgba(58,111,96,0) 55%), radial-gradient(110% 75% at 96% 4%, rgba(95,206,169,0.16) 0%, rgba(95,206,169,0) 52%), radial-gradient(120% 90% at 55% -12%, rgba(58,111,96,0.30) 0%, rgba(58,111,96,0) 55%), #0f1a17',
    },
  },
}

const ORDEN_TEMAS = ['cian', 'rosa', 'magenta', 'noche']
const TEMA_POR_DEFECTO = 'cian'

export function gradienteDe(modo) {
  return modo === 'tomando'
    ? 'var(--grad-tomando)'
    : modo === 'despierto'
      ? 'var(--grad-despierto)'
      : 'var(--grad-dormido)'
}

const ThemeContext = createContext(null)
const CLAVE_TEMA = 'cian.tema'

function aplicarTema(id) {
  const tema = TEMAS[id] || TEMAS[TEMA_POR_DEFECTO]
  const root = document.documentElement
  for (const [nombre, valor] of Object.entries(tema.vars))
    root.style.setProperty(nombre, valor)
  root.setAttribute('data-theme', tema.id)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', tema.vars['--bg'])
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    const guardado = localStorage.getItem(CLAVE_TEMA)
    return guardado && TEMAS[guardado] ? guardado : TEMA_POR_DEFECTO
  })

  useEffect(() => {
    aplicarTema(themeId)
    localStorage.setItem(CLAVE_TEMA, themeId)
  }, [themeId])

  const cycleTheme = useCallback(() => {
    setThemeId((actual) => {
      const i = ORDEN_TEMAS.indexOf(actual)
      return ORDEN_TEMAS[(i + 1) % ORDEN_TEMAS.length]
    })
  }, [])

  const value = {
    themeId,
    theme: TEMAS[themeId],
    setTheme: setThemeId,
    cycleTheme,
    themes: ORDEN_TEMAS.map((id) => TEMAS[id]),
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return ctx
}
