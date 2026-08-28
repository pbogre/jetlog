import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import fr from './locales/fr.json'
import de from './locales/de.json'
import es from './locales/es.json'
import {
    DEFAULT_LANGUAGE,
    isSupportedLanguage,
    LANGUAGE_STORAGE_KEY,
    LANGUAGES,
} from './locales'
import { DEFAULT_LANGUAGE as CONFIGURED_LANGUAGE } from './api'

function detectLanguage(): string {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isSupportedLanguage(stored)) return stored

    // Docker deployments can configure the default via the DEFAULT_LANGUAGE
    // environment variable (served from GET /config).
    if (isSupportedLanguage(CONFIGURED_LANGUAGE)) return CONFIGURED_LANGUAGE

    const browser = (navigator.language || DEFAULT_LANGUAGE).toLowerCase()
    if (browser.startsWith('zh')) {
        // Traditional variants (Taiwan/HK/Hant) default to zh-TW, everything
        // else Chinese defaults to Simplified (zh-CN).
        if (/tw|hk|hant|mo/.test(browser)) return 'zh-TW'
        return 'zh-CN'
    }
    if (browser.startsWith('ja')) return 'ja'
    if (browser.startsWith('ko')) return 'ko'
    if (browser.startsWith('fr')) return 'fr'
    if (browser.startsWith('de')) return 'de'
    if (browser.startsWith('es')) return 'es'
    return DEFAULT_LANGUAGE
}

export function setLanguage(code: string) {
    if (!isSupportedLanguage(code)) return
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
    i18n.changeLanguage(code)
}

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        'zh-CN': { translation: zhCN },
        'zh-TW': { translation: zhTW },
        ja: { translation: ja },
        ko: { translation: ko },
        fr: { translation: fr },
        de: { translation: de },
        es: { translation: es },
    },
    lng: detectLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: LANGUAGES.map((l) => l.code),
    interpolation: {
        escapeValue: false,
    },
})

export default i18n
