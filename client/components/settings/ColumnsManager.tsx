import { useEffect, useState } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff, Lock, RotateCcw } from 'lucide-react'

import {
    loadColumnPrefs,
    saveColumnPrefs,
    resetColumnPrefs,
    type ColumnPref,
} from '@/storage/columnsStorage'
import { COLUMN_INDEX, REQUIRED_COLUMN_IDS } from '@/lib/flightColumns'
import { Switch } from '@/components/ui/Switch'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

function emitChanged() {
    window.dispatchEvent(new Event('jetlog:columns-changed'))
}

export function ColumnsManager() {
    const [prefs, setPrefs] = useState<ColumnPref[]>(() => loadColumnPrefs())

    const update = (next: ColumnPref[]) => {
        setPrefs(next)
        saveColumnPrefs(next)
        emitChanged()
    }

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e
        if (!over || active.id === over.id) return
        const oldIndex = prefs.findIndex((p) => p.id === active.id)
        const newIndex = prefs.findIndex((p) => p.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return
        update(arrayMove(prefs, oldIndex, newIndex))
    }

    const toggleVisibility = (id: string, visible: boolean) => {
        if (REQUIRED_COLUMN_IDS.includes(id)) return
        update(prefs.map((p) => (p.id === id ? { ...p, visible } : p)))
    }

    const resetAll = () => {
        const fresh = resetColumnPrefs()
        setPrefs(fresh)
        emitChanged()
    }

    useEffect(() => {
        // Keep in sync if changed in another tab.
        const onStorage = (e: StorageEvent) => {
            if (e.key && e.key.startsWith('flights.columns')) {
                setPrefs(loadColumnPrefs())
            }
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    const visibleCount = prefs.filter((p) => p.visible).length

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <p className="board-label text-ink-muted">
                        {visibleCount} of {prefs.length} columns visible
                    </p>
                    <p className="text-xs text-ink-muted font-mono mt-0.5">
                        Drag rows to reorder · toggle to show/hide · origin and
                        destination are required.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={resetAll}>
                    <RotateCcw size={13} /> Reset
                </Button>
            </div>

            <div className="border border-rule bg-paper">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={prefs.map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {prefs.map((p) => (
                            <ColumnRow
                                key={p.id}
                                pref={p}
                                onToggle={(v) => toggleVisibility(p.id, v)}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    )
}

interface ColumnRowProps {
    pref: ColumnPref
    onToggle: (visible: boolean) => void
}

function ColumnRow({ pref, onToggle }: ColumnRowProps) {
    const def = COLUMN_INDEX[pref.id]
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: pref.id })

    const required = !!def?.required

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            className={cn(
                'flex items-center gap-3 px-3 py-2.5 border-b border-rule last:border-b-0 bg-paper',
                isDragging && 'opacity-60 z-10 shadow-paper bg-paper-soft',
            )}
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder"
                className="cursor-grab active:cursor-grabbing text-ink-faint hover:text-ink touch-none"
            >
                <GripVertical size={16} />
            </button>
            <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-ink truncate">
                    {def?.label ?? pref.id}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-board text-ink-faint">
                    {pref.id}
                </div>
            </div>
            {required ? (
                <span
                    title="Required column"
                    className="flex items-center gap-1 board-label text-ink-muted"
                >
                    <Lock size={12} /> Required
                </span>
            ) : pref.visible ? (
                <Eye size={14} className="text-ink-muted" />
            ) : (
                <EyeOff size={14} className="text-ink-faint" />
            )}
            <Switch
                checked={pref.visible}
                onCheckedChange={onToggle}
                disabled={required}
                aria-label={`Show ${def?.label ?? pref.id}`}
            />
        </div>
    )
}
