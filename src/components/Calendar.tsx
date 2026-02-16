import React, { useEffect, useState, useCallback } from "react";
import { DayEntry, MonthSummary } from "../types/index";
import {
  isRomanianHoliday,
  isWeekend,
  isWeekday,
} from "../utils/dateUtils";
import {
  getAllEntries,
  calculateMonthlySummary,
  getEntryByDate,
} from "../utils/storage";
import "../styles/Calendar.css";

interface CalendarProps {
  onDayClick: (date: Date) => void;
  selectedDate?: Date;
}

const Calendar: React.FC<CalendarProps> = ({ onDayClick, selectedDate }) => {
  // Use sessionStorage to persist the last viewed month/year across re-renders (but not full refresh)
  const getInitialDate = () => {
    const saved = sessionStorage.getItem('calendar_lastViewedMonth');
    if (saved) {
      const d = new Date(saved);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };
  const [currentDate, setCurrentDate] = useState(getInitialDate());
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [entries, setEntries] = useState<DayEntry[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    setEntries(getAllEntries());
    const monthlySummary = calculateMonthlySummary(year, month);
    setSummary(monthlySummary);
    // Save last viewed month/year in sessionStorage
    sessionStorage.setItem('calendar_lastViewedMonth', currentDate.toISOString());
  }, [currentDate, year, month]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const getDayClass = (day: number): string => {
    const date = new Date(year, month, day);
    const dateStr = date.toDateString();
    const isSelected = selectedDate?.toDateString() === dateStr;
    const holiday = isRomanianHoliday(date) ? "holiday" : "";
    const weekend = isWeekend(date) ? "weekend" : "";
    const hasEntry = entries.some(
      (e) => new Date(e.date).toDateString() === dateStr
    );

    return `calendar-day ${holiday} ${weekend} ${isSelected ? "selected" : ""} ${
      hasEntry ? "has-entry" : ""
    }`.trim();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days = [];

  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-empty"></div>);
  }

  // Cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const entry = getEntryByDate(date);

    // determine shift label to show: CS > CO > CM > INV > day > night
    let shiftLabel: string | null = null;
    if (entry && entry.shifts && entry.shifts.length > 0) {
      const types = entry.shifts.map((s) => s.type);
      if (types.includes("cs")) shiftLabel = "CS";
      else if (types.includes("co")) shiftLabel = "CO";
      else if (types.includes("cm")) shiftLabel = "CM";
      else if (types.includes("inv")) shiftLabel = "INV";
      else if (types.includes("day")) shiftLabel = "D";
      else if (types.includes("night")) shiftLabel = "N";
    }

    days.push(
      <div
        key={day}
        className={getDayClass(day)}
        onClick={() => onDayClick(date)}
      >
        <span className="day-number">{day}</span>
        {isRomanianHoliday(date) && (
          <span className="holiday-indicator">●</span>
        )}
        {shiftLabel && (
          <span className="shift-indicator">{shiftLabel}</span>
        )}
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="nav-btn">
          ‹
        </button>
        <h2>
          {currentDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <button onClick={handleNextMonth} className="nav-btn">
          ›
        </button>
      </div>

      <div className="weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">{days}</div>

      {summary && (
        <div className="calendar-summary">
          <div className="summary-section">
            <div className="summary-item">
              <label>FTL (Full-time expected):</label>
              <span className="summary-value">
                {Math.floor(summary.totalFTL / 60)}h {summary.totalFTL % 60}m
              </span>
            </div>
            <div className="summary-item">
              <label>Total Hours (OL):</label>
              <span className="summary-value">
                {Math.floor(summary.totalOL / 60)}h{" "}
                {summary.totalOL % 60}m
              </span>
            </div>
            <div className="summary-item">
              <label>Weekend Hours:</label>
              <span className="summary-value">
                {Math.floor(summary.totalWeekend / 60)}h{" "}
                {summary.totalWeekend % 60}m
              </span>
            </div>
            <div className="summary-item">
              <label>OS:</label>
              <span className="summary-value">
                {Math.floor(summary.osMonth / 60)}h {summary.osMonth % 60}m
              </span>
            </div>
            <div className="summary-item">
              <label>OS Total:</label>
              <span className="summary-value">
                {(() => {
                  const val = summary.osTotal;
                  const sign = val < 0 ? "-" : "";
                  const abs = Math.abs(val);
                  return `${sign}${Math.floor(abs / 60)}h ${abs % 60}m`;
                })()}
              </span>
            </div>
            <div className="summary-item">
              <label>CS:</label>
              <span className="summary-value">
                {Math.floor(summary.csTotal / 60)}h {summary.csTotal % 60}m
              </span>
            </div>
            <div className="summary-item">
              <label style={{ color: "#ff6b6b", fontWeight: 700 }}>⚠️ OS Debt (90d):</label>
              <span className="summary-value" style={{ color: "#ff6b6b", fontWeight: 700 }}>
                {Math.floor(summary.osDebt90d / 60)}h {summary.osDebt90d % 60}m
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
