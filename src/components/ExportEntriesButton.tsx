import React, { useState } from "react";
import { getAllEntries } from "../utils/storage";
// @ts-ignore
import { utcToZonedTime, format as formatTz } from 'date-fns-tz';
import { DayEntry, ShiftType } from "../types";
import "../styles/HolidayManager.css";
// @ts-ignore
import * as XLSX from "xlsx";

const shiftTypes = [
  "day", "night", "neither", "cs"
];

const ExportEntriesButton: React.FC = () => {
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [yearlyExport, setYearlyExport] = useState<boolean>(false);

  // Get all years present in entries
  const entries = getAllEntries();
  const years = Array.from(new Set(entries.map(e => e.date.slice(0, 4))));
  years.sort();

  // Get months present for selected year
  const months = Array.from(new Set(
    entries.filter(e => !year || e.date.startsWith(year)).map(e => e.date.slice(5, 7))
  ));
  months.sort();

  const handleExport = () => {
    if (yearlyExport && year) {
      // Yearly export: show monthly breakdown with OS
      const { calculateMonthlySummary } = require("../utils/storage");
      const months = Array.from({ length: 12 }, (_, i) => i + 1);
      const rows = months.map(m => {
        const summary = calculateMonthlySummary(Number(year), m - 1);
        return {
          Month: `${year}-${String(m).padStart(2, '0')}`,
          FTL: formatMinutes(summary.totalFTL ?? 0),
          OL: formatMinutes(summary.totalOL ?? 0),
          OS: formatMinutes(summary.osMonth ?? 0),
          WeekendHours: formatMinutes(summary.totalWeekend ?? 0),
          OSDebt: formatMinutes(summary.osDebt90d ?? 0)
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 10 }, // Month
        { wch: 10 }, // FTL
        { wch: 10 }, // OL
        { wch: 10 }, // OS
        { wch: 14 }, // WeekendHours
        { wch: 14 }, // OSDebt
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "YearlySummary");
      let fileName = `pontaj-yearly-summary-${year}.xlsx`;
      XLSX.writeFile(wb, fileName);
      return;
    }
    // ...existing code for monthly export...
    let filtered = entries;
    if (year) filtered = filtered.filter(e => e.date.startsWith(year));
    if (month) filtered = filtered.filter(e => e.date.slice(5, 7) === month);
    if (selectedShift) filtered = filtered.filter(e => e.shifts.some(s => s.type === selectedShift));
    if (!filtered.length) {
      alert("No entries to export for selected filters.");
      return;
    }
    // Calculate summary for the selected period
    let summary = null;
    if (year && month) {
      const { calculateMonthlySummary } = require("../utils/storage");
      summary = calculateMonthlySummary(Number(year), Number(month) - 1);
    } else if (year && !month) {
      // Sum all months in year
      const { calculateMonthlySummary } = require("../utils/storage");
      let totalWeekend = 0, osMonth = 0, osDebt90d = 0;
      for (let m = 0; m < 12; m++) {
        const s = calculateMonthlySummary(Number(year), m);
        totalWeekend += s.totalWeekend;
        osMonth += s.osMonth;
        osDebt90d += s.osDebt90d;
      }
      summary = { totalWeekend, osMonth, osDebt90d };
    }
    // Helper to calculate OS and weekend hours for a given entry
    function calcDayOS(entry: DayEntry): number {
      // FTL: 8h (480m) if weekday and not holiday, else 0
      const dateObj = new Date(entry.date);
      const { isWeekday, isWeekend, isRomanianHoliday } = require("../utils/dateUtils");
      const isWD = isWeekday(dateObj) && !isRomanianHoliday(dateObj);
      const ftl = isWD ? 480 : 0;
      const ol = entry.shifts.reduce((sum: number, s: { duration: number }) => sum + s.duration, 0);
      return ol - ftl;
    }
    function calcDayWeekend(entry: DayEntry, idx: number, entries: DayEntry[]): number {
      // Use the same robust logic as storage.ts, but always use the real next calendar day
      const { isWeekend, isRomanianHoliday } = require("../utils/dateUtils");
      const entryDate = new Date(entry.date);
      let total = 0;
      entry.shifts.forEach((shift: { type: ShiftType; duration: number }) => {
        if (shift.type === "night") {
          // Always use the next calendar day, not the next entry in the filtered list
          const nextDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate() + 1);
          const isCurrentHoliday = isRomanianHoliday(entryDate);
          const isCurrentWeekend = isWeekend(entryDate);
          const isNextHoliday = isRomanianHoliday(nextDate);
          const isNextWeekend = isWeekend(nextDate);
          // Rule 1: Night on weekend/holiday, next day also weekend/holiday: count actual hours
          if ((isCurrentHoliday || isCurrentWeekend) && (isNextHoliday || isNextWeekend)) {
            total += shift.duration;
          // Rule 2: Night on weekend/holiday, next day NOT weekend/holiday: count 5:15
          } else if ((isCurrentHoliday || isCurrentWeekend) && !(isNextHoliday || isNextWeekend)) {
            total += 5 * 60 + 15;
          // Rule 3: Night NOT on weekend/holiday, next day IS weekend/holiday: count 7:15
          } else if (!(isCurrentHoliday || isCurrentWeekend) && (isNextHoliday || isNextWeekend)) {
            total += 7 * 60 + 15;
          }
          // Otherwise, do not count night shift towards weekend hours
        }
      });
      // For other shifts: if the day is a weekend or holiday, count the full duration (except night shifts)
      if (isRomanianHoliday(entryDate) || isWeekend(entryDate)) {
        const nonNightMinutes = entry.shifts
          .filter((s: { type: ShiftType }) => s.type !== "night")
          .reduce(function(sum: number, s: any) {
            return sum + (typeof s.duration === 'number' ? s.duration : 0);
          }, 0);
        total += nonNightMinutes;
      }
      return total;
    }
    const allowedTypes = ["day", "night", "neither", "cs"];
    // Helper to format minutes as Hh Mm
    function formatMinutes(mins: number) {
      const h = Math.floor(mins / 60);
      const m = Math.abs(mins % 60);
      return `${h}h ${m}m`;
    }
    // Precompute OS and WeekendHours in minutes for summary
      let rows: Array<{
        Date: string;
        ID: string;
        ShiftType: string;
        Start: string;
        End: string;
        Duration: any;
        OS: any;
        WeekendHours: any;
        Notes: string;
      }> = filtered.flatMap((entry: DayEntry, idx: number, arr: DayEntry[]) => {
        // Format date for each entry
        let formattedDate = '';
        if (entry.date && typeof entry.date === 'string') {
          const dateMatch = /^\d{4}-\d{2}-\d{2}$/.test(entry.date);
          if (dateMatch) {
            const d = new Date(entry.date + 'T00:00:00');
            if (!isNaN(d.getTime())) {
              try {
                formattedDate = formatTz(utcToZonedTime(d, 'Europe/Bucharest'), 'yyyy-MM-dd', { timeZone: 'Europe/Bucharest' });
              } catch {
                formattedDate = entry.date;
              }
            } else {
              formattedDate = entry.date;
            }
          } else {
            formattedDate = entry.date;
          }
        }
        if (entry.shifts.length === 0) return [];
        return entry.shifts
          .filter((shift: { type: ShiftType }) => allowedTypes.includes(shift.type) && (!selectedShift || shift.type === selectedShift))
          .map((shift: { type: ShiftType; startTime: string; endTime: string; duration: number }, shiftIdx: number) => {
            const durationMins = Number(shift.duration);
            // Calculate weekend hours for this shift only
            let weekendMins = 0;
            const entryDateObj = new Date(entry.date);
            const { isWeekend, isRomanianHoliday } = require("../utils/dateUtils");
            const isWeekendOrHoliday = isRomanianHoliday(entryDateObj) || isWeekend(entryDateObj);
            if (shift.type === "day" && isWeekendOrHoliday) {
              weekendMins = durationMins;
            }
            if (shift.type === "night") {
              const nextDate = new Date(entryDateObj.getFullYear(), entryDateObj.getMonth(), entryDateObj.getDate() + 1);
              const isCurrentWeekendOrHoliday = isWeekendOrHoliday;
              const isNextWeekendOrHoliday = isRomanianHoliday(nextDate) || isWeekend(nextDate);
              if (isCurrentWeekendOrHoliday && isNextWeekendOrHoliday) {
                weekendMins = durationMins;
              } else if (isCurrentWeekendOrHoliday && !isNextWeekendOrHoliday) {
                weekendMins = 5 * 60 + 15;
              } else if (!isCurrentWeekendOrHoliday && isNextWeekendOrHoliday) {
                weekendMins = 7 * 60 + 15;
              }
            }
            return {
              Date: formattedDate,
              ID: entry.id,
              ShiftType: String(shift.type),
              Start: shift.startTime,
              End: shift.endTime,
              Duration: formatMinutes(durationMins),
              OS: "",
              WeekendHours: formatMinutes(weekendMins),
              Notes: entry.notes || ""
            };
          });
      });
      // Remove any voids (shouldn't be any, but for safety)
      rows = rows.filter(Boolean);
      // Compute totals after rows are created
      // Use the same OS total as the app summary (sum all OS minutes for the month)
      // Calculate OS total using the same logic as the app summary (sum per day using calcDayOS)
      // Calculate OL (total worked) and FTL (full-time expected) for the month
      let totalWorked = 0;
      let weekendTotal = 0;
      filtered.forEach((entry, idx) => {
        if (entry.shifts && entry.shifts.length > 0) {
          entry.shifts.forEach((shift) => {
            totalWorked += shift.duration || 0;
          });
        }
        weekendTotal += calcDayWeekend(entry, idx, filtered);
      });
      // FTL for the month (from summary if available)
      let ftl = summary && typeof summary.ftl === 'number' ? summary.ftl : 0;
      // OS is the difference between OL and FTL
      let osTotal = Math.max(0, totalWorked - ftl);
      // Add summary row: OL, FTL, OS, WeekendHours, OS Debt
      // Calculate OS as OL - FTL (in minutes)
      const osSummary = Math.max(0, totalWorked - ftl);
      // Add summary row: OL (total worked), FTL (expected), WeekendHours, OS Debt (no OS in monthly export)
      rows.push({
        Date: "SUMMARY",
        ID: "",
        ShiftType: "",
        Start: "",
        End: "",
        Duration: formatMinutes(totalWorked), // OL (total worked)
        OS: formatMinutes(ftl), // FTL (expected)
        WeekendHours: formatMinutes(weekendTotal),
        Notes: summary ? `OS Debt: ${formatMinutes(summary.osDebt90d ?? 0)}` : ""
      });
    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto-size columns for better readability
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 14 }, // ID
      { wch: 10 }, // ShiftType
      { wch: 8 },  // Start
      { wch: 8 },  // End
      { wch: 10 }, // Duration
      { wch: 10 }, // OS
      { wch: 14 }, // WeekendHours
      { wch: 30 }, // Notes
    ];
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Entries");
    let fileName = "pontaj-entries";
    if (year) fileName += `-${year}`;
    if (month) fileName += `-${month}`;
    if (selectedShift) fileName += `-${selectedShift}`;
    fileName += ".xlsx";
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="holiday-manager" style={{ marginTop: 24 }}>
      <h4>Export Entries</h4>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 8,
          width: "100%",
          justifyContent: "space-between"
        }}
      >
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          style={{ flex: "1 1 120px", minWidth: 90, maxWidth: 160 }}
        >
          <option value="">All Years</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          style={{ flex: "1 1 120px", minWidth: 90, maxWidth: 160 }}
        >
          <option value="">All Months</option>
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={selectedShift}
          onChange={e => setSelectedShift(e.target.value)}
          style={{ flex: "1 1 120px", minWidth: 90, maxWidth: 160 }}
        >
          <option value="">All Shifts</option>
          {shiftTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="checkbox"
            checked={yearlyExport}
            onChange={e => setYearlyExport(e.target.checked)}
            style={{ marginRight: 4 }}
          />
          Yearly export (monthly OS summary)
        </label>
        <button
          onClick={handleExport}
          style={{ flex: "1 1 120px", minWidth: 90, maxWidth: 160 }}
        >
          Export
        </button>
      </div>
    </div>
  );
};

export default ExportEntriesButton;
