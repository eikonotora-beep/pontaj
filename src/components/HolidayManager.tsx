import React, { useState } from "react";
import { romanianHolidays } from "../utils/dateUtils";
import "../styles/HolidayManager.css";

interface HolidayManagerProps {
  year: number;
  onHolidaysChange?: (holidays: string[]) => void;
}

const HolidayManager: React.FC<HolidayManagerProps> = ({ year, onHolidaysChange }) => {
  const [input, setInput] = useState("");
  // Use localStorage to persist manual holidays
  const storageKey = `manualHolidays_${year}`;
  const getInitialHolidays = () => {
    const stored = localStorage.getItem(storageKey);
    if (stored) return JSON.parse(stored);
    return romanianHolidays[year] ? [...romanianHolidays[year]] : [];
  };
  const [holidays, setHolidays] = useState<string[]>(getInitialHolidays());

  const handleAdd = () => {
    if (input && !holidays.includes(input)) {
      const newHolidays = [...holidays, input];
      setHolidays(newHolidays);
      localStorage.setItem(storageKey, JSON.stringify(newHolidays));
      if (onHolidaysChange) onHolidaysChange(newHolidays);
      setInput("");
    }
  };

  const handleRemove = (date: string) => {
    const newHolidays = holidays.filter((h) => h !== date);
    setHolidays(newHolidays);
    localStorage.setItem(storageKey, JSON.stringify(newHolidays));
    if (onHolidaysChange) onHolidaysChange(newHolidays);
  };

  return (
    <div className="holiday-manager">
      <h4>Manual Holidays ({year})</h4>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="date"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ width: 140 }}
        />
        <button onClick={handleAdd}>Add</button>
      </div>
      <ul style={{ marginTop: 8 }}>
        {holidays.map((h) => (
          <li key={h} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>{h}</span>
            <button onClick={() => handleRemove(h)} style={{ color: "red" }}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HolidayManager;
