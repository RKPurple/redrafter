import { useEffect, useRef, useState } from "react";
import "./YearSelector.css";

type YearSelectorProps = {
  years: number[];
  selectedYear: number;
  onChange: (year: number) => void;
};

export default function YearSelector({ years, selectedYear, onChange }: YearSelectorProps) {
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

  return (
    <div className="year-selector" ref={ref}>
      <button
        className={`year-pill${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="year-value">{selectedYear}</span>
        <svg
          className={`year-chevron${open ? " rotated" : ""}`}
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
        <ul className="year-dropdown" role="listbox">
          {years.map((year) => (
            <li
              key={year}
              className={`year-option${year === selectedYear ? " selected" : ""}`}
              role="option"
              aria-selected={year === selectedYear}
              onClick={() => {
                onChange(year);
                setOpen(false);
              }}
            >
              {year}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}