import { useEffect, useRef, useState } from "react";
import "./RedraftSlotsSelector.css";

type RedraftSlots = number | "all";

type SlotOption = {
  value: RedraftSlots;
  label: string;
};

const SLOT_OPTIONS: SlotOption[] = [
  { value: "all", label: "All Picks" },
  { value: 5,     label: "Top 5" },
  { value: 14,    label: "Lottery Picks" },
  { value: 30,    label: "First Round" },
];

type RedraftSlotsSelectorProps = {
  selected: RedraftSlots;
  onChange: (value: RedraftSlots) => void;
};

export default function RedraftSlotsSelector({ selected, onChange }: RedraftSlotsSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = SLOT_OPTIONS.find((o) => o.value === selected)?.label ?? "All Picks";

  return (
    <div className="redraft-slots-selector" ref={ref}>
      <button
        className={`redraft-slots-pill${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="redraft-slots-value">{selectedLabel}</span>
        <svg
          className={`redraft-slots-chevron${open ? " rotated" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="2 5 7 10 12 5" />
        </svg>
      </button>

      {open && (
        <ul className="redraft-slots-dropdown" role="listbox">
          {SLOT_OPTIONS.map((option) => (
            <li
              key={option.value}
              className={`redraft-slots-option${option.value === selected ? " selected" : ""}`}
              role="option"
              aria-selected={option.value === selected}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}