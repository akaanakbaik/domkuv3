import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'
import resources from './i18n'
import type { Resource } from 'i18next'

export async function serverTranslation(locale: string) {
  const i18nInstance = createInstance()
  
  await i18nInstance
    .use(initReactI18next)
    .init({
      lng: locale,
      resources: resources as Resource,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    })

  return {
    t: i18nInstance.t,
    i18n: i18nInstance,
  }
}

export function getLocaleFromPath(pathname: string): string {
  const localeMatch = pathname.match(/^\/(en|id)/)
  return localeMatch ? localeMatch[1] : 'en'
}