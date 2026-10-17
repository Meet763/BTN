import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

export interface GiftPickerOption {
  value: string;
  label: string;
}

interface GiftPickerProps {
  value: string;
  placeholder: string;
  options: GiftPickerOption[];
  onChange: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyHint?: string;
}

export const GiftPicker: React.FC<GiftPickerProps> = ({
  value,
  placeholder,
  options,
  onChange,
  searchable = false,
  searchPlaceholder = 'Search',
  emptyHint = 'Type to search',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);
  const needsQuery = searchable && options.length > 40;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (needsQuery && q.length < 1) return [];
    const pool = q ? options.filter((option) => option.label.toLowerCase().includes(q)) : options;
    return pool.slice(0, needsQuery ? 40 : 80);
  }, [needsQuery, options, query]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 30);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  return (
    <div className="gift-picker" ref={rootRef}>
      <button
        type="button"
        className={`gift-picker-trigger${selected ? '' : ' is-empty'}`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setOpen((current) => !current);
          setQuery('');
        }}
      >
        <span>{selected?.label || placeholder}</span>
        <span className="gift-picker-chevron" aria-hidden />
      </button>
      {open && (
        <div className="gift-picker-panel" id={listId}>
          {searchable && (
            <input
              ref={searchRef}
              className="gift-picker-search"
              value={query}
              placeholder={searchPlaceholder}
              onChange={(event) => setQuery(event.target.value)}
            />
          )}
          <div className="gift-picker-list" role="listbox">
            {shown.length === 0 && <p className="gift-picker-empty">{needsQuery && !query.trim() ? emptyHint : 'No matches'}</p>}
            {shown.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`gift-picker-option${option.value === value ? ' is-selected' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  setQuery('');
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
