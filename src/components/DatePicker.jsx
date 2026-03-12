import { useState, useRef, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import clsx from 'clsx'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function DatePicker({ value, onChange, placeholder = 'Select date', className = '', compact }) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date())
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const handleSelect = (d) => {
    onChange(format(d, 'yyyy-MM-dd'))
    setOpen(false)
  }

  const today = new Date()

  return (
    <div ref={ref} className={clsx('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx(
          'flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white hover:border-surface-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all',
          compact ? 'min-w-[90px] py-1.5 px-2 text-xs' : 'w-full min-w-[140px] py-2 px-3 text-sm'
        )}
      >
        <Calendar className={compact ? 'w-3.5 h-3.5 text-surface-400' : 'w-4 h-4 text-surface-400'} />
        <span className={value ? 'text-surface-900' : 'text-surface-400'}>
          {value ? format(new Date(value), 'd MMM yyyy') : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-lg border border-surface-200 p-3 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewDate(subMonths(viewDate, 1))}
              className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-surface-900">
              {format(viewDate, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-surface-500 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => {
              const isCurrentMonth = isSameMonth(day, viewDate)
              const isSelected = value && isSameDay(day, new Date(value))
              const isToday = isSameDay(day, today)

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={clsx(
                    'w-9 h-9 rounded-lg text-sm font-medium transition-all',
                    !isCurrentMonth && 'text-surface-300',
                    isCurrentMonth && 'text-surface-700 hover:bg-surface-100',
                    isSelected && 'bg-primary-500 text-white hover:bg-primary-600',
                    isToday && !isSelected && 'ring-1 ring-primary-300'
                  )}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
