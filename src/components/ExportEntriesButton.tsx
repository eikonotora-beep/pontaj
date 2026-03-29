import React, { useState } from "react";
import { getAllCalendars } from "../utils/storage";
// @ts-ignore
import { utcToZonedTime, format as formatTz } from 'date-fns-tz';
import { isWeekend, isRomanianHoliday, isWeekday, timeToMinutes } from "../utils/dateUtils";
import { DayEntry } from "../types";
import "../styles/HolidayManager.css";
// @ts-ignore
import * as XLSX from "xlsx";

const ExportEntriesButton: React.FC = () => {
  const [year, setYear] = useState<string>("");
  const [month, setMonth] = useState<string>("");


  const calendars = getAllCalendars();
  const allEntries = calendars.flatMap((c) => c.entries || []);

  const years = Array.from(new Set(allEntries.map(e => e.date.slice(0, 4))));
  years.sort();

  const months = Array.from(new Set(
    allEntries
      .filter(e => !year || e.date.startsWith(year))
      .map(e => e.date.slice(5, 7))
  ));
  months.sort();

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.abs(mins % 60);
    return `${h}h ${m}m`;
  };

  const calculateMonthlyForEntries = (entries: DayEntry[], yearNum: number, monthNum: number) => {
    const monthEntries = entries.filter((entry) => {
      const d = new Date(entry.date);
      return d.getFullYear() === yearNum && d.getMonth() === monthNum;
    });

    let totalOL = 0;
    let totalWeekend = 0;

    monthEntries.forEach((entry) => {
      const entryDate = new Date(entry.date);
      const isWeekendOrHoliday = isRomanianHoliday(entryDate) || isWeekend(entryDate);

      entry.shifts.forEach((shift) => {
        totalOL += shift.duration || 0;

        if (shift.type === "day" && isWeekendOrHoliday) {
          totalWeekend += shift.duration;
        }

        if (shift.type === "night") {
          const nextDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate() + 1);
          const isNextWeekendOrHoliday = isRomanianHoliday(nextDate) || isWeekend(nextDate);

          if (isWeekendOrHoliday && isNextWeekendOrHoliday) {
            totalWeekend += shift.duration;
          } else if (isWeekendOrHoliday && !isNextWeekendOrHoliday) {
            const startMinutes = timeToMinutes(shift.startTime);
            totalWeekend += 24 * 60 - startMinutes;
          } else if (!isWeekendOrHoliday && isNextWeekendOrHoliday) {
            const endMinutes = timeToMinutes(shift.endTime);
            totalWeekend += endMinutes;
          }
        }
      });
    });

    let ftlDays = 0;
    const daysInMonth = new Date(yearNum, monthNum + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(yearNum, monthNum, d);
      if (isWeekday(dayDate) && !isRomanianHoliday(dayDate)) {
        ftlDays += 1;
      }
    }

    const totalFTL = ftlDays * 8 * 60;
    const osMonth = totalOL - totalFTL;

    return { totalOL, totalWeekend, totalFTL, osMonth };
  };

  const exportMonthSummary = () => {
    if (!year || !month) {
      alert("Please select both year and month for monthly export.");
      return;
    }

    if (calendars.length === 0) {
      alert("No calendars found to export.");
      return;
    }

    const yearNum = Number(year);
    const monthNum = Number(month) - 1;

    const rows = calendars.map((calendar) => {
      const summary = calculateMonthlyForEntries(calendar.entries, yearNum, monthNum);
      return {
        Calendar: calendar.name || calendar.id,
        Month: `${year}-${month}`,
        OS: formatMinutes(summary.osMonth),
        WeekendHours: formatMinutes(summary.totalWeekend),
      };
    });

    const totals = calendars.reduce(
      (acc, calendar) => {
        const summary = calculateMonthlyForEntries(calendar.entries, yearNum, monthNum);
        acc.os += summary.osMonth;
        acc.weekend += summary.totalWeekend;
        return acc;
      },
      { os: 0, weekend: 0 }
    );

    rows.push({
      Calendar: "ALL CALENDARS",
      Month: `${year}-${month}`,
      OS: formatMinutes(totals.os),
      WeekendHours: formatMinutes(totals.weekend),
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly OS Weekend");
    XLSX.writeFile(wb, `pontaj-all-calendars-${year}-${month}-summary.xlsx`);
  };

  const exportYearSummary = () => {
    if (!year) {
      alert("Please select a year for yearly export.");
      return;
    }

    if (calendars.length === 0) {
      alert("No calendars found to export.");
      return;
    }

    const yearNum = Number(year);

    const cleanLabel = (label: string) =>
      label
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[^a-zA-Z0-9 _-]/g, "")
        .replace(/\s+/g, "_");

    const calendarLabels = calendars.map((calendar) => ({
      id: calendar.id,
      name: calendar.name || calendar.id,
      safe: cleanLabel(calendar.name || calendar.id),
    }));

    const header = ["Month"] as string[];
    calendarLabels.forEach((c) => {
      header.push(`${c.name} OS`, `${c.name} Weekend`);
    });
    header.push("ALL CALENDARS OS", "ALL CALENDARS Weekend");

    const sheetData: Array<(string | number)[]> = [header];

    let yearlyTotals: { [key: string]: { os: number; weekend: number } } = {};
    calendarLabels.forEach((c) => {
      yearlyTotals[c.safe] = { os: 0, weekend: 0 };
    });
    yearlyTotals.ALL = { os: 0, weekend: 0 };

    for (let m = 0; m < 12; m++) {
      const monthKey = `${year}-${String(m + 1).padStart(2, "0")}`;
      const row: (string | number)[] = [monthKey];
      let monthAllOs = 0;
      let monthAllWeekend = 0;

      calendarLabels.forEach((c) => {
        const summary = calculateMonthlyForEntries(
          calendars.find((cal) => cal.id === c.id)?.entries || [],
          yearNum,
          m
        );
        row.push(formatMinutes(summary.osMonth), formatMinutes(summary.totalWeekend));
        yearlyTotals[c.safe].os += summary.osMonth;
        yearlyTotals[c.safe].weekend += summary.totalWeekend;
        monthAllOs += summary.osMonth;
        monthAllWeekend += summary.totalWeekend;
      });

      yearlyTotals.ALL.os += monthAllOs;
      yearlyTotals.ALL.weekend += monthAllWeekend;

      row.push(formatMinutes(monthAllOs), formatMinutes(monthAllWeekend));
      sheetData.push(row);
    }

    const totalRow: (string | number)[] = ["YEARLY TOTAL"];
    calendarLabels.forEach((c) => {
      totalRow.push(
        formatMinutes(yearlyTotals[c.safe].os),
        formatMinutes(yearlyTotals[c.safe].weekend)
      );
    });
    totalRow.push(formatMinutes(yearlyTotals.ALL.os), formatMinutes(yearlyTotals.ALL.weekend));
    sheetData.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!cols"] = Array(sheetData[0].length).fill({ wch: 16 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yearly OS Weekend");
    XLSX.writeFile(wb, `pontaj-all-calendars-${year}-summary.xlsx`);
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
        <button
          onClick={exportMonthSummary}
          style={{ flex: "1 1 160px", minWidth: 110, maxWidth: 220 }}
        >
          Export month OS + Weekend (all calendars)
        </button>
        <button
          onClick={exportYearSummary}
          style={{ flex: "1 1 160px", minWidth: 110, maxWidth: 220 }}
        >
          Export year OS + Weekend (all calendars)
        </button>
      </div>
    </div>
  );
};

export default ExportEntriesButton;
