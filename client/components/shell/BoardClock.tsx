import { useEffect, useState } from 'react'

export function BoardClock() {
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const t = window.setInterval(() => setNow(new Date()), 1000)
        return () => window.clearInterval(t)
    }, [])

    const hh = String(now.getUTCHours()).padStart(2, '0')
    const mm = String(now.getUTCMinutes()).padStart(2, '0')
    const ss = String(now.getUTCSeconds()).padStart(2, '0')

    return (
        <div className="hidden md:flex items-baseline gap-2">
            <span className="board-label">UTC</span>
            <span className="board-value text-sm tracking-board">
                {hh}:{mm}
                <span className="text-ink-faint">:{ss}</span>
            </span>
        </div>
    )
}
