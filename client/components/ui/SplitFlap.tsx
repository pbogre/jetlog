import { useEffect, useState, type CSSProperties } from 'react'
import { cn } from '@/lib/cn'

interface SplitFlapProps {
    value: string | number
    className?: string
    delay?: number
}

/**
 * One-shot split-flap reveal on mount. Each character flaps in with a staggered delay.
 * Falls back gracefully if prefers-reduced-motion is set.
 */
export function SplitFlap({ value, className, delay = 0 }: SplitFlapProps) {
    const chars = String(value).split('')
    const [reduced, setReduced] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        setReduced(mq.matches)
    }, [])

    return (
        <span className={cn('inline-flex tabular-nums', className)} aria-label={String(value)}>
            {chars.map((c, i) => (
                <span
                    key={`${i}-${c}`}
                    style={
                        reduced
                            ? undefined
                            : ({
                                  animationDelay: `${delay + i * 60}ms`,
                                  animationFillMode: 'both',
                                  transformOrigin: 'center bottom',
                                  display: 'inline-block',
                              } as CSSProperties)
                    }
                    className={reduced ? '' : 'animate-flap-in'}
                >
                    {c}
                </span>
            ))}
        </span>
    )
}
