import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date or default to today
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const initialYear = selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.getFullYear() : new Date().getFullYear();
  const initialMonth = selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.getMonth() : new Date().getMonth();

  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Keep viewYear and viewMonth in sync when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formatted = `${viewYear}-${monthStr}-${dayStr}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleQuickPreset = (daysAgo: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    const formatted = `${year}-${monthStr}-${dayStr}`;
    onChange(formatted);
    setViewYear(year);
    setViewMonth(d.getMonth());
    setIsOpen(false);
  };

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const formattedDisplay = selectedDate && !isNaN(selectedDate.getTime())
    ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: '#0e1217',
          border: isOpen ? '1px solid var(--accent)' : '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          cursor: 'pointer',
          userSelect: 'none',
          boxShadow: isOpen ? '0 0 0 1px var(--accent)' : 'none',
          transition: 'all 120ms ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={15} color="var(--accent)" />
          <span
            style={{
              fontSize: '0.88rem',
              fontFamily: 'JetBrains Mono',
              color: formattedDisplay ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {formattedDisplay || placeholder}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
              }}
              title="Clear date"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Presets Row */}
      <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
        {[
          { label: 'Today', days: 0 },
          { label: 'Yesterday', days: 1 },
          { label: '3d ago', days: 3 },
          { label: '1w ago', days: 7 },
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={(e) => handleQuickPreset(preset.days, e)}
            style={{
              fontSize: '0.68rem',
              fontFamily: 'JetBrains Mono',
              padding: '2px 6px',
              borderRadius: '3px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Dropdown Calendar Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 200,
            width: 'min(280px, 92vw)',
            backgroundColor: '#12161c',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Header with Month / Year Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="btn btn-sm btn-secondary"
              style={{ padding: '3px 6px' }}
            >
              <ChevronLeft size={14} />
            </button>

            <span
              style={{
                fontFamily: 'Space Grotesk',
                fontWeight: 700,
                fontSize: '0.88rem',
                color: 'var(--accent)',
              }}
            >
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="btn btn-sm btn-secondary"
              style={{ padding: '3px 6px' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Days of Week Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
            {DAYS_OF_WEEK.map((d) => (
              <span
                key={d}
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'JetBrains Mono',
                  color: 'var(--text-muted)',
                  paddingBottom: '4px',
                }}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                selectedDate &&
                selectedDate.getFullYear() === viewYear &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getDate() === day;

              const today = new Date();
              const isToday =
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth &&
                today.getDate() === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  style={{
                    height: '28px',
                    borderRadius: '4px',
                    border: isToday && !isSelected ? '1px solid var(--accent)' : 'none',
                    backgroundColor: isSelected
                      ? 'var(--accent)'
                      : 'transparent',
                    color: isSelected
                      ? '#12161C'
                      : isToday
                      ? 'var(--accent)'
                      : 'var(--text-primary)',
                    fontWeight: isSelected || isToday ? 700 : 400,
                    fontSize: '0.78rem',
                    fontFamily: 'JetBrains Mono',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 100ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Today Shortcut */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <button
              type="button"
              onClick={(e) => handleQuickPreset(0, e)}
              className="btn btn-sm btn-secondary"
              style={{ fontSize: '0.72rem', padding: '2px 10px' }}
            >
              Select Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
