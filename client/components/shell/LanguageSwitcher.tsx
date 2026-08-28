import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

import { Select } from '@/components/ui/Select'
import { LANGUAGES } from '@/locales'
import { setLanguage } from '@/i18n'

export function LanguageSwitcher() {
    const { i18n } = useTranslation()

    return (
        <div className="flex items-center gap-1.5">
            <Globe size={14} className="text-ink-muted shrink-0" aria-hidden />
            <Select
                aria-label="Language"
                value={i18n.resolvedLanguage || i18n.language}
                onChange={(e) => setLanguage(e.target.value)}
                className="h-8 w-auto min-w-[92px] text-xs"
            >
                {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.name}
                        {lang.complete ? '' : ' · WIP'}
                    </option>
                ))}
            </Select>
        </div>
    )
}
