import { FLIGHT_COLUMNS, REQUIRED_COLUMN_IDS } from '@/lib/flightColumns'

const STORAGE_KEY = 'flights.columns.v1'

export interface ColumnPref {
    id: string
    visible: boolean
}

export function defaultPrefs(): ColumnPref[] {
    return FLIGHT_COLUMNS.map((c) => ({ id: c.id, visible: c.defaultVisible || !!c.required }))
}

/**
 * Load prefs from localStorage, then reconcile against the current column
 * registry: drop unknown ids and append any new ones in their registry order
 * so the feature stays self-healing across releases.
 */
export function loadColumnPrefs(): ColumnPref[] {
    const known = new Set(FLIGHT_COLUMNS.map((c) => c.id))
    let stored: ColumnPref[] = []
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) stored = JSON.parse(raw)
    } catch {
        stored = []
    }

    const cleaned = stored.filter((p) => p && typeof p.id === 'string' && known.has(p.id))
    const seen = new Set(cleaned.map((p) => p.id))

    for (const c of FLIGHT_COLUMNS) {
        if (!seen.has(c.id)) {
            cleaned.push({ id: c.id, visible: c.defaultVisible || !!c.required })
        }
    }

    // Ensure required columns are always visible.
    for (const p of cleaned) {
        if (REQUIRED_COLUMN_IDS.includes(p.id)) p.visible = true
    }

    return cleaned
}

export function saveColumnPrefs(prefs: ColumnPref[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function resetColumnPrefs(): ColumnPref[] {
    const fresh = defaultPrefs()
    saveColumnPrefs(fresh)
    return fresh
}
