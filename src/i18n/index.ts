import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en'
import ptBR from './locales/pt-BR'

export const resources = {
  en: { translation: en },
  'pt-BR': { translation: ptBR },
} as const

i18n.use(initReactI18next).init({
  resources,
  lng: 'pt-BR',         // idioma padrão
  fallbackLng: 'en',    // fallback se uma chave não existir
  interpolation: {
    escapeValue: false,  // React já escapa por padrão
  },
})

export default i18n
