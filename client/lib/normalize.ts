function snakeToCamelKey(s: string): string {
    return s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
}

/**
 * Recursively rewrite snake_case object keys to camelCase. Leaves arrays,
 * primitives, dates, and class instances alone. The backend has aliasing
 * configured but FastAPI 0.103 serializes with field names (snake_case);
 * this lets the rest of the codebase keep using camelCase.
 */
export function camelize<T = unknown>(value: unknown): T {
    if (Array.isArray(value)) {
        return value.map((v) => camelize(v)) as unknown as T
    }
    if (value && typeof value === 'object' && value.constructor === Object) {
        const out: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            out[snakeToCamelKey(k)] = camelize(v)
        }
        return out as T
    }
    return value as T
}
