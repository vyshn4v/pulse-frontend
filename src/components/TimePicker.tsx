import React, { useState, useRef, useEffect } from 'react';
import { Clock, Check, Search, List, Sliders, X } from 'lucide-react';

interface TimePickerProps {
  value: string; // 'HH:MM' 24-hour format e.g. '09:00', '18:30'
  onChange: (value: string) => void;
  placeholder?: string;
  accentColor?: string; // Optional accent override e.g. '#5FA8A0'
}

// Generate all 96 standard 15-minute time slots in a 24-hour day (00:00 to 23:45)
const ALL_TIME_SLOTS: Array<{ value: string; label12: string; label24: string; period: string }> = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const h24Str = String(h).padStart(2, '0');
    const mStr = String(m).padStart(2, '0');
    const val = `${h24Str}:${mStr}`;

    const period = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    const label12 = `${String(h12).padStart(2, '0')}:${mStr} ${period}`;
    const label24 = `${h24Str}:${mStr} IST`;

    ALL_TIME_SLOTS.push({ value: val, label12, label24, period });
  }
}

// Generate all 24 hours
const ALL_HOURS_24 = Array.from({ length: 24 }, (_, i) => {
  const h24Str = String(i).padStart(2, '0');
  const period = i >= 12 ? 'PM' : 'AM';
  let h12 = i % 12;
  if (h12 === 0) h12 = 12;
  return {
    h24: i,
    h24Str,
    label: `${String(h12).padStart(2, '0')} ${period} (${h24Str}:00)`,
  };
});

// Generate all 60 minutes
const ALL_MINUTES_60 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const TimePicker: React.FC<TimePickerProps> = ({
  value = '09:00',
  onChange,
  placeholder = 'Select time',
  accentColor = 'var(--accent)',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'slots' | 'precise'>('slots');
  const [slotSearch, setSlotSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const slotListRef = useRef<HTMLDivElement>(null);

  // Parse current 24-hour HH:MM value
  const parseCurrentTime = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(':')) {
      return { h24: 9, m: 0, h24Str: '09', mStr: '00', display12: '09:00 AM' };
    }
    const [hStr, mStr] = timeStr.split(':');
    const h = Math.min(23, Math.max(0, parseInt(hStr, 10) || 0));
    const m = Math.min(59, Math.max(0, parseInt(mStr, 10) || 0));
    const h24Str = String(h).padStart(2, '0');
    const mStrPad = String(m).padStart(2, '0');

    const period = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    const display12 = `${String(h12).padStart(2, '0')}:${mStrPad} ${period}`;

    return { h24: h, m, h24Str, mStr: mStrPad, display12 };
  };

  const parsed = parseCurrentTime(value);

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

  // Auto-scroll selected slot into view when popover opens
  useEffect(() => {
    if (isOpen && activeTab === 'slots' && slotListRef.current) {
      const selectedEl = slotListRef.current.querySelector('[data-selected="true"]') as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [isOpen, activeTab]);

  const handleSelectSlot = (slotValue: string) => {
    onChange(slotValue);
    setIsOpen(false);
  };

  const handleSelectHour = (h24: number) => {
    const newTime = `${String(h24).padStart(2, '0')}:${parsed.mStr}`;
    onChange(newTime);
  };

  const handleSelectMinute = (mStr: string) => {
    const newTime = `${parsed.h24Str}:${mStr}`;
    onChange(newTime);
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    const h24 = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    onChange(`${h24}:${m}`);
    setIsOpen(false);
  };

  // Filter slots by search query
  const filteredSlots = ALL_TIME_SLOTS.filter((slot) => {
    if (!slotSearch.trim()) return true;
    const q = slotSearch.toLowerCase().trim();
    return (
      slot.value.toLowerCase().includes(q) ||
      slot.label12.toLowerCase().includes(q) ||
      slot.label24.toLowerCase().includes(q) ||
      slot.period.toLowerCase().includes(q)
    );
  });

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Main Trigger Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: '#0e1217',
          border: isOpen ? `1px solid ${accentColor}` : '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          cursor: 'pointer',
          userSelect: 'none',
          boxShadow: isOpen ? `0 0 0 1px ${accentColor}` : 'none',
          transition: 'all 120ms ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={15} color={accentColor} />
          <span
            style={{
              fontSize: '0.86rem',
              fontFamily: 'JetBrains Mono',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {parsed.display12}
          </span>
        </div>

        <span
          style={{
            fontSize: '0.72rem',
            fontFamily: 'JetBrains Mono',
            color: 'var(--text-muted)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '2px 6px',
            borderRadius: '3px',
          }}
        >
          {parsed.h24Str}:{parsed.mStr} IST
        </span>
      </div>

      {/* Popover Selection Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 300,
            width: 'min(300px, 92vw)',
            backgroundColor: '#12161c',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.75)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Header & Mode Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('slots')}
                className={`btn btn-sm ${activeTab === 'slots' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <List size={12} />
                <span>All Times (24h)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('precise')}
                className={`btn btn-sm ${activeTab === 'precise' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sliders size={12} />
                <span>Custom Hr:Min</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSetCurrentTime}
              className="btn btn-sm btn-secondary"
              style={{ padding: '3px 6px', fontSize: '0.68rem' }}
              title="Set to current local time"
            >
              Now
            </button>
          </div>

          {/* TAB 1: ALL POSSIBLE TIME SLOTS (Complete 24-Hour Scrollable List) */}
          {activeTab === 'slots' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Search Filter Box */}
              <div style={{ position: 'relative' }}>
                <Search
                  size={12}
                  style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  placeholder="Filter (e.g. 9:00, 18:30, PM)..."
                  value={slotSearch}
                  onChange={(e) => setSlotSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 8px 4px 26px',
                    fontSize: '0.78rem',
                    fontFamily: 'JetBrains Mono',
                  }}
                  autoFocus
                />
              </div>

              {/* Scrollable Slots Container (96 intervals across full 24h) */}
              <div
                ref={slotListRef}
                style={{
                  maxHeight: '230px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  paddingRight: '4px',
                }}
              >
                {filteredSlots.map((slot) => {
                  const isSelected = value === slot.value;
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      data-selected={isSelected}
                      onClick={() => handleSelectSlot(slot.value)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: isSelected ? `1px solid ${accentColor}` : '1px solid transparent',
                        backgroundColor: isSelected ? accentColor : 'transparent',
                        color: isSelected ? '#12161C' : 'var(--text-primary)',
                        fontFamily: 'JetBrains Mono',
                        fontSize: '0.8rem',
                        fontWeight: isSelected ? 700 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 100ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#1b2028';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{slot.label12}</span>
                        {slot.value === '09:00' && (
                          <span style={{ fontSize: '0.62rem', padding: '1px 4px', borderRadius: '2px', backgroundColor: isSelected ? '#12161C' : 'rgba(232, 163, 61, 0.2)', color: isSelected ? accentColor : 'var(--accent)' }}>
                            PEAK
                          </span>
                        )}
                        {slot.value === '12:30' && (
                          <span style={{ fontSize: '0.62rem', padding: '1px 4px', borderRadius: '2px', backgroundColor: isSelected ? '#12161C' : 'rgba(95, 168, 160, 0.2)', color: isSelected ? accentColor : 'var(--accent-2)' }}>
                            LUNCH
                          </span>
                        )}
                        {slot.value === '18:30' && (
                          <span style={{ fontSize: '0.62rem', padding: '1px 4px', borderRadius: '2px', backgroundColor: isSelected ? '#12161C' : 'rgba(232, 163, 61, 0.2)', color: isSelected ? accentColor : 'var(--accent)' }}>
                            EVENING
                          </span>
                        )}
                      </div>

                      <span style={{ fontSize: '0.7rem', color: isSelected ? '#12161C' : 'var(--text-muted)' }}>
                        {slot.label24}
                      </span>
                    </button>
                  );
                })}

                {filteredSlots.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    No matching time slots found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DUAL SCROLLABLE HOUR (00-23) & MINUTE (00-59) SELECTORS */}
          {activeTab === 'precise' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* All 24 Hours Column */}
                <div>
                  <div style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', textAlign: 'center' }}>
                    Hour (00 - 23)
                  </div>
                  <div
                    style={{
                      maxHeight: '190px',
                      overflowY: 'auto',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      backgroundColor: 'var(--bg)',
                    }}
                  >
                    {ALL_HOURS_24.map((h) => {
                      const isSelected = parsed.h24 === h.h24;
                      return (
                        <button
                          key={h.h24}
                          type="button"
                          onClick={() => handleSelectHour(h.h24)}
                          style={{
                            padding: '4px 8px',
                            textAlign: 'left',
                            fontSize: '0.76rem',
                            fontFamily: 'JetBrains Mono',
                            fontWeight: isSelected ? 700 : 400,
                            backgroundColor: isSelected ? accentColor : 'transparent',
                            color: isSelected ? '#12161C' : 'var(--text-primary)',
                            borderRadius: '3px',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {h.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* All 60 Minutes Column */}
                <div>
                  <div style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', textAlign: 'center' }}>
                    Minute (00 - 59)
                  </div>
                  <div
                    style={{
                      maxHeight: '190px',
                      overflowY: 'auto',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '2px',
                      backgroundColor: 'var(--bg)',
                    }}
                  >
                    {ALL_MINUTES_60.map((mStr) => {
                      const isSelected = parsed.mStr === mStr;
                      return (
                        <button
                          key={mStr}
                          type="button"
                          onClick={() => handleSelectMinute(mStr)}
                          style={{
                            padding: '4px 0',
                            textAlign: 'center',
                            fontSize: '0.76rem',
                            fontFamily: 'JetBrains Mono',
                            fontWeight: isSelected ? 700 : 400,
                            backgroundColor: isSelected ? accentColor : 'transparent',
                            color: isSelected ? '#12161C' : 'var(--text-primary)',
                            borderRadius: '3px',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          :{mStr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Done Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--accent)', fontWeight: 600 }}>
              Selected: {parsed.display12} ({parsed.h24Str}:{parsed.mStr})
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-sm btn-primary"
              style={{ fontSize: '0.72rem', padding: '3px 12px' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
