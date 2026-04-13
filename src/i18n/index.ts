import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en'
import es from './locales/es'
import ptBR from './locales/pt-BR'

export const resources = {
  en: { translation: en },
  es: { translation: es },
  'pt-BR': { translation: ptBR },
} as const

i18n.use(initReactI18next).init({
  resources,
  lng: 'pt-BR',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
