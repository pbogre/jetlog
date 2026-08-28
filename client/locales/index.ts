/**
 * Supported languages.
 *
 * `complete: false` languages are selectable placeholders that currently
 * fall back to English. To translate one, add keys to its JSON file in
 * `client/locales/` and flip `complete` to `true`.
 */
export interface LanguageDef {
    code: string
    /** Name shown in the language switcher, written in its own script. */
    name: string
    /** True when the locale file contains a full translation. */
    complete: boolean
}

export const LANGUAGES: LanguageDef[] = [
    { code: 'en', name: 'English', complete: true },
    { code: 'zh-CN', name: '简体中文', complete: true },
    { code: 'zh-TW', name: '繁體中文', complete: true },
    { code: 'ja', name: '日本語', complete: false },
    { code: 'ko', name: '한국어', complete: false },
    { code: 'fr', name: 'Français', complete: false },
    { code: 'de', name: 'Deutsch', complete: false },
    { code: 'es', name: 'Español', complete: false },
]

export const DEFAULT_LANGUAGE = 'en'

export const LANGUAGE_STORAGE_KEY = 'jetlog-language'

export function isSupportedLanguage(code: string | null | undefined): code is string {
    return !!code && LANGUAGES.some((l) => l.code === code)
}
